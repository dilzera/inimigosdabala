import {
  users,
  sessions,
  matches,
  matchStats,
  payments,
  reports,
  championshipRegistrations,
  type User,
  type UpsertUser,
  type Match,
  type InsertMatch,
  type MatchStats,
  type InsertMatchStats,
  type UpdateUserStats,
  type Payment,
  type InsertPayment,
  type Report,
  type InsertReport,
  type UpdateReport,
  type ChampionshipRegistration,
  type InsertChampionshipRegistration,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Extended user operations
  getAllUsers(): Promise<User[]>;
  getUserBySteamId(steamId64: string): Promise<User | undefined>;
  updateUserStats(id: string, stats: UpdateUserStats): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  createPlayerFromSteam(steamId64: string, nickname: string): Promise<User>;
  recalculateUserStats(userId: string): Promise<User | undefined>;
  
  // Match operations
  getMatch(id: string): Promise<Match | undefined>;
  getMatchByExternalId(externalMatchId: number, mapNumber: number): Promise<Match | undefined>;
  getAllMatches(): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  
  // Match stats operations
  getMatchStats(matchId: string): Promise<MatchStats[]>;
  getUserMatchStats(userId: string): Promise<MatchStats[]>;
  getUserMatchStatsWithMatches(userId: string): Promise<Array<{ stats: MatchStats; match: Match }>>;
  createMatchStats(stats: InsertMatchStats): Promise<MatchStats>;
  
  // Payment operations
  getAllPayments(): Promise<Payment[]>;
  getPaymentsByUser(userId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  deletePayment(id: string): Promise<boolean>;
  
  // Report operations
  getAllReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  createReport(report: InsertReport): Promise<Report>;
  updateReport(id: string, data: UpdateReport): Promise<Report | undefined>;
  deleteReport(id: string): Promise<boolean>;
  
  // User merge operation
  mergeUsers(sourceId: string, targetId: string): Promise<User | undefined>;
  
  // Championship registration operations
  getAllChampionshipRegistrations(): Promise<ChampionshipRegistration[]>;
  getChampionshipRegistrationByUser(userId: string): Promise<ChampionshipRegistration | undefined>;
  createChampionshipRegistration(registration: InsertChampionshipRegistration): Promise<ChampionshipRegistration>;
  deleteChampionshipRegistration(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the first user - if so, make them admin
    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    const isFirstUser = existingUsers.length === 0;
    
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        isAdmin: isFirstUser ? true : (userData.isAdmin ?? false),
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Extended user operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserBySteamId(steamId64: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.steamId64, steamId64));
    return user;
  }

  async createPlayerFromSteam(steamId64: string, playerName: string): Promise<User> {
    // First check if user exists
    const existingUser = await this.getUserBySteamId(steamId64);
    
    if (existingUser) {
      // Update the nickname/firstName if not already set or if it's a default value
      if (!existingUser.nickname || existingUser.nickname === existingUser.steamId64) {
        const [updatedUser] = await db
          .update(users)
          .set({
            nickname: playerName,
            firstName: existingUser.firstName || playerName,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();
        return updatedUser;
      }
      return existingUser;
    }
    
    // Create new user with steamId64 and name
    const [user] = await db
      .insert(users)
      .values({
        id: `steam_${steamId64}`,
        steamId64,
        nickname: playerName,
        firstName: playerName,
      })
      .returning();
    return user;
  }

  async updateUserStats(id: string, stats: UpdateUserStats): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        ...stats,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async recalculateUserStats(userId: string): Promise<User | undefined> {
    // Get all match stats for this user with match data joined
    const userMatchStatsWithMatch = await db
      .select({
        stats: matchStats,
        match: matches,
      })
      .from(matchStats)
      .innerJoin(matches, eq(matchStats.matchId, matches.id))
      .where(eq(matchStats.userId, userId));

    if (userMatchStatsWithMatch.length === 0) {
      return await this.getUser(userId);
    }

    // Aggregate stats including rounds and wins/losses
    let totalRoundsPlayed = 0;
    let roundsWon = 0;
    let matchesWon = 0;
    let matchesLost = 0;

    const aggregated = userMatchStatsWithMatch.reduce((acc, { stats: stat, match }) => {
      // Calculate rounds played (sum of both team scores)
      const matchRounds = (match.team1Score || 0) + (match.team2Score || 0);
      totalRoundsPlayed += matchRounds;

      // Determine if player's team won
      const playerTeam = stat.team;
      const team1Name = match.team1Name;
      const isTeam1 = playerTeam === team1Name;
      
      // Calculate rounds won for this player based on their team
      if (isTeam1) {
        roundsWon += match.team1Score || 0;
      } else {
        roundsWon += match.team2Score || 0;
      }

      // Determine match win/loss based on winnerTeam
      if (match.winnerTeam) {
        if (match.winnerTeam === playerTeam) {
          matchesWon++;
        } else {
          matchesLost++;
        }
      } else {
        // Fallback: compare scores if no winner specified
        const team1Score = match.team1Score || 0;
        const team2Score = match.team2Score || 0;
        if (team1Score !== team2Score) {
          if (isTeam1 && team1Score > team2Score) {
            matchesWon++;
          } else if (!isTeam1 && team2Score > team1Score) {
            matchesWon++;
          } else {
            matchesLost++;
          }
        }
        // If scores are equal (tie), don't count as win or loss
      }

      return {
        totalKills: acc.totalKills + stat.kills,
        totalDeaths: acc.totalDeaths + stat.deaths,
        totalAssists: acc.totalAssists + stat.assists,
        totalHeadshots: acc.totalHeadshots + stat.headshots,
        totalDamage: acc.totalDamage + stat.damage,
        totalMatches: acc.totalMatches + 1,
        totalMvps: acc.totalMvps + stat.mvps,
        total1v1Count: acc.total1v1Count + stat.v1Count,
        total1v1Wins: acc.total1v1Wins + stat.v1Wins,
        total1v2Count: acc.total1v2Count + stat.v2Count,
        total1v2Wins: acc.total1v2Wins + stat.v2Wins,
        totalEntryCount: acc.totalEntryCount + stat.entryCount,
        totalEntryWins: acc.totalEntryWins + stat.entryWins,
        total5ks: acc.total5ks + stat.enemy5ks,
        total4ks: acc.total4ks + stat.enemy4ks,
        total3ks: acc.total3ks + stat.enemy3ks,
        total2ks: acc.total2ks + stat.enemy2ks,
        totalFlashCount: acc.totalFlashCount + stat.flashCount,
        totalFlashSuccesses: acc.totalFlashSuccesses + stat.flashSuccesses,
        totalEnemiesFlashed: acc.totalEnemiesFlashed + stat.enemiesFlashed,
        totalUtilityDamage: acc.totalUtilityDamage + stat.utilityDamage,
        totalShotsFired: acc.totalShotsFired + stat.shotsFiredTotal,
        totalShotsOnTarget: acc.totalShotsOnTarget + stat.shotsOnTargetTotal,
      };
    }, {
      totalKills: 0,
      totalDeaths: 0,
      totalAssists: 0,
      totalHeadshots: 0,
      totalDamage: 0,
      totalMatches: 0,
      totalMvps: 0,
      total1v1Count: 0,
      total1v1Wins: 0,
      total1v2Count: 0,
      total1v2Wins: 0,
      totalEntryCount: 0,
      totalEntryWins: 0,
      total5ks: 0,
      total4ks: 0,
      total3ks: 0,
      total2ks: 0,
      totalFlashCount: 0,
      totalFlashSuccesses: 0,
      totalEnemiesFlashed: 0,
      totalUtilityDamage: 0,
      totalShotsFired: 0,
      totalShotsOnTarget: 0,
    });

    // Calculate skill rating based on performance with proper ADR
    const kd = aggregated.totalDeaths > 0 ? aggregated.totalKills / aggregated.totalDeaths : aggregated.totalKills;
    const hsPercent = aggregated.totalKills > 0 ? (aggregated.totalHeadshots / aggregated.totalKills) * 100 : 0;
    const adr = totalRoundsPlayed > 0 ? aggregated.totalDamage / totalRoundsPlayed : 0;
    const winRate = aggregated.totalMatches > 0 ? (matchesWon / aggregated.totalMatches) * 100 : 50;
    
    const skillRating = Math.round(
      1000 +
      (kd - 1) * 150 +           // K/D impact
      (hsPercent - 30) * 2 +     // HS% impact (30% is average)
      (adr - 70) * 1.5 +         // ADR impact (70 is average)
      (winRate - 50) * 3 +       // Win rate impact
      aggregated.totalMvps * 2 + // MVP bonus
      aggregated.total5ks * 30 + // ACE bonus
      aggregated.total4ks * 15 + // 4K bonus
      aggregated.total3ks * 5    // 3K bonus
    );

    const [user] = await db
      .update(users)
      .set({
        ...aggregated,
        totalRoundsPlayed,
        roundsWon,
        matchesWon,
        matchesLost,
        skillRating: Math.max(100, Math.min(3000, skillRating)),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Match operations
  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    return match;
  }

  async getMatchByExternalId(externalMatchId: number, mapNumber: number): Promise<Match | undefined> {
    const [match] = await db
      .select()
      .from(matches)
      .where(sql`${matches.externalMatchId} = ${externalMatchId} AND ${matches.mapNumber} = ${mapNumber}`);
    return match;
  }

  async getAllMatches(): Promise<Match[]> {
    return await db.select().from(matches);
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const [newMatch] = await db.insert(matches).values(match).returning();
    return newMatch;
  }

  // Match stats operations
  async getMatchStats(matchId: string): Promise<MatchStats[]> {
    return await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.matchId, matchId));
  }

  async getUserMatchStats(userId: string): Promise<MatchStats[]> {
    return await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.userId, userId));
  }

  async getUserMatchStatsWithMatches(userId: string): Promise<Array<{ stats: MatchStats; match: Match }>> {
    return await db
      .select({
        stats: matchStats,
        match: matches,
      })
      .from(matchStats)
      .innerJoin(matches, eq(matchStats.matchId, matches.id))
      .where(eq(matchStats.userId, userId))
      .orderBy(sql`${matches.date} DESC`);
  }

  async createMatchStats(stats: InsertMatchStats): Promise<MatchStats> {
    const [newStats] = await db.insert(matchStats).values(stats).returning();
    return newStats;
  }

  // Payment operations
  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getPaymentsByUser(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async deletePayment(id: string): Promise<boolean> {
    const result = await db.delete(payments).where(eq(payments.id, id)).returning();
    return result.length > 0;
  }

  // Report operations
  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReport(id: string): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report;
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  async updateReport(id: string, data: UpdateReport): Promise<Report | undefined> {
    const [updatedReport] = await db
      .update(reports)
      .set({
        ...data,
        reviewedAt: data.status && data.status !== "pending" ? new Date() : undefined,
      })
      .where(eq(reports.id, id))
      .returning();
    return updatedReport;
  }

  async deleteReport(id: string): Promise<boolean> {
    const result = await db.delete(reports).where(eq(reports.id, id)).returning();
    return result.length > 0;
  }

  // Merge users: transfer all data from source to target and delete source
  async mergeUsers(sourceId: string, targetId: string): Promise<User | undefined> {
    const sourceUser = await this.getUser(sourceId);
    const targetUser = await this.getUser(targetId);
    
    if (!sourceUser || !targetUser) {
      return undefined;
    }

    // Transfer match stats from source to target
    await db
      .update(matchStats)
      .set({ userId: targetId })
      .where(eq(matchStats.userId, sourceId));

    // Transfer payments from source to target
    await db
      .update(payments)
      .set({ userId: targetId })
      .where(eq(payments.userId, sourceId));

    // Prepare merged stats - ALL statistics fields
    const totalKills = (targetUser.totalKills || 0) + (sourceUser.totalKills || 0);
    const totalDeaths = (targetUser.totalDeaths || 0) + (sourceUser.totalDeaths || 0);
    const totalAssists = (targetUser.totalAssists || 0) + (sourceUser.totalAssists || 0);
    const totalHeadshots = (targetUser.totalHeadshots || 0) + (sourceUser.totalHeadshots || 0);
    const totalDamage = (targetUser.totalDamage || 0) + (sourceUser.totalDamage || 0);
    const totalMatches = (targetUser.totalMatches || 0) + (sourceUser.totalMatches || 0);
    const matchesWon = (targetUser.matchesWon || 0) + (sourceUser.matchesWon || 0);
    const matchesLost = (targetUser.matchesLost || 0) + (sourceUser.matchesLost || 0);
    const totalRoundsPlayed = (targetUser.totalRoundsPlayed || 0) + (sourceUser.totalRoundsPlayed || 0);
    const roundsWon = (targetUser.roundsWon || 0) + (sourceUser.roundsWon || 0);
    const totalMvps = (targetUser.totalMvps || 0) + (sourceUser.totalMvps || 0);
    const total1v1Count = (targetUser.total1v1Count || 0) + (sourceUser.total1v1Count || 0);
    const total1v1Wins = (targetUser.total1v1Wins || 0) + (sourceUser.total1v1Wins || 0);
    const total1v2Count = (targetUser.total1v2Count || 0) + (sourceUser.total1v2Count || 0);
    const total1v2Wins = (targetUser.total1v2Wins || 0) + (sourceUser.total1v2Wins || 0);
    const totalEntryCount = (targetUser.totalEntryCount || 0) + (sourceUser.totalEntryCount || 0);
    const totalEntryWins = (targetUser.totalEntryWins || 0) + (sourceUser.totalEntryWins || 0);
    const total5ks = (targetUser.total5ks || 0) + (sourceUser.total5ks || 0);
    const total4ks = (targetUser.total4ks || 0) + (sourceUser.total4ks || 0);
    const total3ks = (targetUser.total3ks || 0) + (sourceUser.total3ks || 0);
    const total2ks = (targetUser.total2ks || 0) + (sourceUser.total2ks || 0);
    const totalFlashCount = (targetUser.totalFlashCount || 0) + (sourceUser.totalFlashCount || 0);
    const totalFlashSuccesses = (targetUser.totalFlashSuccesses || 0) + (sourceUser.totalFlashSuccesses || 0);
    const totalEnemiesFlashed = (targetUser.totalEnemiesFlashed || 0) + (sourceUser.totalEnemiesFlashed || 0);
    const totalUtilityDamage = (targetUser.totalUtilityDamage || 0) + (sourceUser.totalUtilityDamage || 0);
    const totalShotsFired = (targetUser.totalShotsFired || 0) + (sourceUser.totalShotsFired || 0);
    const totalShotsOnTarget = (targetUser.totalShotsOnTarget || 0) + (sourceUser.totalShotsOnTarget || 0);

    // Calculate skill rating using weighted average based on matches played
    const sourceMatches = sourceUser.totalMatches || 0;
    const targetMatches = targetUser.totalMatches || 0;
    const sourceRating = sourceUser.skillRating || 1000;
    const targetRating = targetUser.skillRating || 1000;
    
    let skillRating: number;
    if (sourceMatches + targetMatches > 0) {
      // Weighted average based on matches played
      skillRating = Math.round(
        (sourceRating * sourceMatches + targetRating * targetMatches) / (sourceMatches + targetMatches)
      );
    } else {
      // If both have 0 matches, just average the ratings
      skillRating = Math.round((sourceRating + targetRating) / 2);
    }

    const mergedStats = {
      totalKills,
      totalDeaths,
      totalAssists,
      totalHeadshots,
      totalDamage,
      totalMatches,
      matchesWon,
      matchesLost,
      totalRoundsPlayed,
      roundsWon,
      totalMvps,
      total1v1Count,
      total1v1Wins,
      total1v2Count,
      total1v2Wins,
      totalEntryCount,
      totalEntryWins,
      total5ks,
      total4ks,
      total3ks,
      total2ks,
      totalFlashCount,
      totalFlashSuccesses,
      totalEnemiesFlashed,
      totalUtilityDamage,
      totalShotsFired,
      totalShotsOnTarget,
      skillRating: Math.max(100, Math.min(3000, skillRating)), // Clamp between 100-3000
      nickname: targetUser.nickname || sourceUser.nickname,
    };

    // Determine the SteamID64 to use (prefer source's if target doesn't have one)
    const newSteamId64 = targetUser.steamId64 || sourceUser.steamId64;

    // Delete source user FIRST to avoid unique constraint violation on steamId64
    await db.delete(users).where(eq(users.id, sourceId));

    // Update target user with merged stats and SteamID64
    const [updatedUser] = await db
      .update(users)
      .set({
        ...mergedStats,
        steamId64: newSteamId64,
        updatedAt: new Date(),
      })
      .where(eq(users.id, targetId))
      .returning();

    return updatedUser;
  }

  // Championship registration operations
  async getAllChampionshipRegistrations(): Promise<ChampionshipRegistration[]> {
    return await db.select().from(championshipRegistrations).orderBy(desc(championshipRegistrations.createdAt));
  }

  async getChampionshipRegistrationByUser(userId: string): Promise<ChampionshipRegistration | undefined> {
    const [registration] = await db.select().from(championshipRegistrations).where(eq(championshipRegistrations.userId, userId));
    return registration;
  }

  async createChampionshipRegistration(registration: InsertChampionshipRegistration): Promise<ChampionshipRegistration> {
    const [newRegistration] = await db.insert(championshipRegistrations).values(registration).returning();
    return newRegistration;
  }

  async deleteChampionshipRegistration(id: string): Promise<boolean> {
    const result = await db.delete(championshipRegistrations).where(eq(championshipRegistrations.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
