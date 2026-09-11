import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getPersonalYoutubeFeed, getYoutubeConnectionStatus, getYoutubeConnectUrl, searchPublicYoutubeVideos, searchYoutubeVideos } from "./youtube";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  youtube: router({
    connection: protectedProcedure.query(({ ctx }) => getYoutubeConnectionStatus(ctx.user.id)),
    connectUrl: protectedProcedure.query(() => ({ url: getYoutubeConnectUrl() })),
    feed: protectedProcedure.query(({ ctx }) => getPersonalYoutubeFeed(ctx.user.id)),
    search: protectedProcedure.input(z.object({ query: z.string().trim().min(1).max(120) })).query(({ ctx, input }) => searchYoutubeVideos(ctx.user.id, input.query)),
    publicSearch: publicProcedure.input(z.object({ query: z.string().trim().min(1).max(120) })).query(({ input }) => searchPublicYoutubeVideos(input.query)),
  }),
});

export type AppRouter = typeof appRouter;
