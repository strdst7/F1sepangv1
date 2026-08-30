import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("crew"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  kind: text("kind").notNull().default("photo-shoot"),
  status: text("status").notNull().default("planned"),
  track: text("track").notNull().default("Sepang International Circuit"),
  capacity: integer("capacity").notNull().default(40),
  reserved: integer("reserved").notNull().default(0),
  notes: text("notes"),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const photos = pgTable("photos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  caption: text("caption"),
  category: text("category").notNull().default("trackside"),
  url: text("url").notNull(),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  likes: integer("likes").notNull().default(0),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const videos = pgTable("videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  kind: text("kind").notNull().default("highlight"),
  durationSec: integer("duration_sec").notNull().default(30),
  url: text("url").notNull(),
  thumb: text("thumb").notNull(),
  views: integer("views").notNull().default(0),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const mockups = pgTable("mockups", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  style: text("style").notNull().default("neon-night"),
  aspect: text("aspect").notNull().default("16:9"),
  status: text("status").notNull().default("rendering"),
  url: text("url"),
  eventId: uuid("event_id").references(() => events.id, {
    onDelete: "set null",
  }),
  createdBy: uuid("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
