var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express from "express";

// server/routes.ts
import { createServer } from "node:http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  insertLikeSchema: () => insertLikeSchema,
  insertMatchSchema: () => insertMatchSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertUserSchema: () => insertUserSchema,
  likes: () => likes,
  likesRelations: () => likesRelations,
  matches: () => matches,
  matchesRelations: () => matchesRelations,
  messages: () => messages,
  messagesRelations: () => messagesRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var users = pgTable("users", {
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
  superLikeBalance: integer("super_like_balance").default(0)
});
var usersRelations = relations(users, ({ many }) => ({
  sentLikes: many(likes, { relationName: "sentLikes" }),
  receivedLikes: many(likes, { relationName: "receivedLikes" }),
  sentMessages: many(messages, { relationName: "sentMessages" }),
  receivedMessages: many(messages, { relationName: "receivedMessages" })
}));
var likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  isSuperLike: boolean("is_super_like").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var likesRelations = relations(likes, ({ one }) => ({
  fromUser: one(users, {
    fields: [likes.fromUserId],
    references: [users.id],
    relationName: "sentLikes"
  }),
  toUser: one(users, {
    fields: [likes.toUserId],
    references: [users.id],
    relationName: "receivedLikes"
  })
}));
var matches = pgTable("matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow()
});
var matchesRelations = relations(matches, ({ one }) => ({
  user1: one(users, {
    fields: [matches.user1Id],
    references: [users.id]
  }),
  user2: one(users, {
    fields: [matches.user2Id],
    references: [users.id]
  })
}));
var messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  matchId: varchar("match_id").notNull().references(() => matches.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow()
});
var messagesRelations = relations(messages, ({ one }) => ({
  match: one(matches, {
    fields: [messages.matchId],
    references: [matches.id]
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sentMessages"
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receivedMessages"
  })
}));
var insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  bio: true,
  age: true,
  gender: true,
  photos: true,
  latitude: true,
  longitude: true
});
var insertLikeSchema = createInsertSchema(likes).pick({
  fromUserId: true,
  toUserId: true,
  isSuperLike: true
});
var insertMatchSchema = createInsertSchema(matches).pick({
  user1Id: true,
  user2Id: true
});
var insertMessageSchema = createInsertSchema(messages).pick({
  matchId: true,
  senderId: true,
  receiverId: true,
  content: true
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, and, or, sql as sql2, desc, notInArray } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUser(id, data) {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async updateUserLocation(id, latitude, longitude) {
    const [user] = await db.update(users).set({ latitude, longitude, lastActive: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async updateUserPremium(id, isPremium, expiresAt) {
    const [user] = await db.update(users).set({ isPremium, premiumExpiresAt: expiresAt }).where(eq(users.id, id)).returning();
    return user || void 0;
  }
  async getNearbyUsers(userId, latitude, longitude, maxDistanceKm) {
    const likedUserIds = await db.select({ toUserId: likes.toUserId }).from(likes).where(eq(likes.fromUserId, userId));
    const likedIds = likedUserIds.map((l) => l.toUserId);
    const excludeIds = [userId, ...likedIds];
    const nearbyUsers = await db.select().from(users).where(
      and(
        notInArray(users.id, excludeIds),
        sql2`${users.latitude} IS NOT NULL`,
        sql2`${users.longitude} IS NOT NULL`,
        sql2`(
          6371 * acos(
            cos(radians(${latitude})) * cos(radians(${users.latitude})) *
            cos(radians(${users.longitude}) - radians(${longitude})) +
            sin(radians(${latitude})) * sin(radians(${users.latitude}))
          )
        ) <= ${maxDistanceKm}`
      )
    );
    return nearbyUsers;
  }
  async createLike(insertLike) {
    const [like] = await db.insert(likes).values(insertLike).returning();
    return like;
  }
  async getLike(fromUserId, toUserId) {
    const [like] = await db.select().from(likes).where(
      and(eq(likes.fromUserId, fromUserId), eq(likes.toUserId, toUserId))
    );
    return like || void 0;
  }
  async getLikesReceived(userId) {
    return await db.select().from(likes).where(eq(likes.toUserId, userId));
  }
  async createMatch(insertMatch) {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }
  async getMatchesByUser(userId) {
    return await db.select().from(matches).where(
      or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
    ).orderBy(desc(matches.createdAt));
  }
  async getMatch(user1Id, user2Id) {
    const [match] = await db.select().from(matches).where(
      or(
        and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
        and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
      )
    );
    return match || void 0;
  }
  async createMessage(insertMessage) {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }
  async getMessagesByMatch(matchId) {
    return await db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(messages.createdAt);
  }
  async markMessagesAsRead(matchId, receiverId) {
    await db.update(messages).set({ isRead: true }).where(
      and(eq(messages.matchId, matchId), eq(messages.receiverId, receiverId))
    );
  }
  async getUnreadCount(userId) {
    const result = await db.select({ count: sql2`count(*)` }).from(messages).where(
      and(eq(messages.receiverId, userId), eq(messages.isRead, false))
    );
    return result[0]?.count || 0;
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/users", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const existingUser = await storage.getUserByEmail(parsed.data.email);
      if (existingUser) {
        return res.json(existingUser);
      }
      const user = await storage.createUser(parsed.data);
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
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
  app2.patch("/api/users/:id", async (req, res) => {
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
  app2.post("/api/users/:id/location", async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const user = await storage.updateUserLocation(
        req.params.id,
        latitude,
        longitude
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });
  app2.get("/api/users/:id/nearby", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user || !user.latitude || !user.longitude) {
        return res.status(400).json({ error: "User location not available" });
      }
      if (!user.isPremium) {
        const now = /* @__PURE__ */ new Date();
        const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : /* @__PURE__ */ new Date(0);
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
            message: "G\xFCnl\xFCk 2 saatlik \xFCcretsiz kullan\u0131m s\u0131n\u0131r\u0131na ula\u015Ft\u0131n\u0131z. S\u0131n\u0131rs\u0131z eri\u015Fim i\xE7in Gold'a y\xFCkseltin!"
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
  app2.post("/api/users/:id/premium", async (req, res) => {
    try {
      const { isPremium, expiresAt } = req.body;
      const user = await storage.updateUserPremium(
        req.params.id,
        isPremium,
        expiresAt ? new Date(expiresAt) : void 0
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to update premium status" });
    }
  });
  app2.post("/api/likes", async (req, res) => {
    try {
      const parsed = insertLikeSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      if (parsed.data.isSuperLike) {
        const user = await storage.getUser(parsed.data.fromUserId);
        if (!user || (user.superLikeBalance || 0) <= 0) {
          return res.status(403).json({
            error: "Insufficient super likes",
            message: "S\xFCper be\u011Feni bakiyeniz yetersiz. Paket sat\u0131n alarak devam edebilirsiniz!"
          });
        }
        await storage.updateUser(parsed.data.fromUserId, {
          superLikeBalance: (user.superLikeBalance || 0) - 1
        });
      }
      const like = await storage.createLike(parsed.data);
      const mutualLike = await storage.getLike(
        parsed.data.toUserId,
        parsed.data.fromUserId
      );
      let match = null;
      if (mutualLike) {
        const existingMatch = await storage.getMatch(
          parsed.data.fromUserId,
          parsed.data.toUserId
        );
        if (!existingMatch) {
          match = await storage.createMatch({
            user1Id: parsed.data.fromUserId,
            user2Id: parsed.data.toUserId
          });
        }
      }
      res.json({ like, match, isMatch: !!match });
    } catch (error) {
      res.status(500).json({ error: "Failed to create like" });
    }
  });
  app2.post("/api/users/:id/super-likes", async (req, res) => {
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
  app2.get("/api/users/:id/likes-received", async (req, res) => {
    try {
      const likes2 = await storage.getLikesReceived(req.params.id);
      res.json(likes2);
    } catch (error) {
      res.status(500).json({ error: "Failed to get likes" });
    }
  });
  app2.get("/api/users/:id/matches", async (req, res) => {
    try {
      const matches2 = await storage.getMatchesByUser(req.params.id);
      const matchesWithUsers = await Promise.all(
        matches2.map(async (match) => {
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
  app2.post("/api/messages", async (req, res) => {
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
  app2.get("/api/matches/:matchId/messages", async (req, res) => {
    try {
      const messages2 = await storage.getMessagesByMatch(req.params.matchId);
      res.json(messages2);
    } catch (error) {
      res.status(500).json({ error: "Failed to get messages" });
    }
  });
  app2.post("/api/matches/:matchId/read", async (req, res) => {
    try {
      const { receiverId } = req.body;
      await storage.markMessagesAsRead(req.params.matchId, receiverId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark messages as read" });
    }
  });
  app2.get("/api/users/:id/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadCount(req.params.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/index.ts
import * as fs from "fs";
import * as path from "path";
var app = express();
var log = console.log;
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
configureExpoAndLanding(app);
app.get("/manifest.json", (req, res) => {
  const manifestPath = path.resolve(process.cwd(), "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: "manifest.json not found" });
  }
  res.setHeader("Content-Type", "application/json");
  res.sendFile(manifestPath);
});
function setupCors(app2) {
  app2.use((req, res, next) => {
    const origins = /* @__PURE__ */ new Set();
    if (process.env.REPLIT_DEV_DOMAIN) {
      origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
    }
    if (process.env.REPLIT_DOMAINS) {
      process.env.REPLIT_DOMAINS.split(",").forEach((d) => {
        origins.add(`https://${d.trim()}`);
      });
    }
    const origin = req.header("origin");
    if (origin && origins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
      );
      res.header("Access-Control-Allow-Headers", "Content-Type");
      res.header("Access-Control-Allow-Credentials", "true");
    }
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}
function setupBodyParsing(app2) {
  app2.use(
    express.json({
      verify: (req, _res, buf) => {
        req.rawBody = buf;
      }
    })
  );
  app2.use(express.urlencoded({ extended: false }));
}
function setupRequestLogging(app2) {
  app2.use((req, res, next) => {
    const start = Date.now();
    const path2 = req.path;
    let capturedJsonResponse = void 0;
    const originalResJson = res.json;
    res.json = function(bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };
    res.on("finish", () => {
      if (!path2.startsWith("/api")) return;
      const duration = Date.now() - start;
      let logLine = `${req.method} ${path2} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    });
    next();
  });
}
function getAppName() {
  try {
    const appJsonPath = path.resolve(process.cwd(), "app.json");
    const appJsonContent = fs.readFileSync(appJsonPath, "utf-8");
    const appJson = JSON.parse(appJsonContent);
    return appJson.expo?.name || "App Landing Page";
  } catch {
    return "App Landing Page";
  }
}
function serveExpoManifest(platform, res) {
  const manifestPath = path.resolve(
    process.cwd(),
    "static-build",
    platform,
    "manifest.json"
  );
  if (!fs.existsSync(manifestPath)) {
    return res.status(404).json({ error: `Manifest not found for platform: ${platform}` });
  }
  res.setHeader("expo-protocol-version", "1");
  res.setHeader("expo-sfv-version", "0");
  res.setHeader("content-type", "application/json");
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.send(manifest);
}
function serveLandingPage({
  req,
  res,
  landingPageTemplate,
  appName
}) {
  const forwardedProto = req.header("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol || "https";
  const forwardedHost = req.header("x-forwarded-host");
  const host = forwardedHost || req.get("host");
  const baseUrl = `${protocol}://${host}`;
  const expsUrl = `${host}`;
  log(`baseUrl`, baseUrl);
  log(`expsUrl`, expsUrl);
  const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, appName);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(html);
}
function configureExpoAndLanding(app2) {
  const templatePath = path.resolve(
    process.cwd(),
    "server",
    "templates",
    "landing-page.html"
  );
  const landingPageTemplate = fs.readFileSync(templatePath, "utf-8");
  const appName = getAppName();
  log("Serving static Expo files with dynamic manifest routing");
  app2.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    if (req.path !== "/" && req.path !== "/manifest") {
      return next();
    }
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      return serveExpoManifest(platform, res);
    }
    if (req.path === "/") {
      return serveLandingPage({
        req,
        res,
        landingPageTemplate,
        appName
      });
    }
    next();
  });
  app2.use("/assets", express.static(path.resolve(process.cwd(), "assets")));
  app2.use(express.static(path.resolve(process.cwd(), "static-build")));
  log("Expo routing: Checking expo-platform header on / and /manifest");
}
function setupErrorHandler(app2) {
  app2.use((err, _req, res, _next) => {
    const error = err;
    const status = error.status || error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
}
(async () => {
  setupCors(app);
  setupBodyParsing(app);
  setupRequestLogging(app);
  configureExpoAndLanding(app);
  const server = await registerRoutes(app);
  setupErrorHandler(app);
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true
    },
    () => {
      log(`express server serving on port ${port}`);
    }
  );
})();
