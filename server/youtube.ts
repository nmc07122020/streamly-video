import crypto from "node:crypto";
import type { Express, Request, Response } from "express";
import { parse as parseCookieHeader } from "cookie";
import { eq } from "drizzle-orm";
import { youtubeConnections } from "../drizzle/schema";
import * as db from "./db";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const YOUTUBE_STATE_COOKIE = "streamly_youtube_oauth_state";
const YOUTUBE_SCOPE = "openid email https://www.googleapis.com/auth/youtube.readonly";
const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type YoutubeListResponse<T> = {
  items?: T[];
  nextPageToken?: string;
  error?: { message?: string };
};

type YoutubeSubscription = {
  snippet?: { title?: string; resourceId?: { channelId?: string }; thumbnails?: { default?: { url?: string } } };
  contentDetails?: { totalItemCount?: number };
  subscriberSnippet?: { title?: string };
  id?: string;
  resourceId?: { channelId?: string };
};

type YoutubeChannel = {
  id?: string;
  snippet?: { title?: string; thumbnails?: { default?: { url?: string }; medium?: { url?: string } } };
  contentDetails?: { relatedPlaylists?: { uploads?: string } };
};

type YoutubePlaylistItem = {
  contentDetails?: { videoId?: string; videoPublishedAt?: string };
  snippet?: {
    title?: string;
    channelTitle?: string;
    channelId?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
  };
};

type YoutubeVideoDetails = {
  id?: string;
  snippet?: { categoryId?: string };
};

const youtubeCategoryNames: Record<string, string> = {
  "10": "Music",
  "19": "Travel",
  "20": "Gaming",
  "25": "News",
  "26": "Design",
  "27": "Education",
  "28": "Tech",
};

export function getYoutubeCategoryName(categoryId: string | undefined) {
  return youtubeCategoryNames[categoryId ?? ""] ?? "All";
}

function getRedirectUri(req: Request) {
  const protocol = (req.get("x-forwarded-proto") ?? req.protocol).split(",")[0];
  const host = req.get("x-forwarded-host") ?? req.get("host");
  return `${protocol}://${host}/api/youtube/oauth/callback`;
}

function getOrigin(req: Request) {
  const protocol = (req.get("x-forwarded-proto") ?? req.protocol).split(",")[0];
  const host = req.get("x-forwarded-host") ?? req.get("host");
  return `${protocol}://${host}`;
}

function getQueryParam(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function encryptionKey() {
  const secret = process.env.JWT_SECRET || "streamly-youtube-development-key";
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(value: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

function decrypt(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) throw new Error("Invalid encrypted YouTube token");
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedPart, "base64url")), decipher.final()]).toString("utf8");
}

async function googleTokenRequest(params: URLSearchParams) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const body = await response.json() as GoogleTokenResponse;
  if (!response.ok || !body.access_token) {
    throw new Error(body.error_description || body.error || "Google token request failed");
  }
  return body;
}

async function youtubeRequest<T>(path: string, accessToken: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const body = await response.json() as YoutubeListResponse<T>;
  if (!response.ok) throw new Error(body.error?.message || `YouTube ${path} request failed`);
  return body;
}

async function getAccessToken(connection: Awaited<ReturnType<typeof db.getYoutubeConnection>>) {
  if (!connection) throw new Error("YouTube is not connected");
  const now = Date.now();
  if (connection.accessToken && connection.accessTokenExpiresAt && connection.accessTokenExpiresAt > now + 60_000) {
    return decrypt(connection.accessToken);
  }
  const token = await googleTokenRequest(new URLSearchParams({
    client_id: ENV.youtubeClientId,
    client_secret: ENV.youtubeClientSecret,
    refresh_token: decrypt(connection.refreshToken),
    grant_type: "refresh_token",
  }));
  const accessTokenExpiresAt = now + (token.expires_in ?? 3600) * 1000;
  await db.updateYoutubeAccessToken(connection.userId, encrypt(token.access_token!), accessTokenExpiresAt);
  return token.access_token!;
}

export async function getYoutubeConnectionStatus(userId: number) {
  const connection = await db.getYoutubeConnection(userId);
  if (!connection) return { connected: false as const, channelTitle: null, channelId: null };
  return { connected: true as const, channelTitle: connection.channelTitle, channelId: connection.channelId };
}

export function getYoutubeChannelIds(channelId: string | null | undefined, subscriptionIds: string[]) {
  return Array.from(new Set([channelId, ...subscriptionIds].filter((id): id is string => Boolean(id))));
}

