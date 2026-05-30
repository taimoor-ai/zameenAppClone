import { sql } from "drizzle-orm";
import { boolean, decimal, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { usersTable } from "./users";

export const listingTypeEnum = pgEnum("listing_type", ["sale", "rent"]);
export const propertyTypeEnum = pgEnum("property_type", ["house", "apartment", "plot", "commercial", "farmhouse"]);
export const propertyStatusEnum = pgEnum("property_status", ["available", "sold", "rented"]);

export const propertiesTable = pgTable("properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sellerId: uuid("seller_id").references(() => usersTable.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  listingType: listingTypeEnum("listing_type").notNull().default("sale"),
  propertyType: propertyTypeEnum("property_type").notNull().default("house"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  areaSize: text("area_size").notNull().default(""),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  city: text("city").notNull(),
  area: text("area").notNull().default(""),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  status: propertyStatusEnum("status").notNull().default("available"),
  featured: boolean("featured").notNull().default(false),
  ownerName: text("owner_name").notNull().default(""),
  ownerPhone: text("owner_phone").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type DbProperty = typeof propertiesTable.$inferSelect;
