import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const youtubeConnections = mysqlTable("youtubeConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  googleSubject: varchar("googleSubject", { length: 255 }).notNull(),
  channelId: varchar("channelId", { length: 64 }),
  channelTitle: text("channelTitle"),
  refreshToken: text("refreshToken").notNull(),
  accessToken: text("accessToken"),
  accessTokenExpiresAt: bigint("accessTokenExpiresAt", { mode: "number" }),
  scope: text("scope"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type YoutubeConnection = typeof youtubeConnections.$inferSelect;
export type InsertYoutubeConnection = typeof youtubeConnections.$inferInsert;