export async function getPersonalYoutubeFeed(userId: number) {
  const connection = await db.getYoutubeConnection(userId);
  if (!connection) return { connected: false as const, videos: [], subscriptions: [] };
  const accessToken = await getAccessToken(connection);
  const subscriptionsResponse = await youtubeRequest<YoutubeSubscription>("subscriptions", accessToken, {
    part: "snippet",
    mine: "true",
    maxResults: "25",
  });
  const subscriptions = (subscriptionsResponse.items ?? []).map((item) => ({
    channelId: item.snippet?.resourceId?.channelId ?? item.resourceId?.channelId ?? "",
    title: item.snippet?.title ?? item.subscriberSnippet?.title ?? "YouTube channel",
  })).filter((item) => item.channelId);
  const channelIds = getYoutubeChannelIds(connection.channelId, subscriptions.map((item) => item.channelId)).join(",");
  if (!channelIds) return { connected: true as const, videos: [], subscriptions };
  const channelsResponse = await youtubeRequest<YoutubeChannel>("channels", accessToken, {
    part: "snippet,contentDetails",
    id: channelIds,
    maxResults: "50",
  });
  const uploads = (channelsResponse.items ?? []).map((channel) => channel.contentDetails?.relatedPlaylists?.uploads).filter(Boolean) as string[];
  const batches = await Promise.all(uploads.slice(0, 12).map((playlistId) => youtubeRequest<YoutubePlaylistItem>("playlistItems", accessToken, {
    part: "snippet,contentDetails",
    playlistId,
    maxResults: "4",
  })));
  const playlistVideos = batches.flatMap((batch) => batch.items ?? []).map((item) => ({
    id: item.contentDetails?.videoId ?? "",
    title: item.snippet?.title ?? "Untitled video",
    creator: item.snippet?.channelTitle ?? "YouTube creator",
    channelId: item.snippet?.channelId ?? "",
    thumbnail: item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? "",
    publishedAt: item.contentDetails?.videoPublishedAt ?? item.snippet?.publishedAt ?? "",
    url: `https://www.youtube.com/watch?v=${item.contentDetails?.videoId ?? ""}`,
  })).filter((item) => item.id).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 30);
  const details = playlistVideos.length
    ? await youtubeRequest<YoutubeVideoDetails>("videos", accessToken, { part: "snippet", id: playlistVideos.map((video) => video.id).join(",") })
    : { items: [] as YoutubeVideoDetails[] };
  const categoryByVideoId = new Map((details.items ?? []).map((item) => [item.id, getYoutubeCategoryName(item.snippet?.categoryId)]));
  const videos = playlistVideos.map((video) => ({ ...video, category: categoryByVideoId.get(video.id) ?? "All" }));
  return { connected: true as const, videos, subscriptions };
}

export function getYoutubeConnectUrl() {
  return "/api/youtube/oauth/start";
}

export function registerYoutubeRoutes(app: Express) {
  app.get("/api/youtube/oauth/start", async (req: Request, res: Response) => {
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.redirect(302, "/?youtube=login");
      return;
    }
    const state = crypto.randomBytes(32).toString("hex");
    res.cookie(YOUTUBE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: OAUTH_STATE_MAX_AGE,
      path: "/",
    });
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", ENV.youtubeClientId);
    url.searchParams.set("redirect_uri", getRedirectUri(req));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", YOUTUBE_SCOPE);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("state", state);
    res.redirect(302, url.toString());
  });

  app.get("/api/youtube/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    const cookieState = parseCookieHeader(req.headers.cookie ?? "")[YOUTUBE_STATE_COOKIE];
    if (!code || !state || !cookieState || state !== cookieState) {
      res.status(403).send("Invalid YouTube OAuth state. Please try connecting again.");
      return;
    }
    res.clearCookie(YOUTUBE_STATE_COOKIE, { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    const user = await sdk.authenticateRequest(req).catch(() => null);
    if (!user) {
      res.redirect(302, "/?youtube=login");
      return;
    }
    try {
      const token = await googleTokenRequest(new URLSearchParams({
        code,
        client_id: ENV.youtubeClientId,
        client_secret: ENV.youtubeClientSecret,
        redirect_uri: getRedirectUri(req),
        grant_type: "authorization_code",
      }));
      const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
      const userInfo = await userInfoResponse.json() as { sub?: string };
      if (!userInfoResponse.ok || !userInfo.sub) throw new Error("Google user identity is unavailable");
      const channelResponse = await youtubeRequest<YoutubeChannel>("channels", token.access_token!, { part: "snippet", mine: "true" });
      const channel = channelResponse.items?.[0];
      const existing = await db.getYoutubeConnection(user.id);
      const refreshToken = token.refresh_token ? encrypt(token.refresh_token) : existing?.refreshToken;
      if (!refreshToken) throw new Error("Google did not return a refresh token; please reconnect and approve offline access");
      await db.upsertYoutubeConnection({
        userId: user.id,
        googleSubject: userInfo.sub,
        channelId: channel?.id ?? null,
        channelTitle: channel?.snippet?.title ?? null,
        refreshToken,
        accessToken: encrypt(token.access_token!),
        accessTokenExpiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
        scope: token.scope ?? YOUTUBE_SCOPE,
      });
      res.redirect(302, "/?youtube=connected");
    } catch (error) {
      console.error("[YouTube OAuth] Callback failed", error);
      res.redirect(302, `${getOrigin(req)}/?youtube=error`);
    }
  });
}

export { decrypt, encrypt };
