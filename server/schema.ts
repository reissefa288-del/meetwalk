// server/schema.ts
import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/* USERS */
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  bio: text("bio"),
  age: integer("age"),
  gender: text("gender"),
  photos: text("photos").array().default(sql`'{}'::text[]`),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  isPremium: boolean("is_premium").default(false),
  premiumExpiresAt: timestamp("premium_expires_at"),
  maxDistance: integer("max_distance").default(3),
  minAge: integer("min_age").default(18),
  maxAge: integer("max_age").default(50),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  dailyUsageMinutes: integer("daily_usage_minutes").default(0),
  lastUsageReset: timestamp("last_usage_reset").defaultNow(),
  superLikeBalance: integer("super_like_balance").default(0),
});

/* LIKES */
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  isSuperLike: boolean("is_super_like").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/* MATCHES */
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

/* MESSAGES */
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/* SCHEMAS */
export const insertUserSchema = createInsertSchema(users);
export const insertLikeSchema = createInsertSchema(likes);
export const insertMatchSchema = createInsertSchema(matches);
export const insertMessageSchema = createInsertSchema(messages);

/* TYPES */
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Like = typeof likes.$inferSelect;
export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;