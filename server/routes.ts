import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { updateUserStatsSchema, mixPenalties } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";

// CSV row schema for validation
const csvRowSchema = z.object({
  matchid: z.coerce.number(),
  mapnumber: z.coerce.number(),
  steamid64: z.string(),
  team: z.string(),
  name: z.string(),
  kills: z.coerce.number(),
  deaths: z.coerce.number(),
  damage: z.coerce.number(),
  assists: z.coerce.number(),
  enemy5ks: z.coerce.number(),
  enemy4ks: z.coerce.number(),
  enemy3ks: z.coerce.number(),
  enemy2ks: z.coerce.number(),
  utility_count: z.coerce.number(),
  utility_damage: z.coerce.number(),
  utility_successes: z.coerce.number(),
  utility_enemies: z.coerce.number(),
  flash_count: z.coerce.number(),
  flash_successes: z.coerce.number(),
  health_points_removed_total: z.coerce.number(),
  health_points_dealt_total: z.coerce.number(),
  shots_fired_total: z.coerce.number(),
  shots_on_target_total: z.coerce.number(),
  v1_count: z.coerce.number(),
  v1_wins: z.coerce.number(),
  v2_count: z.coerce.number(),
  v2_wins: z.coerce.number(),
  entry_count: z.coerce.number(),
  entry_wins: z.coerce.number(),
  equipment_value: z.coerce.number(),
  money_saved: z.coerce.number(),
  kill_reward: z.coerce.number(),
  live_time: z.coerce.number(),
  head_shot_kills: z.coerce.number(),
  cash_earned: z.coerce.number(),
  enemies_flashed: z.coerce.number(),
});

type CsvRow = z.infer<typeof csvRowSchema>;

