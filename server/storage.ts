import { users, likes, matches, messages, type User, type InsertUser, type Like, type InsertLike, type Match, type InsertMatch, type Message, type InsertMessage } from "../schema";
import { db } from "./db";
import { eq, and, or, sql, desc, ne, notInArray } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  updateUserLocation(id: string, latitude: number, longitude: number): Promise<User | undefined>;
  updateUserPremium(id: string, isPremium: boolean, expiresAt?: Date): Promise<User | undefined>;
  getNearbyUsers(userId: string, latitude: number, longitude: number, maxDistanceKm: number): Promise<User[]>;
  
  createLike(like: InsertLike): Promise<Like>;
  getLike(fromUserId: string, toUserId: string): Promise<Like | undefined>;
  getLikesReceived(userId: string): Promise<Like[]>;
  
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesByUser(userId: string): Promise<Match[]>;
  getMatch(user1Id: string, user2Id: string): Promise<Match | undefined>;
  
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByMatch(matchId: string): Promise<Message[]>;
  markMessagesAsRead(matchId: string, receiverId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserLocation(id: string, latitude: number, longitude: number): Promise<User | undefined> {
    const [user] = await db.update(users).set({ latitude, longitude, lastActive: new Date() }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async updateUserPremium(id: string, isPremium: boolean, expiresAt?: Date): Promise<User | undefined> {
    const [user] = await db.update(users).set({ isPremium, premiumExpiresAt: expiresAt }).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async getNearbyUsers(userId: string, latitude: number, longitude: number, maxDistanceKm: number): Promise<User[]> {
    const likedUserIds = await db.select({ toUserId: likes.toUserId }).from(likes).where(eq(likes.fromUserId, userId));
    const likedIds = likedUserIds.map(l => l.toUserId);
    
    const excludeIds = [userId, ...likedIds];
    
    const nearbyUsers = await db.select().from(users).where(
      and(
        notInArray(users.id, excludeIds),
        sql`${users.latitude} IS NOT NULL`,
        sql`${users.longitude} IS NOT NULL`,
        sql`(
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

  async createLike(insertLike: InsertLike): Promise<Like> {
    const [like] = await db.insert(likes).values(insertLike).returning();
    return like;
  }

  async getLike(fromUserId: string, toUserId: string): Promise<Like | undefined> {
    const [like] = await db.select().from(likes).where(
      and(eq(likes.fromUserId, fromUserId), eq(likes.toUserId, toUserId))
    );
    return like || undefined;
  }

  async getLikesReceived(userId: string): Promise<Like[]> {
    return await db.select().from(likes).where(eq(likes.toUserId, userId));
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db.insert(matches).values(insertMatch).returning();
    return match;
  }

  async getMatchesByUser(userId: string): Promise<Match[]> {
    return await db.select().from(matches).where(
      or(eq(matches.user1Id, userId), eq(matches.user2Id, userId))
    ).orderBy(desc(matches.createdAt));
  }

  async getMatch(user1Id: string, user2Id: string): Promise<Match | undefined> {
    const [match] = await db.select().from(matches).where(
      or(
        and(eq(matches.user1Id, user1Id), eq(matches.user2Id, user2Id)),
        and(eq(matches.user1Id, user2Id), eq(matches.user2Id, user1Id))
      )
    );
    return match || undefined;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async getMessagesByMatch(matchId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.matchId, matchId)).orderBy(messages.createdAt);
  }

  async markMessagesAsRead(matchId: string, receiverId: string): Promise<void> {
    await db.update(messages).set({ isRead: true }).where(
      and(eq(messages.matchId, matchId), eq(messages.receiverId, receiverId))
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` }).from(messages).where(
      and(eq(messages.receiverId, userId), eq(messages.isRead, false))
    );
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();
