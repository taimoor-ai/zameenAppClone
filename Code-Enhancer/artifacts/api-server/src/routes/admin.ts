import { Router } from "express";

import { pool } from "@workspace/db";
import { requireAdmin } from "../middlewares/auth";

const router = Router();

router.get("/admin/dashboard", requireAdmin, async (req, res) => {
  const [usersResult, transactionsResult, statsResult] = await Promise.all([
    pool.query(`
      SELECT id, name, email, phone, role, created_at
      FROM users
      ORDER BY created_at DESC
    `),
    pool.query(`
      SELECT
        t.id, t.transaction_type, t.amount_transacted, t.transacted_at,
        t.property_title, t.property_city, t.property_type,
        t.party_first_name, t.party_first_email,
        t.party_second_name, t.party_second_email,
        t.contract_start_date, t.contract_end_date,
        p.title AS property_title_live,
        p.city AS property_city_live
      FROM transactions t
      LEFT JOIN properties p ON p.id = t.property_id
      ORDER BY t.transacted_at DESC
    `),
    pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM properties) AS total_properties,
        (SELECT COUNT(*) FROM transactions) AS total_transactions,
        (SELECT COUNT(DISTINCT city) FROM properties) AS total_cities
    `),
  ]);

  res.json({
    stats: {
      totalUsers: Number(statsResult.rows[0].total_users),
      totalProperties: Number(statsResult.rows[0].total_properties),
      totalTransactions: Number(statsResult.rows[0].total_transactions),
      totalCities: Number(statsResult.rows[0].total_cities),
    },
    users: usersResult.rows.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      createdAt: u.created_at,
    })),
    transactions: transactionsResult.rows.map((t) => ({
      id: t.id,
      transactionType: t.transaction_type,
      amount: Number(t.amount_transacted),
      transactedAt: t.transacted_at,
      propertyTitle: t.property_title_live ?? t.property_title,
      propertyCity: t.property_city_live ?? t.property_city,
      propertyType: t.property_type,
      sellerOrOwnerName: t.party_first_name,
      sellerOrOwnerEmail: t.party_first_email,
      buyerOrRenterName: t.party_second_name,
      buyerOrRenterEmail: t.party_second_email,
      contractStartDate: t.contract_start_date,
      contractEndDate: t.contract_end_date,
    })),
  });
});

router.post("/admin/transactions", requireAdmin, async (req, res) => {
  const {
    propertyId, propertyTitle, propertyCity, propertyType,
    transactionType, amountTransacted,
    partyFirstId, partyFirstName, partyFirstEmail,
    partySecondId, partySecondName, partySecondEmail,
  } = req.body;

  const result = await pool.query(
    `INSERT INTO transactions
      (property_id, property_title, property_city, property_type,
       transaction_type, amount_transacted,
       party_first_id, party_first_name, party_first_email,
       party_second_id, party_second_name, party_second_email)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING *`,
    [propertyId ?? null, propertyTitle, propertyCity, propertyType,
     transactionType, amountTransacted,
     partyFirstId ?? null, partyFirstName, partyFirstEmail,
     partySecondId ?? null, partySecondName, partySecondEmail]
  );
  res.status(201).json({ transaction: result.rows[0] });
});

export default router;
