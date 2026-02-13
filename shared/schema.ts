import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
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
  // Steam ID for linking with server data
  steamId64: varchar("steam_id_64").unique(),
  // CS:GO Stats (aggregated from matches)
  nickname: varchar("nickname"),
  totalKills: integer("total_kills").default(0).notNull(),
  totalDeaths: integer("total_deaths").default(0).notNull(),
  totalAssists: integer("total_assists").default(0).notNull(),
  totalHeadshots: integer("total_headshots").default(0).notNull(),
  totalDamage: integer("total_damage").default(0).notNull(),
  totalMatches: integer("total_matches").default(0).notNull(),
  matchesWon: integer("matches_won").default(0).notNull(),
  matchesLost: integer("matches_lost").default(0).notNull(),
  totalRoundsPlayed: integer("total_rounds_played").default(0).notNull(),
  roundsWon: integer("rounds_won").default(0).notNull(),
  totalMvps: integer("total_mvps").default(0).notNull(),
  // Clutch stats
  total1v1Count: integer("total_1v1_count").default(0).notNull(),
  total1v1Wins: integer("total_1v1_wins").default(0).notNull(),
  total1v2Count: integer("total_1v2_count").default(0).notNull(),
  total1v2Wins: integer("total_1v2_wins").default(0).notNull(),
  // Entry frag stats
  totalEntryCount: integer("total_entry_count").default(0).notNull(),
  totalEntryWins: integer("total_entry_wins").default(0).notNull(),
  // Multi-kill rounds
  total5ks: integer("total_5ks").default(0).notNull(),
  total4ks: integer("total_4ks").default(0).notNull(),
  total3ks: integer("total_3ks").default(0).notNull(),
  total2ks: integer("total_2ks").default(0).notNull(),
  // Utility stats
  totalFlashCount: integer("total_flash_count").default(0).notNull(),
  totalFlashSuccesses: integer("total_flash_successes").default(0).notNull(),
  totalEnemiesFlashed: integer("total_enemies_flashed").default(0).notNull(),
  totalUtilityDamage: integer("total_utility_damage").default(0).notNull(),
  // Accuracy stats
  totalShotsFired: integer("total_shots_fired").default(0).notNull(),
  totalShotsOnTarget: integer("total_shots_on_target").default(0).notNull(),
  skillRating: integer("skill_rating").default(1000).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Matches table
export const matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalMatchId: integer("external_match_id"),
  mapNumber: integer("map_number").default(0).notNull(),
  map: varchar("map").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  team1Name: varchar("team1_name"),
  team2Name: varchar("team2_name"),
  team1Score: integer("team1_score").default(0).notNull(),
  team2Score: integer("team2_score").default(0).notNull(),
  winnerTeam: varchar("winner_team"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Match stats per player - detailed stats from server CSV
export const matchStats = pgTable("match_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  steamId64: varchar("steam_id_64"),
  team: varchar("team_name"),
  playerName: varchar("player_name"),
  // Basic stats
  kills: integer("kills").default(0).notNull(),
  deaths: integer("deaths").default(0).notNull(),
  assists: integer("assists").default(0).notNull(),
  damage: integer("damage").default(0).notNull(),
  headshots: integer("headshots").default(0).notNull(),
  // Multi-kill rounds
  enemy5ks: integer("enemy_5ks").default(0).notNull(),
  enemy4ks: integer("enemy_4ks").default(0).notNull(),
  enemy3ks: integer("enemy_3ks").default(0).notNull(),
  enemy2ks: integer("enemy_2ks").default(0).notNull(),
  // Utility stats
  utilityCount: integer("utility_count").default(0).notNull(),
  utilityDamage: integer("utility_damage").default(0).notNull(),
  utilitySuccesses: integer("utility_successes").default(0).notNull(),
  utilityEnemies: integer("utility_enemies").default(0).notNull(),
  // Flash stats
  flashCount: integer("flash_count").default(0).notNull(),
  flashSuccesses: integer("flash_successes").default(0).notNull(),
  enemiesFlashed: integer("enemies_flashed").default(0).notNull(),
  // Damage stats
  healthPointsRemovedTotal: integer("health_points_removed_total").default(0).notNull(),
  healthPointsDealtTotal: integer("health_points_dealt_total").default(0).notNull(),
  // Accuracy stats
  shotsFiredTotal: integer("shots_fired_total").default(0).notNull(),
  shotsOnTargetTotal: integer("shots_on_target_total").default(0).notNull(),
  // Clutch stats
  v1Count: integer("v1_count").default(0).notNull(),
  v1Wins: integer("v1_wins").default(0).notNull(),
  v2Count: integer("v2_count").default(0).notNull(),
  v2Wins: integer("v2_wins").default(0).notNull(),
  // Entry frag stats
  entryCount: integer("entry_count").default(0).notNull(),
  entryWins: integer("entry_wins").default(0).notNull(),
  // Economy stats
  equipmentValue: integer("equipment_value").default(0).notNull(),
  moneySaved: integer("money_saved").default(0).notNull(),
  killReward: integer("kill_reward").default(0).notNull(),
  cashEarned: integer("cash_earned").default(0).notNull(),
  // Other stats
  liveTime: integer("live_time").default(0).notNull(),
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

// Payments table for financial tracking
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  amount: real("amount").notNull(),
  description: varchar("description"),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

// Reports table for user complaints/denuncias
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: 'set null' }),
  description: varchar("description", { length: 2000 }).notNull(),
  attachmentUrl: varchar("attachment_url"),
  attachmentType: varchar("attachment_type"),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  status: varchar("status").default("pending").notNull(),
  adminNotes: varchar("admin_notes", { length: 1000 }),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

