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
import { eq } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Extended user operations
  getAllUsers(): Promise<User[]>;
  updateUserStats(id: string, stats: UpdateUserStats): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Match operations
  getMatch(id: string): Promise<Match | undefined>;
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
    const [user] = await db
      .insert(users)
      .values(userData)
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

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Match operations
  async getMatch(id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
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
