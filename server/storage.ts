import {
  users,
  sessions,
  matches,
  matchStats,
  type User,
  type UpsertUser,
  type Match,
  type InsertMatch,
  type MatchStats,
  type InsertMatchStats,
  type UpdateUserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

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
  createMatchStats(stats: InsertMatchStats): Promise<MatchStats>;
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
    // Get all match stats for this user
    const userMatchStats = await db
      .select()
      .from(matchStats)
      .where(eq(matchStats.userId, userId));

    if (userMatchStats.length === 0) {
      return await this.getUser(userId);
    }

    // Aggregate stats
    const aggregated = userMatchStats.reduce((acc, stat) => ({
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
    }), {
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

    // Calculate skill rating based on performance
    const kd = aggregated.totalDeaths > 0 ? aggregated.totalKills / aggregated.totalDeaths : aggregated.totalKills;
    const hsPercent = aggregated.totalKills > 0 ? (aggregated.totalHeadshots / aggregated.totalKills) * 100 : 0;
    const adr = aggregated.totalMatches > 0 ? aggregated.totalDamage / aggregated.totalMatches : 0;
    const skillRating = Math.round(1000 + (kd * 100) + (hsPercent * 2) + (adr / 10));

    const [user] = await db
      .update(users)
      .set({
        ...aggregated,
        skillRating,
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

  async createMatchStats(stats: InsertMatchStats): Promise<MatchStats> {
    const [newStats] = await db.insert(matchStats).values(stats).returning();
    return newStats;
  }
}

export const storage = new DatabaseStorage();