export const reportsRelations = relations(reports, ({ one }) => ({
  user: one(users, {
    fields: [reports.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [reports.reviewedBy],
    references: [users.id],
  }),
}));

// Championship registrations table
export const championshipRegistrations = pgTable("championship_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: varchar("status").default("interested").notNull(),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const championshipRegistrationsRelations = relations(championshipRegistrations, ({ one }) => ({
  user: one(users, {
    fields: [championshipRegistrations.userId],
    references: [users.id],
  }),
}));

// Monthly ranking snapshots table
export const monthlyRankings = pgTable("monthly_rankings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(),
  rankings: jsonb("rankings").notNull(), // Array of player rankings with stats
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mix availability list - players available for mix
export const mixAvailability = pgTable("mix_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  listDate: varchar("list_date").notNull(), // YYYY-MM-DD format
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  position: integer("position").notNull(), // 1-10 main, 11+ substitutes
  isSub: boolean("is_sub").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const mixAvailabilityRelations = relations(mixAvailability, ({ one }) => ({
  user: one(users, {
    fields: [mixAvailability.userId],
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
  steamId64: z.string().optional(),
  totalKills: z.number().int().min(0).optional(),
  totalDeaths: z.number().int().min(0).optional(),
  totalAssists: z.number().int().min(0).optional(),
  totalHeadshots: z.number().int().min(0).optional(),
  totalDamage: z.number().int().min(0).optional(),
  totalMatches: z.number().int().min(0).optional(),
  matchesWon: z.number().int().min(0).optional(),
  matchesLost: z.number().int().min(0).optional(),
  totalRoundsPlayed: z.number().int().min(0).optional(),
  roundsWon: z.number().int().min(0).optional(),
  totalMvps: z.number().int().min(0).optional(),
  total1v1Count: z.number().int().min(0).optional(),
  total1v1Wins: z.number().int().min(0).optional(),
  total1v2Count: z.number().int().min(0).optional(),
  total1v2Wins: z.number().int().min(0).optional(),
  totalEntryCount: z.number().int().min(0).optional(),
  totalEntryWins: z.number().int().min(0).optional(),
  total5ks: z.number().int().min(0).optional(),
  total4ks: z.number().int().min(0).optional(),
  total3ks: z.number().int().min(0).optional(),
  total2ks: z.number().int().min(0).optional(),
  totalFlashCount: z.number().int().min(0).optional(),
  totalFlashSuccesses: z.number().int().min(0).optional(),
  totalEnemiesFlashed: z.number().int().min(0).optional(),
  totalUtilityDamage: z.number().int().min(0).optional(),
  totalShotsFired: z.number().int().min(0).optional(),
  totalShotsOnTarget: z.number().int().min(0).optional(),
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

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertReportSchema = createInsertSchema(reports).omit({
  id: true,
  createdAt: true,
  reviewedAt: true,
});

export const updateReportSchema = z.object({
  status: z.enum(["pending", "reviewing", "resolved", "dismissed"]).optional(),
  adminNotes: z.string().max(1000).optional(),
  reviewedBy: z.string().optional(),
  reviewedAt: z.date().optional(),
});

export const insertChampionshipRegistrationSchema = createInsertSchema(championshipRegistrations).omit({
  id: true,
  createdAt: true,
});

export const insertMonthlyRankingSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
  rankings: z.any(),
});

// Casino balance table - fictional money for betting
export const casinoBalances = pgTable("casino_balances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  balance: real("balance").default(10000000).notNull(), // Start with R$10 million
  totalWon: real("total_won").default(0).notNull(),
  totalLost: real("total_lost").default(0).notNull(),
  totalBets: integer("total_bets").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bets table - main bet record
export const bets = pgTable("bets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetPlayerId: varchar("target_player_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  matchId: varchar("match_id").references(() => matches.id, { onDelete: 'set null' }),
  amount: real("amount").notNull(), // Amount wagered
  totalOdds: real("total_odds").notNull(), // Combined odds
  potentialWin: real("potential_win").notNull(), // amount * totalOdds
  status: varchar("status").default("pending").notNull(), // pending, won, lost, cancelled
  result: varchar("result"), // Details about result
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Bet items - individual conditions within a bet
export const betItems = pgTable("bet_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  betId: varchar("bet_id").notNull().references(() => bets.id, { onDelete: 'cascade' }),
  betType: varchar("bet_type").notNull(), // kills_over, kills_under, kd_over, kd_under, win, headshots_over, etc.
  targetValue: real("target_value").notNull(), // The value to compare against
  odds: real("odds").notNull(), // Individual odds for this condition
  won: boolean("won"), // null if pending, true/false after resolution
  actualValue: real("actual_value"), // Actual value achieved
});

// Casino transactions for case openings and slots
export const casinoTransactions = pgTable("casino_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar("type").notNull(), // bet, case_opening, slot_win, slot_loss
  amount: real("amount").notNull(), // Positive for wins, negative for losses
  description: varchar("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCasinoBalanceSchema = createInsertSchema(casinoBalances).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBetSchema = z.object({
  targetPlayerId: z.string(),
  amount: z.number().min(10, "Aposta mínima é R$10"),
  items: z.array(z.object({
    betType: z.string(),
    targetValue: z.number(),
  })).min(1, "Selecione pelo menos uma condição"),
});

export const insertCasinoTransactionSchema = createInsertSchema(casinoTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertMixAvailabilitySchema = createInsertSchema(mixAvailability).omit({
  id: true,
  joinedAt: true,
});

export const mixPenalties = pgTable("mix_penalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  listDate: varchar("list_date").notNull(),
  type: varchar("type").notNull().default("no_show"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mixPenaltyRelations = relations(mixPenalties, ({ one }) => ({
  user: one(users, {
    fields: [mixPenalties.userId],
    references: [users.id],
  }),
}));

export const insertMixPenaltySchema = createInsertSchema(mixPenalties).omit({
  id: true,
  createdAt: true,
});

export const news = pgTable("news", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const newsRelations = relations(news, ({ one }) => ({
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
}));

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  createdAt: true,
});

// Types
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type MatchStats = typeof matchStats.$inferSelect;
export type InsertMatchStats = z.infer<typeof insertMatchStatsSchema>;
export type UpdateUserStats = z.infer<typeof updateUserStatsSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Report = typeof reports.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type UpdateReport = z.infer<typeof updateReportSchema>;
export type ChampionshipRegistration = typeof championshipRegistrations.$inferSelect;
export type InsertChampionshipRegistration = z.infer<typeof insertChampionshipRegistrationSchema>;
export type MonthlyRanking = typeof monthlyRankings.$inferSelect;
export type InsertMonthlyRanking = z.infer<typeof insertMonthlyRankingSchema>;
export type CasinoBalance = typeof casinoBalances.$inferSelect;
export type InsertCasinoBalance = z.infer<typeof insertCasinoBalanceSchema>;
export type Bet = typeof bets.$inferSelect;
export type BetItem = typeof betItems.$inferSelect;
export type InsertBet = z.infer<typeof insertBetSchema>;
export type CasinoTransaction = typeof casinoTransactions.$inferSelect;
export type InsertCasinoTransaction = z.infer<typeof insertCasinoTransactionSchema>;
export type MixAvailability = typeof mixAvailability.$inferSelect;
export type InsertMixAvailability = z.infer<typeof insertMixAvailabilitySchema>;
export type MixPenalty = typeof mixPenalties.$inferSelect;
export type InsertMixPenalty = z.infer<typeof insertMixPenaltySchema>;
