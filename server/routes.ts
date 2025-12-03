import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { updateUserStatsSchema } from "@shared/schema";
import { z } from "zod";

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

  // Link SteamID64 to user account
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
        return res.status(400).json({ message: "Este SteamID64 já está vinculado a outra conta" });
      }

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

      const { csvContent, map } = req.body;

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

      // Calculate scores based on kills (this is a simplification)
      const team1Players = rows.filter(r => r.team === team1Name);
      const team2Players = rows.filter(r => r.team === team2Name);
      const team1Score = team1Players.reduce((sum, p) => sum + p.kills, 0);
      const team2Score = team2Players.reduce((sum, p) => sum + p.kills, 0);

      // Create match
      const match = await storage.createMatch({
        externalMatchId: matchId,
        mapNumber,
        map,
        team1Name,
        team2Name,
        team1Score: Math.round(team1Score / 5), // Normalize to approximate round wins
        team2Score: Math.round(team2Score / 5),
        date: new Date(),
      });

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
          mvps: 0,
          score: row.damage,
        });
      }

      // Recalculate stats for all users in this match
      const uniqueUserIds = Array.from(new Set(usersToRecalculate));
      for (const id of uniqueUserIds) {
        await storage.recalculateUserStats(id);
      }

      res.json({ 
        message: "Match imported successfully",
        matchId: match.id,
        playersProcessed: rows.length
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
      const matchStats = await storage.getUserMatchStats(targetId);
      res.json(matchStats);
    } catch (error) {
      console.error("Error fetching user match stats:", error);
      res.status(500).json({ message: "Failed to fetch user match stats" });
    }
  });

  // Update current user profile (name, photo, steamId)
  app.patch('/api/users/me', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { firstName, lastName, nickname, profileImageUrl, steamId64 } = req.body;
      
      // If linking steamId64, check if it already belongs to another user
      if (steamId64) {
        const existingUser = await storage.getUserBySteamId(steamId64);
        
        if (existingUser && existingUser.id !== userId) {
          // Merge the existing steam user into current user
          const mergedUser = await storage.mergeUsers(existingUser.id, userId);
          if (mergedUser) {
            return res.json(mergedUser);
          }
        }
      }
      
      // Regular update
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

  return httpServer;
}
