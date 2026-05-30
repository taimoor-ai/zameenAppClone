import { sql } from "drizzle-orm";
import { decimal, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { propertiesTable } from "./properties";
import { usersTable } from "./users";

export const transactionTypeEnum = pgEnum("transaction_type", ["sale", "rent_lease"]);

export const transactionsTable = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => propertiesTable.id, { onDelete: "set null" }),
  partyFirstId: uuid("party_first_id").references(() => usersTable.id, { onDelete: "set null" }),
  partySecondId: uuid("party_second_id").references(() => usersTable.id, { onDelete: "set null" }),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  amountTransacted: decimal("amount_transacted", { precision: 15, scale: 2 }).notNull(),
  propertyTitle: text("property_title").notNull().default(""),
  propertyCity: text("property_city").notNull().default(""),
  propertyType: text("property_type").notNull().default(""),
  partyFirstName: text("party_first_name").notNull().default(""),
  partyFirstEmail: text("party_first_email").notNull().default(""),
  partySecondName: text("party_second_name").notNull().default(""),
  partySecondEmail: text("party_second_email").notNull().default(""),
  contractStartDate: timestamp("contract_start_date", { withTimezone: true }),
  contractEndDate: timestamp("contract_end_date", { withTimezone: true }),
  transactedAt: timestamp("transacted_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, transactedAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type DbTransaction = typeof transactionsTable.$inferSelect;