function parseCSV(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CsvRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const obj: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });
    
    // Skip spectators
    if (obj.team?.toLowerCase() === 'spectator' || obj.team?.toLowerCase() === 'spectators') {
      console.log(`Skipping spectator: ${obj.name}`);
      continue;
    }
    
    try {
      const parsed = csvRowSchema.parse(obj);
      rows.push(parsed);
    } catch (e) {
      console.error(`Error parsing row ${i}:`, e);
    }
  }
  
  return rows;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes - Get current user (public endpoint - returns user if logged in, 401 if not)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const isAuth = typeof req.isAuthenticated === 'function' ? req.isAuthenticated() : false;
      if (!isAuth || !req.user?.claims?.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get all users (for rankings, mix, etc - accessible to all authenticated users)
  app.get('/api/users', isAuthenticated, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Get a single user by ID
  app.get('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Recalculate all user stats (admin only)
  app.post('/api/admin/recalculate-all-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const users = await storage.getAllUsers();
      const results: { userId: string; success: boolean; error?: string }[] = [];
      
      for (const user of users) {
        try {
          await storage.recalculateUserStats(user.id);
          results.push({ userId: user.id, success: true });
        } catch (err) {
          results.push({ userId: user.id, success: false, error: String(err) });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      res.json({ 
        message: `Recalculated stats for ${successCount}/${users.length} users`,
        results 
      });
    } catch (error) {
      console.error("Error recalculating stats:", error);
      res.status(500).json({ message: "Failed to recalculate stats" });
    }
  });

  // Recalculate MVPs for all existing matches (admin only)
  app.post('/api/admin/recalculate-mvps', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      // MVP calculation function
      const calculateMVPScore = (stat: any): number => {
        const kd = stat.deaths > 0 ? stat.kills / stat.deaths : stat.kills;
        const hsPercent = stat.kills > 0 ? (stat.headshots / stat.kills) : 0;
        
        let score = 0;
        score += stat.kills * 2;
        score += stat.assists * 0.5;
        score += kd * 5;
        score += hsPercent * 10;
        score += stat.damage * 0.01;
        score += (stat.enemy5ks || 0) * 15;
        score += (stat.enemy4ks || 0) * 10;
        score += (stat.enemy3ks || 0) * 5;
        score += (stat.enemy2ks || 0) * 2;
        score += (stat.v1Wins || 0) * 8;
        score += (stat.v2Wins || 0) * 12;
        score += (stat.entryWins || 0) * 3;
        score += (stat.utilityDamage || 0) * 0.02;
        score += (stat.enemiesFlashed || 0) * 0.5;
        
        return score;
      };

      const allMatches = await storage.getAllMatches();
      let matchesProcessed = 0;
      let mvpsAssigned = 0;
      const usersToRecalculate = new Set<string>();

      for (const match of allMatches) {
        const stats = await storage.getMatchStats(match.id);
        
        if (stats.length === 0) continue;

        // Find the MVP
        let mvpStatId: string | null = null;
        let highestScore = -1;
        
        for (const stat of stats) {
          const score = calculateMVPScore(stat);
          if (score > highestScore) {
            highestScore = score;
            mvpStatId = stat.id;
          }
        }

        // Update MVP for each player in this match
        for (const stat of stats) {
          const isMVP = stat.id === mvpStatId ? 1 : 0;
          await storage.updateMatchStatsMvp(stat.id, isMVP);
          usersToRecalculate.add(stat.userId);
          if (isMVP === 1) mvpsAssigned++;
        }
        
        matchesProcessed++;
      }

      // Recalculate user stats to update MVP totals
      for (const id of Array.from(usersToRecalculate)) {
        await storage.recalculateUserStats(id);
      }

      res.json({ 
        message: `Recalculated MVPs for ${matchesProcessed} matches. ${mvpsAssigned} MVPs assigned. ${usersToRecalculate.size} user stats updated.`,
        matchesProcessed,
        mvpsAssigned,
        usersUpdated: usersToRecalculate.size
      });
    } catch (error) {
      console.error("Error recalculating MVPs:", error);
      res.status(500).json({ message: "Failed to recalculate MVPs" });
    }
  });

  // Update current user profile (name, photo, steamId) - MUST be before /api/users/:id
  app.patch('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, nickname, profileImageUrl, steamId64 } = req.body;
      
      // If linking/changing steamId64, check if it already belongs to another user
      if (steamId64 && steamId64.trim() !== '') {
        const existingUser = await storage.getUserBySteamId(steamId64);
        
        if (existingUser && existingUser.id !== userId) {
          // Try to merge the existing steam user into current user
          const mergedUser = await storage.mergeUsers(existingUser.id, userId);
          if (mergedUser) {
            // Also update other profile fields if provided
            const additionalUpdates: any = { updatedAt: new Date() };
            if (firstName !== undefined) additionalUpdates.firstName = firstName;
            if (lastName !== undefined) additionalUpdates.lastName = lastName;
            if (nickname !== undefined) additionalUpdates.nickname = nickname;
            if (profileImageUrl !== undefined) additionalUpdates.profileImageUrl = profileImageUrl;
            
            if (Object.keys(additionalUpdates).length > 1) {
              const finalUser = await storage.updateUserStats(userId, additionalUpdates);
              return res.json(finalUser);
            }
            return res.json(mergedUser);
          } else {
            // Merge failed - user not found or other issue
            return res.status(400).json({ 
              message: "Não foi possível vincular este SteamID64. O usuário associado não foi encontrado." 
            });
          }
        }
      }
      
      // Regular update (steamId64 is new/empty or belongs to current user)
      const updates: any = { updatedAt: new Date() };
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (nickname !== undefined) updates.nickname = nickname;
      if (profileImageUrl !== undefined) updates.profileImageUrl = profileImageUrl;
      if (steamId64 !== undefined) updates.steamId64 = steamId64;
      
      const user = await storage.updateUserStats(userId, updates);
      res.json(user);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Update user stats (admin only)
  app.patch('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const targetId = req.params.id;
      const validatedData = updateUserStatsSchema.parse(req.body);
      
      const updatedUser = await storage.updateUserStats(targetId, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Link SteamID64 to user account (with automatic merge if already exists)
  app.post('/api/users/link-steam', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { steamId64 } = req.body;

      if (!steamId64 || typeof steamId64 !== 'string') {
        return res.status(400).json({ message: "SteamID64 is required" });
      }

      // Check if this steamId64 is already linked to another account
      const existingUser = await storage.getUserBySteamId(steamId64);
      if (existingUser && existingUser.id !== userId) {
        // Automatically merge the existing steam user's data into current user
        console.log(`Merging user ${existingUser.id} into ${userId} (SteamID: ${steamId64})`);
        
        const mergedUser = await storage.mergeUsers(existingUser.id, userId);
        if (mergedUser) {
          // Recalculate stats after merge
          await storage.recalculateUserStats(userId);
          return res.json({
            ...mergedUser,
            merged: true,
            message: `Dados mesclados com sucesso! ${existingUser.totalMatches || 0} partidas foram transferidas.`
          });
        } else {
          return res.status(400).json({ 
            message: "Não foi possível mesclar os dados. Tente novamente." 
          });
        }
      }

      // SteamID64 is new or already belongs to current user
      const updatedUser = await storage.updateUserStats(userId, { steamId64 });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Recalculate stats from any existing match data
      await storage.recalculateUserStats(userId);

      res.json(updatedUser);
    } catch (error) {
      console.error("Error linking steam:", error);
      res.status(500).json({ message: "Failed to link Steam account" });
    }
  });

  // Delete user (admin only)
  app.delete('/api/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const targetId = req.params.id;
      
      // Prevent admin from deleting themselves
      if (targetId === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(targetId);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Import match data from CSV (admin only)
  app.post('/api/matches/import', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const { csvContent, map, winnerTeam, team1Score, team2Score } = req.body;

      if (!csvContent || typeof csvContent !== 'string') {
        return res.status(400).json({ message: "CSV content is required" });
      }

      if (!map || typeof map !== 'string') {
        return res.status(400).json({ message: "Map name is required" });
      }

      const rows = parseCSV(csvContent);

      if (rows.length === 0) {
        return res.status(400).json({ message: "No valid data found in CSV" });
      }

      // Group by matchid and mapnumber
      const matchId = rows[0].matchid;
      const mapNumber = rows[0].mapnumber;

      // Check if this match already exists
      const existingMatch = await storage.getMatchByExternalId(matchId, mapNumber);
      
      if (existingMatch) {
        return res.status(409).json({ 
          message: "Esta partida já foi importada anteriormente.",
          matchId: existingMatch.id,
          map: existingMatch.map,
          date: existingMatch.date
        });
      }

      // Extract team names from player data
      const teams = Array.from(new Set(rows.map(r => r.team)));
      const team1Name = teams[0] || 'Time 1';
      const team2Name = teams[1] || 'Time 2';

      // Use provided scores if available, otherwise calculate from kills
      let finalTeam1Score = team1Score;
      let finalTeam2Score = team2Score;
      
      if (finalTeam1Score === undefined || finalTeam2Score === undefined) {
        const team1Players = rows.filter(r => r.team === team1Name);
        const team2Players = rows.filter(r => r.team === team2Name);
        const t1Kills = team1Players.reduce((sum, p) => sum + p.kills, 0);
        const t2Kills = team2Players.reduce((sum, p) => sum + p.kills, 0);
        finalTeam1Score = Math.round(t1Kills / 5);
        finalTeam2Score = Math.round(t2Kills / 5);
      }

      // Always derive winner team from scores to ensure correctness
      let finalWinnerTeam: string | null = null;
      if (finalTeam1Score !== undefined && finalTeam2Score !== undefined) {
        if (finalTeam1Score > finalTeam2Score) {
          finalWinnerTeam = team1Name;
        } else if (finalTeam2Score > finalTeam1Score) {
          finalWinnerTeam = team2Name;
        }
      }

      // Create match with winner info
      const match = await storage.createMatch({
        externalMatchId: matchId,
        mapNumber,
        map,
        team1Name,
        team2Name,
        team1Score: finalTeam1Score,
        team2Score: finalTeam2Score,
        winnerTeam: finalWinnerTeam,
        date: new Date(),
      });

      // Calculate MVP - find the best performing player based on statistics
      // MVP score formula considers: kills, K/D, headshots, damage, multi-kills, clutches, entry frags
      const calculateMVPScore = (row: any): number => {
        const kd = row.deaths > 0 ? row.kills / row.deaths : row.kills;
        const hsPercent = row.kills > 0 ? (row.head_shot_kills / row.kills) : 0;
        
        let score = 0;
        score += row.kills * 2;                    // 2 points per kill
        score += row.assists * 0.5;                // 0.5 points per assist
        score += kd * 5;                           // 5 points per K/D ratio
        score += hsPercent * 10;                   // Up to 10 points for HS%
        score += row.damage * 0.01;                // 0.01 points per damage
        score += row.enemy5ks * 15;                // 15 points per ACE
        score += row.enemy4ks * 10;                // 10 points per 4K
        score += row.enemy3ks * 5;                 // 5 points per 3K
        score += row.enemy2ks * 2;                 // 2 points per 2K
        score += row.v1_wins * 8;                  // 8 points per 1v1 clutch win
        score += row.v2_wins * 12;                 // 12 points per 1v2 clutch win
        score += row.entry_wins * 3;               // 3 points per entry frag win
        score += row.utility_damage * 0.02;        // 0.02 points per utility damage
        score += row.enemies_flashed * 0.5;        // 0.5 points per enemy flashed
        
        return score;
      };

      // Find the MVP (player with highest score)
      let mvpSteamId: string | null = null;
      let highestScore = -1;
      
      for (const row of rows) {
        const score = calculateMVPScore(row);
        if (score > highestScore) {
          highestScore = score;
          mvpSteamId = row.steamid64;
        }
      }

      // Process each player
      const usersToRecalculate: string[] = [];

      for (const row of rows) {
        // Find or create user by steamId64
        let user = await storage.getUserBySteamId(row.steamid64);
        
        if (!user) {
          // Create a new user from Steam data
          user = await storage.createPlayerFromSteam(row.steamid64, row.name);
        }

        usersToRecalculate.push(user.id);

        // Assign MVP = 1 to the best player, 0 to others
        const isMVP = row.steamid64 === mvpSteamId ? 1 : 0;

        // Create match stats
        await storage.createMatchStats({
          matchId: match.id,
          userId: user.id,
          steamId64: row.steamid64,
          team: row.team,
          playerName: row.name,
          kills: row.kills,
          deaths: row.deaths,
          assists: row.assists,
          damage: row.damage,
          headshots: row.head_shot_kills,
          enemy5ks: row.enemy5ks,
          enemy4ks: row.enemy4ks,
          enemy3ks: row.enemy3ks,
          enemy2ks: row.enemy2ks,
          utilityCount: row.utility_count,
          utilityDamage: row.utility_damage,
          utilitySuccesses: row.utility_successes,
          utilityEnemies: row.utility_enemies,
          flashCount: row.flash_count,
          flashSuccesses: row.flash_successes,
          enemiesFlashed: row.enemies_flashed,
          healthPointsRemovedTotal: row.health_points_removed_total,
          healthPointsDealtTotal: row.health_points_dealt_total,
          shotsFiredTotal: row.shots_fired_total,
          shotsOnTargetTotal: row.shots_on_target_total,
          v1Count: row.v1_count,
          v1Wins: row.v1_wins,
          v2Count: row.v2_count,
          v2Wins: row.v2_wins,
          entryCount: row.entry_count,
          entryWins: row.entry_wins,
          equipmentValue: row.equipment_value,
          moneySaved: row.money_saved,
          killReward: row.kill_reward,
          cashEarned: row.cash_earned,
          liveTime: row.live_time,
          mvps: isMVP,
          score: row.damage,
        });
      }

      // Recalculate stats for all users in this match
      const uniqueUserIds = Array.from(new Set(usersToRecalculate));
      for (const id of uniqueUserIds) {
        await storage.recalculateUserStats(id);
      }

      // Resolve pending bets for all players in this match
      let betsResolved = 0;
      const matchStats = await storage.getMatchStats(match.id);
      
      for (const stat of matchStats) {
        // Find pending bets for this player
        const pendingBets = await storage.getPendingBetsForPlayer(stat.userId);
        
        for (const bet of pendingBets) {
          // Pass the match winner team for "win" bet type resolution
          await storage.resolveBet(bet.id, stat, finalWinnerTeam);
          betsResolved++;
        }
      }

      res.json({ 
        message: "Match imported successfully",
        matchId: match.id,
        playersProcessed: rows.length,
        betsResolved
      });
    } catch (error) {
      console.error("Error importing match:", error);
      res.status(500).json({ message: "Failed to import match" });
    }
  });

  // Get all matches
  app.get('/api/matches', isAuthenticated, async (req: any, res) => {
    try {
      const matches = await storage.getAllMatches();
      res.json(matches);
    } catch (error) {
      console.error("Error fetching matches:", error);
      res.status(500).json({ message: "Failed to fetch matches" });
    }
  });

  // Get all matches with aggregated stats
  app.get('/api/matches/with-stats', isAuthenticated, async (req: any, res) => {
    try {
      const matches = await storage.getAllMatches();
      const matchesWithStats = await Promise.all(
        matches.map(async (match) => {
          const stats = await storage.getMatchStats(match.id);
          const aggregated = {
            totalKills: stats.reduce((sum, s) => sum + s.kills, 0),
            totalDeaths: stats.reduce((sum, s) => sum + s.deaths, 0),
            totalDamage: stats.reduce((sum, s) => sum + s.damage, 0),
            totalHeadshots: stats.reduce((sum, s) => sum + s.headshots, 0),
            playerCount: stats.length,
            topKiller: stats.length > 0 
              ? stats.reduce((top, s) => s.kills > top.kills ? s : top) 
              : null,
            mvpPlayer: stats.find(s => s.mvps > 0) || null,
          };
          return { match, stats, aggregated };
        })
      );
      res.json(matchesWithStats);
    } catch (error) {
      console.error("Error fetching matches with stats:", error);
      res.status(500).json({ message: "Failed to fetch matches with stats" });
    }
  });

  // Get match details with player stats
  app.get('/api/matches/:id', isAuthenticated, async (req: any, res) => {
    try {
      const matchId = req.params.id;
      const match = await storage.getMatch(matchId);
      
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }

      const stats = await storage.getMatchStats(matchId);
      
      res.json({ match, stats });
    } catch (error) {
      console.error("Error fetching match:", error);
      res.status(500).json({ message: "Failed to fetch match" });
    }
  });

  // Get user's match stats
  app.get('/api/users/:id/matches', isAuthenticated, async (req: any, res) => {
    try {
      const targetId = req.params.id;
      const matchStatsWithMatches = await storage.getUserMatchStatsWithMatches(targetId);
      res.json(matchStatsWithMatches);
    } catch (error) {
      console.error("Error fetching user match stats:", error);
      res.status(500).json({ message: "Failed to fetch user match stats" });
    }
  });

  // Get monthly stats for all players
  app.get('/api/stats/monthly', isAuthenticated, async (req: any, res) => {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Get all matches from current month
      const allMatches = await storage.getAllMatches();
      const monthlyMatches = allMatches.filter(m => {
        const matchDate = new Date(m.date);
        return matchDate >= firstDayOfMonth && matchDate <= lastDayOfMonth;
      });
      
      // Get all users
      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u]));
      
      // Calculate stats per player for the month
      const playerStats: Record<string, {
        userId: string;
        kills: number;
        deaths: number;
        assists: number;
        headshots: number;
        damage: number;
        mvps: number;
        matchesPlayed: number;
        matchesWon: number;
        total5ks: number;
        total4ks: number;
        total3ks: number;
        seenMatches: Set<string>;
      }> = {};
      
      for (const match of monthlyMatches) {
        const stats = await storage.getMatchStats(match.id);
        
        for (const stat of stats) {
          if (!playerStats[stat.userId]) {
            playerStats[stat.userId] = {
              userId: stat.userId,
              kills: 0,
              deaths: 0,
              assists: 0,
              headshots: 0,
              damage: 0,
              mvps: 0,
              matchesPlayed: 0,
              matchesWon: 0,
              total5ks: 0,
              total4ks: 0,
              total3ks: 0,
              seenMatches: new Set(),
            };
          }
          
          const ps = playerStats[stat.userId];
          ps.kills += stat.kills;
          ps.deaths += stat.deaths;
          ps.assists += stat.assists;
          ps.headshots += stat.headshots;
          ps.damage += stat.damage;
          ps.mvps += stat.mvps;
          ps.total5ks += stat.enemy5ks;
          ps.total4ks += stat.enemy4ks;
          ps.total3ks += stat.enemy3ks;
          
          // Count match only once per player (deduplicate by matchId)
          if (!ps.seenMatches.has(match.id)) {
            ps.seenMatches.add(match.id);
            ps.matchesPlayed += 1;
            
            // Check if player won this match by comparing their team with winnerTeam
            if (match.winnerTeam && stat.team === match.winnerTeam) {
              ps.matchesWon += 1;
            }
          }
        }
      }
      
      // Combine with user data (remove seenMatches Set before sending)
      const result = Object.values(playerStats).map(ps => {
        const user = userMap.get(ps.userId);
        const { seenMatches, ...statsWithoutSet } = ps;
        return {
          ...statsWithoutSet,
          user: user ? {
            id: user.id,
            nickname: user.nickname,
            firstName: user.firstName,
            email: user.email,
            profileImageUrl: user.profileImageUrl,
            steamId64: user.steamId64,
          } : null,
        };
      }).filter(p => p.user !== null);
      
      res.json({
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        monthName: now.toLocaleString('pt-BR', { month: 'long' }),
        players: result,
      });
    } catch (error) {
      console.error("Error fetching monthly stats:", error);
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // Merge two users (admin only)
  app.post('/api/users/merge', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { sourceUserId, targetUserId } = req.body;

      if (!sourceUserId || !targetUserId) {
        return res.status(400).json({ message: "sourceUserId e targetUserId são obrigatórios" });
      }

      if (sourceUserId === targetUserId) {
        return res.status(400).json({ message: "Não é possível mesclar um usuário consigo mesmo" });
      }

      const mergedUser = await storage.mergeUsers(sourceUserId, targetUserId);

      if (!mergedUser) {
        return res.status(404).json({ message: "Um ou ambos os usuários não foram encontrados" });
      }

      res.json({ 
        message: "Usuários mesclados com sucesso!", 
        user: mergedUser 
      });
    } catch (error) {
      console.error("Error merging users:", error);
      res.status(500).json({ message: "Erro ao mesclar usuários" });
    }
  });

  // Payment routes
  app.get('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get('/api/users/:id/payments', isAuthenticated, async (req: any, res) => {
    try {
      const payments = await storage.getPaymentsByUser(req.params.id);
      res.json(payments);
    } catch (error) {
      console.error("Error fetching user payments:", error);
      res.status(500).json({ message: "Failed to fetch user payments" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const { userId: paymentUserId, amount, description, paymentDate } = req.body;

      if (!paymentUserId || typeof amount !== 'number') {
        return res.status(400).json({ message: "User ID and amount are required" });
      }

      const payment = await storage.createPayment({
        userId: paymentUserId,
        amount,
        description: description || '',
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        createdBy: userId,
      });

      res.json(payment);
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.delete('/api/payments/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const deleted = await storage.deletePayment(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json({ message: "Payment deleted successfully" });
    } catch (error) {
      console.error("Error deleting payment:", error);
      res.status(500).json({ message: "Failed to delete payment" });
    }
  });

  // Report routes
  app.get('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const reports = await storage.getAllReports();
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ message: "Failed to fetch reports" });
    }
  });

  app.post('/api/reports', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { description, attachmentUrl, attachmentType, isAnonymous } = req.body;

      if (!description || typeof description !== 'string' || description.length < 10) {
        return res.status(400).json({ message: "A descrição deve ter pelo menos 10 caracteres" });
      }

      if (description.length > 2000) {
        return res.status(400).json({ message: "A descrição não pode exceder 2000 caracteres" });
      }

      let validatedAttachmentUrl: string | null = null;
      let validatedAttachmentType: string | null = null;

      if (attachmentUrl && typeof attachmentUrl === 'string') {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        
        if (!attachmentType || !allowedTypes.includes(attachmentType)) {
          return res.status(400).json({ message: "Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP." });
        }

        if (!attachmentUrl.startsWith('data:image/')) {
          return res.status(400).json({ message: "Formato de anexo inválido." });
        }

        const maxSizeBytes = 2 * 1024 * 1024;
        const base64Data = attachmentUrl.split(',')[1];
        if (base64Data) {
          const sizeBytes = (base64Data.length * 3) / 4;
          if (sizeBytes > maxSizeBytes) {
            return res.status(400).json({ message: "O anexo deve ter no máximo 2MB." });
          }
        }

        validatedAttachmentUrl = attachmentUrl;
        validatedAttachmentType = attachmentType;
      }

      const report = await storage.createReport({
        userId: isAnonymous ? null : userId,
        description,
        attachmentUrl: validatedAttachmentUrl,
        attachmentType: validatedAttachmentType,
        isAnonymous: isAnonymous || false,
        status: "pending",
      });

      res.json(report);
    } catch (error) {
      console.error("Error creating report:", error);
      res.status(500).json({ message: "Failed to create report" });
    }
  });

  app.patch('/api/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const reportId = req.params.id;
      const { status, adminNotes } = req.body;

      const updatedReport = await storage.updateReport(reportId, {
        status,
        adminNotes,
        reviewedBy: userId,
      });

      if (!updatedReport) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json(updatedReport);
    } catch (error) {
      console.error("Error updating report:", error);
      res.status(500).json({ message: "Failed to update report" });
    }
  });

  app.delete('/api/reports/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const deleted = await storage.deleteReport(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Report not found" });
      }

      res.json({ message: "Report deleted successfully" });
    } catch (error) {
      console.error("Error deleting report:", error);
      res.status(500).json({ message: "Failed to delete report" });
    }
  });

  // Championship registration routes
  app.get('/api/championship-registrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const registrations = await storage.getAllChampionshipRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching championship registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  app.get('/api/championship-registrations/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const registration = await storage.getChampionshipRegistrationByUser(userId);
      res.json({ registered: !!registration, registration });
    } catch (error) {
      console.error("Error checking registration:", error);
      res.status(500).json({ message: "Failed to check registration" });
    }
  });

  app.post('/api/championship-registrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if already registered
      const existing = await storage.getChampionshipRegistrationByUser(userId);
      if (existing) {
        return res.status(400).json({ message: "Already registered" });
      }

      const registration = await storage.createChampionshipRegistration({
        userId,
        status: "interested",
      });
      res.json(registration);
    } catch (error) {
      console.error("Error creating registration:", error);
      res.status(500).json({ message: "Failed to create registration" });
    }
  });

  app.delete('/api/championship-registrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const deleted = await storage.deleteChampionshipRegistration(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Registration not found" });
      }

      res.json({ message: "Registration deleted successfully" });
    } catch (error) {
      console.error("Error deleting registration:", error);
      res.status(500).json({ message: "Failed to delete registration" });
    }
  });

  // Monthly Rankings endpoints (Admin only)
  app.get('/api/monthly-rankings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const rankings = await storage.getAllMonthlyRankings();
      res.json(rankings);
    } catch (error) {
      console.error("Error fetching monthly rankings:", error);
      res.status(500).json({ message: "Failed to fetch monthly rankings" });
    }
  });

  app.post('/api/monthly-rankings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const { month, year, rankings } = req.body;

      if (!month || !year || !rankings) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Check if ranking for this month/year already exists
      const existing = await storage.getMonthlyRankingByMonthYear(month, year);
      if (existing) {
        return res.status(400).json({ message: "Ranking para este mês já existe" });
      }

      const newRanking = await storage.createMonthlyRanking({
        month,
        year,
        rankings,
      });

      res.json(newRanking);
    } catch (error) {
      console.error("Error creating monthly ranking:", error);
      res.status(500).json({ message: "Failed to create monthly ranking" });
    }
  });

  app.delete('/api/monthly-rankings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Forbidden - Admin access required" });
      }

      const deleted = await storage.deleteMonthlyRanking(parseInt(req.params.id));
      
      if (!deleted) {
        return res.status(404).json({ message: "Ranking not found" });
      }

      res.json({ message: "Ranking deleted successfully" });
    } catch (error) {
      console.error("Error deleting monthly ranking:", error);
      res.status(500).json({ message: "Failed to delete monthly ranking" });
    }
  });

  // ============ CASINO ROUTES ============

  // Get user's casino balance
  app.get('/api/casino/balance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const balance = await storage.getOrCreateCasinoBalance(userId);
      res.json(balance);
    } catch (error) {
      console.error("Error getting casino balance:", error);
      res.status(500).json({ message: "Failed to get balance" });
    }
  });

  // Get user's casino transactions
  app.get('/api/casino/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const transactions = await storage.getCasinoTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error getting transactions:", error);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  });

  // Get user's bets
  app.get('/api/casino/bets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBets = await storage.getUserBets(userId);
      res.json(userBets);
    } catch (error) {
      console.error("Error getting bets:", error);
      res.status(500).json({ message: "Failed to get bets" });
    }
  });

  // Calculate odds for a player bet
  app.post('/api/casino/calculate-odds', isAuthenticated, async (req: any, res) => {
    try {
      const { targetPlayerId, items } = req.body;
      
      const targetPlayer = await storage.getUser(targetPlayerId);
      if (!targetPlayer) {
        return res.status(404).json({ message: "Jogador não encontrado" });
      }

      // Calculate odds based on player's historical stats
      const totalMatches = targetPlayer.totalMatches || 1;
      const avgKills = (targetPlayer.totalKills || 0) / totalMatches;
      const avgDeaths = (targetPlayer.totalDeaths || 0) / totalMatches;
      const avgKD = avgDeaths > 0 ? avgKills / avgDeaths : avgKills;
      const avgHeadshots = (targetPlayer.totalHeadshots || 0) / totalMatches;
      const avgMvps = (targetPlayer.totalMvps || 0) / totalMatches;
      const avgDamage = (targetPlayer.totalDamage || 0) / totalMatches;
      const winRate = totalMatches > 0 ? ((targetPlayer.matchesWon || 0) / totalMatches) * 100 : 50;

      const calculatedItems = items.map((item: { betType: string; targetValue: number }) => {
        let odds = 1.5; // Base odds
        
        switch (item.betType) {
          case 'kills_over':
            // Higher target = higher odds, based on how far from average
            const killsDiff = item.targetValue - avgKills;
            odds = Math.max(1.1, 1.5 + (killsDiff * 0.15));
            break;
          case 'kills_under':
            const killsUnderDiff = avgKills - item.targetValue;
            odds = Math.max(1.1, 1.5 + (killsUnderDiff * 0.15));
            break;
          case 'deaths_under':
            const deathsDiff = avgDeaths - item.targetValue;
            odds = Math.max(1.1, 1.5 + (deathsDiff * 0.2));
            break;
          case 'kd_over':
            const kdDiff = item.targetValue - avgKD;
            odds = Math.max(1.1, 1.5 + (kdDiff * 0.5));
            break;
          case 'headshots_over':
            const hsDiff = item.targetValue - avgHeadshots;
            odds = Math.max(1.1, 1.5 + (hsDiff * 0.1));
            break;
          case 'mvps_over':
            const mvpDiff = item.targetValue - avgMvps;
            odds = Math.max(1.1, 2.0 + (mvpDiff * 0.8));
            break;
          case 'damage_over':
            const dmgDiff = (item.targetValue - avgDamage) / 100;
            odds = Math.max(1.1, 1.5 + (dmgDiff * 0.3));
            break;
          case 'win':
            // Based on win rate
            odds = winRate > 50 ? Math.max(1.1, 1.5 + ((100 - winRate) / 50)) : Math.max(1.1, 1.5 + (winRate / 50));
            break;
        }

        return {
          ...item,
          odds: Math.round(odds * 100) / 100, // Round to 2 decimal places
        };
      });

      res.json({
        player: {
          id: targetPlayer.id,
          nickname: targetPlayer.nickname || targetPlayer.firstName,
          avgKills: Math.round(avgKills * 10) / 10,
          avgKD: Math.round(avgKD * 100) / 100,
          avgHeadshots: Math.round(avgHeadshots * 10) / 10,
          winRate: Math.round(winRate),
        },
        items: calculatedItems,
        totalOdds: Math.round(calculatedItems.reduce((acc: number, item: any) => acc * item.odds, 1) * 100) / 100,
      });
    } catch (error) {
      console.error("Error calculating odds:", error);
      res.status(500).json({ message: "Failed to calculate odds" });
    }
  });

  // Place a bet
  app.post('/api/casino/bets', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetPlayerId, amount, items } = req.body;

      // Validate minimum bet
      if (amount < 10) {
        return res.status(400).json({ message: "Aposta mínima é R$10" });
      }

      // Can't bet on yourself
      if (targetPlayerId === userId) {
        return res.status(400).json({ message: "Você não pode apostar em você mesmo!" });
      }

      // Check if player exists
      const targetPlayer = await storage.getUser(targetPlayerId);
      if (!targetPlayer) {
        return res.status(404).json({ message: "Jogador não encontrado" });
      }

      // Calculate odds for each item
      const totalMatches = targetPlayer.totalMatches || 1;
      const avgKills = (targetPlayer.totalKills || 0) / totalMatches;
      const avgDeaths = (targetPlayer.totalDeaths || 0) / totalMatches;
      const avgKD = avgDeaths > 0 ? avgKills / avgDeaths : avgKills;
      const avgHeadshots = (targetPlayer.totalHeadshots || 0) / totalMatches;
      const avgMvps = (targetPlayer.totalMvps || 0) / totalMatches;
      const avgDamage = (targetPlayer.totalDamage || 0) / totalMatches;
      const winRate = totalMatches > 0 ? ((targetPlayer.matchesWon || 0) / totalMatches) * 100 : 50;

      const itemsWithOdds = items.map((item: { betType: string; targetValue: number }) => {
        let odds = 1.5;
        
        switch (item.betType) {
          case 'kills_over':
            odds = Math.max(1.1, 1.5 + ((item.targetValue - avgKills) * 0.15));
            break;
          case 'kills_under':
            odds = Math.max(1.1, 1.5 + ((avgKills - item.targetValue) * 0.15));
            break;
          case 'deaths_under':
            odds = Math.max(1.1, 1.5 + ((avgDeaths - item.targetValue) * 0.2));
            break;
          case 'kd_over':
            odds = Math.max(1.1, 1.5 + ((item.targetValue - avgKD) * 0.5));
            break;
          case 'headshots_over':
            odds = Math.max(1.1, 1.5 + ((item.targetValue - avgHeadshots) * 0.1));
            break;
          case 'mvps_over':
            odds = Math.max(1.1, 2.0 + ((item.targetValue - avgMvps) * 0.8));
            break;
          case 'damage_over':
            odds = Math.max(1.1, 1.5 + (((item.targetValue - avgDamage) / 100) * 0.3));
            break;
          case 'win':
            odds = winRate > 50 ? Math.max(1.1, 1.5 + ((100 - winRate) / 50)) : Math.max(1.1, 1.5 + (winRate / 50));
            break;
        }

        return {
          ...item,
          odds: Math.round(odds * 100) / 100,
        };
      });

      const bet = await storage.createBet(userId, targetPlayerId, amount, itemsWithOdds);
      
      if (!bet) {
        return res.status(400).json({ message: "Saldo insuficiente para essa aposta" });
      }

      res.json(bet);
    } catch (error) {
      console.error("Error placing bet:", error);
      res.status(500).json({ message: "Erro ao registrar aposta" });
    }
  });

  // Delete a pending bet
  app.delete('/api/casino/bets/:betId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { betId } = req.params;

      const result = await storage.deleteBet(betId, userId);
      
      if (!result.success) {
        return res.status(400).json({ message: "Não foi possível cancelar a aposta. Apenas apostas pendentes podem ser canceladas." });
      }

      res.json({ 
        success: true, 
        message: "Aposta cancelada com sucesso!", 
        refundAmount: result.refundAmount 
      });
    } catch (error) {
      console.error("Error deleting bet:", error);
      res.status(500).json({ message: "Erro ao cancelar aposta" });
    }
  });

  // Play slot machine (Tigrinho)
  app.post('/api/casino/slot', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;

      if (amount < 10) {
        return res.status(400).json({ message: "Aposta mínima é R$10" });
      }

      // Check balance and deduct bet
      const balance = await storage.getOrCreateCasinoBalance(userId);
      if (balance.balance < amount) {
        return res.status(400).json({ message: "Saldo insuficiente" });
      }

      // 10% chance to win
      const won = Math.random() < 0.10;
      
      let multiplier = 0;
      let result = 'lost';
      
      if (won) {
        // Random multiplier between 2x and 50x
        multiplier = Math.random() < 0.8 
          ? 2 + Math.random() * 8  // 80% chance: 2x-10x
          : 10 + Math.random() * 40; // 20% chance: 10x-50x
        multiplier = Math.round(multiplier * 10) / 10;
        result = 'won';
      }

      const winnings = won ? amount * multiplier : 0;
      const netResult = winnings - amount;

      // Update balance
      await storage.updateCasinoBalance(
        userId, 
        netResult, 
        won ? 'slot_win' : 'slot_loss',
        won ? `Tigrinho: Ganhou ${multiplier}x! (R$${winnings.toLocaleString('pt-BR')})` : `Tigrinho: Perdeu R$${amount.toLocaleString('pt-BR')}`
      );

      // Get updated balance
      const newBalance = await storage.getCasinoBalance(userId);

      res.json({
        won,
        multiplier,
        betAmount: amount,
        winnings,
        newBalance: newBalance?.balance || 0,
        symbols: generateSlotSymbols(won), // Visual symbols for frontend
      });
    } catch (error) {
      console.error("Error playing slot:", error);
      res.status(500).json({ message: "Erro no jogo" });
    }
  });

  // Open case (CS:GO case simulation)
  app.post('/api/casino/case', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { caseType } = req.body;

      // Case prices
      const casePrices: Record<string, number> = {
        'basic': 5000,
        'premium': 25000,
        'elite': 100000,
        'legendary': 500000,
      };

      const price = casePrices[caseType] || casePrices.basic;

      // Check balance
      const balance = await storage.getOrCreateCasinoBalance(userId);
      if (balance.balance < price) {
        return res.status(400).json({ message: "Saldo insuficiente para abrir essa caixa" });
      }

      // Generate random item with weighted rarity - 30% total win chance with 2x-50x
      const roll = Math.random() * 100;
      let rarity: string;
      let multiplier: number;
      
      if (roll < 40) {
        rarity = 'Consumidor'; // 40% - always loss (0.1x - 0.9x)
        multiplier = 0.1 + Math.random() * 0.8;
      } else if (roll < 70) {
        rarity = 'Industrial'; // 30% - wins start here (2x - 5x)
        multiplier = 2.0 + Math.random() * 3.0;
      } else if (roll < 88) {
        rarity = 'Militar'; // 18% - medium win (5x - 15x)
        multiplier = 5.0 + Math.random() * 10.0;
      } else if (roll < 96) {
        rarity = 'Restrito'; // 8% - good win (15x - 30x)
        multiplier = 15.0 + Math.random() * 15.0;
      } else if (roll < 99.5) {
        rarity = 'Secreto'; // 3.5% - great win (30x - 50x)
        multiplier = 30.0 + Math.random() * 20.0;
      } else {
        rarity = 'Faca/Luva'; // 0.5% - jackpot (50x)
        multiplier = 50.0;
      }

      multiplier = Math.round(multiplier * 100) / 100;
      const value = Math.round(price * multiplier);
      const netResult = value - price;

      // Generate random skin name
      const skins = generateRandomSkin(rarity);

      // Update balance
      await storage.updateCasinoBalance(
        userId,
        netResult,
        'case_opening',
        `Caixa ${caseType}: ${skins.name} (${rarity}) - R$${value.toLocaleString('pt-BR')}`
      );

      const newBalance = await storage.getCasinoBalance(userId);

      res.json({
        item: {
          name: skins.name,
          rarity,
          value,
          multiplier,
          weapon: skins.weapon,
          skin: skins.skin,
        },
        casePrice: price,
        profit: netResult,
        newBalance: newBalance?.balance || 0,
      });
    } catch (error) {
      console.error("Error opening case:", error);
      res.status(500).json({ message: "Erro ao abrir caixa" });
    }
  });

  // Mix availability routes
  app.get('/api/mix/availability/:date', isAuthenticated, async (req: any, res) => {
    try {
      const { date } = req.params;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: "Data inválida. Use o formato YYYY-MM-DD" });
      }
      const list = await storage.getMixList(date);
      res.json(list);
    } catch (error) {
      console.error("Error fetching mix list:", error);
      res.status(500).json({ message: "Erro ao buscar lista do mix" });
    }
  });

  app.post('/api/mix/availability/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const joinSchema = z.object({
        listDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
        isSub: z.boolean().optional().default(false),
      });
      
      const parsed = joinSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      
      let { listDate, isSub } = parsed.data;

      const penaltyCount = await storage.getActivePenaltyCount(userId);

      if (penaltyCount >= 3) {
        return res.status(403).json({
          message: "Você está suspenso por 1 lista devido a faltas repetidas. Aguarde a próxima lista.",
          penaltyCount,
          suspended: true,
        });
      }

      if (penaltyCount >= 1 && !isSub) {
        isSub = true;
      }

      const entry = await storage.joinMixList(userId, listDate, isSub);
      if (!entry) {
        return res.status(400).json({ message: "Você já está na lista deste dia" });
      }
      res.json({ ...entry, forcedSub: penaltyCount >= 1 && !parsed.data.isSub });
    } catch (error) {
      console.error("Error joining mix list:", error);
      res.status(500).json({ message: "Erro ao entrar na lista" });
    }
  });

  app.post('/api/mix/availability/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const leaveSchema = z.object({
        listDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
      });
      
      const parsed = leaveSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos" });
      }
      
      const { listDate } = parsed.data;

      const success = await storage.leaveMixList(userId, listDate);
      if (!success) {
        return res.status(400).json({ message: "Você não está na lista deste dia" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving mix list:", error);
      res.status(500).json({ message: "Erro ao sair da lista" });
    }
  });

  // Admin: add a player to the mix list
  app.post('/api/mix/availability/admin-add', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const currentUser = await storage.getUser(adminId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Apenas admins podem adicionar jogadores na lista" });
      }

      const addSchema = z.object({
        listDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
        userId: z.string().min(1),
        isSub: z.boolean().optional().default(false),
      });

      const parsed = addSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const { listDate, userId, isSub } = parsed.data;

      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const entry = await storage.joinMixList(userId, listDate, isSub);
      if (!entry) {
        return res.status(400).json({ message: "Jogador já está na lista deste dia" });
      }
      res.json(entry);
    } catch (error) {
      console.error("Error admin adding to mix list:", error);
      res.status(500).json({ message: "Erro ao adicionar jogador na lista" });
    }
  });

  // Admin: remove a player from the mix list without penalty
  app.post('/api/mix/availability/admin-remove', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const currentUser = await storage.getUser(adminId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Apenas admins podem remover jogadores da lista" });
      }

      const removeSchema = z.object({
        listDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
        userId: z.string().min(1),
      });

      const parsed = removeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const success = await storage.leaveMixList(parsed.data.userId, parsed.data.listDate);
      if (!success) {
        return res.status(400).json({ message: "Jogador não está na lista deste dia" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error admin removing from mix list:", error);
      res.status(500).json({ message: "Erro ao remover jogador da lista" });
    }
  });

  // Get user's penalty status
  app.get('/api/mix/penalties/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const penalties = await storage.getUserPenalties(userId);
      const count = penalties.length;
      res.json({
        penalties,
        count,
        forcedSub: count >= 1 && count < 3,
        suspended: count >= 3,
      });
    } catch (error) {
      console.error("Error fetching penalties:", error);
      res.status(500).json({ message: "Erro ao buscar penalidades" });
    }
  });

  // Admin: confirm who played from the mix list
  app.post('/api/mix/confirm-played', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Apenas admins podem confirmar a lista" });
      }

      const confirmSchema = z.object({
        listDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
        playedUserIds: z.array(z.string()),
      });

      const parsed = confirmSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const { listDate, playedUserIds } = parsed.data;
      const listUserIds = await storage.getMixListUserIds(listDate);
      const playedSet = new Set(playedUserIds);

      const noShowUsers: string[] = [];
      for (const uid of listUserIds) {
        if (!playedSet.has(uid)) {
          await storage.addPenalty(uid, listDate);
          noShowUsers.push(uid);
        }
      }

      res.json({
        confirmed: true,
        listDate,
        totalInList: listUserIds.length,
        totalPlayed: playedUserIds.length,
        noShowCount: noShowUsers.length,
        noShowUserIds: noShowUsers,
      });
    } catch (error) {
      console.error("Error confirming mix list:", error);
      res.status(500).json({ message: "Erro ao confirmar lista" });
    }
  });

  // Admin: clear penalties for a user
  app.delete('/api/mix/penalties/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const currentUser = await storage.getUser(adminId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Apenas admins podem limpar penalidades" });
      }

      const { userId } = req.params;
      await db.delete(mixPenalties).where(eq(mixPenalties.userId, userId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error clearing penalties:", error);
      res.status(500).json({ message: "Erro ao limpar penalidades" });
    }
  });

  // Monthly stats with month/year parameter for history
  app.get('/api/stats/monthly/:year/:month', isAuthenticated, async (req: any, res) => {
    try {
      const year = parseInt(req.params.year);
      const month = parseInt(req.params.month);
      
      if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
        return res.status(400).json({ message: "Mês ou ano inválido" });
      }

      const firstDayOfMonth = new Date(year, month - 1, 1);
      const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59);

      const allMatches = await storage.getAllMatches();
      const monthlyMatches = allMatches.filter(m => {
        const matchDate = new Date(m.date);
        return matchDate >= firstDayOfMonth && matchDate <= lastDayOfMonth;
      });

      const allUsers = await storage.getAllUsers();
      const userMap = new Map(allUsers.map(u => [u.id, u]));

      const playerStats: Record<string, {
        userId: string;
        kills: number; deaths: number; assists: number;
        headshots: number; damage: number; mvps: number;
        matchesPlayed: number; matchesWon: number;
        total5ks: number; total4ks: number; total3ks: number;
        seenMatches: Set<string>;
      }> = {};

      for (const match of monthlyMatches) {
        const stats = await storage.getMatchStats(match.id);
        for (const stat of stats) {
          if (!playerStats[stat.userId]) {
            playerStats[stat.userId] = {
              userId: stat.userId,
              kills: 0, deaths: 0, assists: 0,
              headshots: 0, damage: 0, mvps: 0,
              matchesPlayed: 0, matchesWon: 0,
              total5ks: 0, total4ks: 0, total3ks: 0,
              seenMatches: new Set(),
            };
          }
          const ps = playerStats[stat.userId];
          ps.kills += stat.kills;
          ps.deaths += stat.deaths;
          ps.assists += stat.assists;
          ps.headshots += stat.headshots;
          ps.damage += stat.damage;
          ps.mvps += stat.mvps;
          ps.total5ks += stat.enemy5ks;
          ps.total4ks += stat.enemy4ks;
          ps.total3ks += stat.enemy3ks;

          if (!ps.seenMatches.has(match.id)) {
            ps.seenMatches.add(match.id);
            ps.matchesPlayed += 1;
            // Check if player won this match by comparing their team with winnerTeam
            if (match.winnerTeam && stat.team === match.winnerTeam) {
              ps.matchesWon += 1;
            }
          }
        }
      }

      const result = Object.values(playerStats).map(ps => {
        const user = userMap.get(ps.userId);
        const { seenMatches, ...statsWithoutSet } = ps;
        return {
          ...statsWithoutSet,
          user: user ? {
            id: user.id, nickname: user.nickname, firstName: user.firstName,
            email: user.email, profileImageUrl: user.profileImageUrl, steamId64: user.steamId64,
          } : null,
        };
      }).filter(p => p.user !== null);

      const monthDate = new Date(year, month - 1, 1);
      res.json({
        month,
        year,
        monthName: monthDate.toLocaleString('pt-BR', { month: 'long' }),
        players: result,
      });
    } catch (error) {
      console.error("Error fetching monthly stats by date:", error);
      res.status(500).json({ message: "Failed to fetch monthly stats" });
    }
  });

  // News endpoints
  app.get('/api/news', isAuthenticated, async (req: any, res) => {
    try {
      const allNews = await storage.getAllNews();
      res.json(allNews);
    } catch (error) {
      console.error("Error fetching news:", error);
      res.status(500).json({ message: "Erro ao buscar notícias" });
    }
  });

  app.post('/api/news', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Apenas admins podem publicar notícias" });
      }

      const newsSchema = z.object({
        title: z.string().min(1, "Título obrigatório").max(200),
        content: z.string().min(1, "Conteúdo obrigatório").max(2000),
      });

      const parsed = newsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos" });
      }

      const item = await storage.createNews(userId, parsed.data.title, parsed.data.content);
      res.json(item);
    } catch (error) {
      console.error("Error creating news:", error);
      res.status(500).json({ message: "Erro ao criar notícia" });
    }
  });

  app.delete('/api/news/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const currentUser = await storage.getUser(userId);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Apenas admins podem deletar notícias" });
      }

      const success = await storage.deleteNews(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notícia não encontrada" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting news:", error);
      res.status(500).json({ message: "Erro ao deletar notícia" });
    }
  });

  // Get latest match MVP for mural
  app.get('/api/matches/latest-mvp', isAuthenticated, async (req: any, res) => {
    try {
      const result = await storage.getLatestMatchWithMvp();
      if (!result) {
        return res.json(null);
      }
      res.json(result);
    } catch (error) {
      console.error("Error fetching latest MVP:", error);
      res.status(500).json({ message: "Erro ao buscar MVP" });
    }
  });

  return httpServer;
}

