import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table with CS stats
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  // CS:GO Stats
  nickname: varchar("nickname"),
  totalKills: integer("total_kills").default(0).notNull(),
  totalDeaths: integer("total_deaths").default(0).notNull(),
  totalAssists: integer("total_assists").default(0).notNull(),
  totalHeadshots: integer("total_headshots").default(0).notNull(),
  totalMatches: integer("total_matches").default(0).notNull(),
  matchesWon: integer("matches_won").default(0).notNull(),
  matchesLost: integer("matches_lost").default(0).notNull(),
  totalRoundsPlayed: integer("total_rounds_played").default(0).notNull(),
  roundsWon: integer("rounds_won").default(0).notNull(),
  totalMvps: integer("total_mvps").default(0).notNull(),
  skillRating: integer("skill_rating").default(1000).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matches table
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  map: varchar("map").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  team1Score: integer("team1_score").default(0).notNull(),
  team2Score: integer("team2_score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Match stats per player
export const matchStats = pgTable("match_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  team: integer("team").notNull(), // 1 or 2
  kills: integer("kills").default(0).notNull(),
  deaths: integer("deaths").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  headshots: integer("headshots").default(0).notNull(),
  mvps: integer("mvps").default(0).notNull(),
  score: integer("score").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  matchStats: many(matchStats),
}));

export const matchesRelations = relations(matches, ({ many }) => ({
  stats: many(matchStats),
}));

export const matchStatsRelations = relations(matchStats, ({ one }) => ({
  match: one(matches, {
    fields: [matchStats.matchId],
    references: [matches.id],
  }),
  user: one(users, {
    fields: [matchStats.userId],
    references: [users.id],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateUserStatsSchema = z.object({
  nickname: z.string().optional(),
  totalKills: z.number().int().min(0).optional(),
  totalDeaths: z.number().int().min(0).optional(),
  totalAssists: z.number().int().min(0).optional(),
  totalHeadshots: z.number().int().min(0).optional(),
  totalMatches: z.number().int().min(0).optional(),
  matchesWon: z.number().int().min(0).optional(),
  matchesLost: z.number().int().min(0).optional(),
  totalRoundsPlayed: z.number().int().min(0).optional(),
  roundsWon: z.number().int().min(0).optional(),
  totalMvps: z.number().int().min(0).optional(),
  skillRating: z.number().int().min(0).optional(),
  isAdmin: z.boolean().optional(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertMatchStatsSchema = createInsertSchema(matchStats).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type MatchStats = typeof matchStats.$inferSelect;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;
export type UpdateUserStats = z.infer<typeof updateUserStatsSchema>;
