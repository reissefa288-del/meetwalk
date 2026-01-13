import type { Express } from "express";
import { createServer } from "node:http";
import { storage } from "./storage";
import { insertUserSchema, insertLikeSchema, insertMessageSchema } from "./schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const existingUser = await storage.getUserByEmail(parsed.data.email!);
      if (existingUser) {
        return res.json(existingUser);
      }
      const user = await storage.createUser(parsed.data);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.post("/api/users/:id/location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const user = await storage.updateUserLocation(req.params.id, latitude, longitude);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/users/:id/nearby", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || !user.latitude || !user.longitude) {
        return res.status(400).json({ error: "User location not available" });
      }

      // Günlük kullanım sınırı kontrolü (Ücretsiz kullanıcılar için 2 saat = 120 dakika)
      if (!user.isPremium) {
        const now = new Date();
        const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date(0);
        
        // Günü kontrol et ve gerekirse sıfırla
        if (now.toDateString() !== lastReset.toDateString()) {
          await storage.updateUser(user.id, {
            dailyUsageMinutes: 0,
            lastUsageReset: now
          });
          user.dailyUsageMinutes = 0;
        }

        if ((user.dailyUsageMinutes || 0) >= 120) {
          return res.status(403).json({ 
            error: "Daily limit reached", 
            message: "Günlük 2 saatlik ücretsiz kullanım sınırına ulaştınız. Sınırsız erişim için Gold'a yükseltin!" 
          });
        }
      }

      const maxDistance = 3; 
      const nearbyUsers = await storage.getNearbyUsers(
        req.params.id,
        user.latitude,
        user.longitude,
        maxDistance
      );
      res.json(nearbyUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get nearby users" });
    }
  });

  app.post("/api/users/:id/premium", async (req, res) => {
    try {
      const { isPremium, expiresAt } = req.body;
      const user = await storage.updateUserPremium(
        req.params.id,
        isPremium,
        expiresAt ? new Date(expiresAt) : undefined
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update premium status" });
    }
  });

  app.post("/api/likes", async (req, res) => {
    try {
      const parsed = insertLikeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      if (parsed.data.isSuperLike) {
        const user = await storage.getUser(parsed.data.fromUserId!);
        if (!user || (user.superLikeBalance || 0) <= 0) {
          return res.status(403).json({ 
            error: "Insufficient super likes",
            message: "Süper beğeni bakiyeniz yetersiz. Paket satın alarak devam edebilirsiniz!" 
          });
        }
        await storage.updateUser(parsed.data.fromUserId!, { 
          superLikeBalance: (user.superLikeBalance || 0) - 1 
        });
      }

      const like = await storage.createLike(parsed.data);
      
      const mutualLike = await storage.getLike(parsed.data.toUserId!, parsed.data.fromUserId!);
      let match = null;
      
      if (mutualLike) {
        const existingMatch = await storage.getMatch(parsed.data.fromUserId!, parsed.data.toUserId!);
        if (!existingMatch) {
          match = await storage.createMatch({
            user1Id: parsed.data.fromUserId,
            user2Id: parsed.data.toUserId,
          });
        }
      }
      
      res.json({ like, match, isMatch: !!match });
    } catch (error) {
      res.status(500).json({ error: "Failed to create like" });
    }
  });

  app.post("/api/users/:id/super-likes", async (req, res) => {
    try {
      const { amount } = req.body;
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const updatedUser = await storage.updateUser(req.params.id, {
        superLikeBalance: (user.superLikeBalance || 0) + amount
      });
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to add super likes" });
    }
  });

  app.get("/api/users/:id/likes-received", async (req, res) => {
    try {
      const likes = await storage.getLikesReceived(req.params.id);
      res.json(likes);
    } catch (error) {
      res.status(500).json({ error: "Failed to get likes" });
    }
  });

  app.get("/api/users/:id/matches", async (req, res) => {
    try {
      const matches = await storage.getMatchesByUser(req.params.id);
      const matchesWithUsers = await Promise.all(
        matches.map(async (match) => {
          const otherUserId = match.user1Id === req.params.id ? match.user2Id : match.user1Id;
          const otherUser = await storage.getUser(otherUserId);
          return { ...match, otherUser };
        })
      );
      res.json(matchesWithUsers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get matches" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const parsed = insertMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const message = await storage.createMessage(parsed.data);
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.get("/api/matches/:matchId/messages", async (req, res) => {
    try {
      const messages = await storage.getMessagesByMatch(req.params.matchId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  app.post("/api/matches/:matchId/read", async (req, res) => {
    try {
      const { receiverId } = req.body;
      await storage.markMessagesAsRead(req.params.matchId, receiverId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });

  app.get("/api/users/:id/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadCount(req.params.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
