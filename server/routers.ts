import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getPersonalYoutubeFeed, getYoutubeConnectionStatus, getYoutubeConnectUrl } from "./youtube";

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
  }),
});

export type AppRouter = typeof appRouter;