// Helper function to generate slot symbols
function generateSlotSymbols(won: boolean): string[][] {
  const symbols = ['🐯', '💎', '7️⃣', '🍀', '⭐', '🔔', '🍒', '🍋'];
  
  if (won) {
    // Winning combination - at least one row matches
    const winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const winRow = Math.floor(Math.random() * 3);
    return Array(3).fill(null).map((_, row) => {
      if (row === winRow) {
        return [winSymbol, winSymbol, winSymbol];
      }
      return Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)]);
    });
  } else {
    // Losing combination - no matching rows
    return Array(3).fill(null).map(() => {
      const row = Array(3).fill(null).map(() => symbols[Math.floor(Math.random() * symbols.length)]);
      // Ensure no three in a row
      if (row[0] === row[1] && row[1] === row[2]) {
        row[2] = symbols[(symbols.indexOf(row[2]) + 1) % symbols.length];
      }
      return row;
    });
  }
}

// Helper function to generate random CS:GO-style skin
function generateRandomSkin(rarity: string): { name: string; weapon: string; skin: string } {
  const weapons: Record<string, string[]> = {
    'Consumidor': ['P250', 'MAG-7', 'PP-Bizon', 'Sawed-Off', 'Nova'],
    'Industrial': ['Galil AR', 'FAMAS', 'MAC-10', 'MP7', 'UMP-45'],
    'Militar': ['M4A4', 'AK-47', 'AWP', 'Desert Eagle', 'USP-S'],
    'Restrito': ['M4A1-S', 'AK-47', 'AWP', 'Glock-18', 'Five-SeveN'],
    'Secreto': ['AK-47', 'M4A4', 'AWP', 'Desert Eagle', 'USP-S'],
    'Faca/Luva': ['Karambit', 'Butterfly Knife', 'M9 Bayonet', 'Skeleton Knife', 'Talon Knife'],
  };

  const skins: Record<string, string[]> = {
    'Consumidor': ['Sand Dune', 'Safari Mesh', 'Groundwater', 'Forest DDPAT', 'Urban DDPAT'],
    'Industrial': ['Blue Steel', 'Stainless', 'Urban Masked', 'Jungle Tiger', 'Predator'],
    'Militar': ['Redline', 'Asiimov', 'Hyper Beast', 'Vulcan', 'Kill Confirmed'],
    'Restrito': ['Neo-Noir', 'Printstream', 'The Prince', 'Fade', 'Fire Serpent'],
    'Secreto': ['Dragon Lore', 'Howl', 'Medusa', 'Gungnir', 'The Empress'],
    'Faca/Luva': ['Doppler', 'Fade', 'Marble Fade', 'Tiger Tooth', 'Crimson Web'],
  };

  const weaponList = weapons[rarity] || weapons['Consumidor'];
  const skinList = skins[rarity] || skins['Consumidor'];
  
  const weapon = weaponList[Math.floor(Math.random() * weaponList.length)];
  const skin = skinList[Math.floor(Math.random() * skinList.length)];
  
  return {
    name: `${weapon} | ${skin}`,
    weapon,
    skin,
  };
}
