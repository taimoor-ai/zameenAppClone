import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";

import { db, usersTable } from "@workspace/db";
import { requireAuth, signToken } from "../middlewares/auth";

const router = Router();

const ADMIN_EMAIL = "tehzeeb.x51214@gmail.com";
const ADMIN_PASSWORD = "141161";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(4),
  phone: z.string().optional().default(""),
  role: z.enum(["buyer", "seller", "renter"]).default("buyer"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  console.log("Register attempt:", parsed);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() });
    return;
  }
  const { name, email, password, phone, role } = parsed.data;
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail === ADMIN_EMAIL.toLowerCase()) {
    res.status(400).json({ error: "This email is reserved" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, trimmedEmail)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email: trimmedEmail, passwordHash, phone, role }).returning();

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.profilePicUrl ?? "" });
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.profilePicUrl ?? "" } });
});

router.post("/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  console.log("login attempt:", parsed);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { email, password } = parsed.data;
  const trimmedEmail = email.trim().toLowerCase();

  if (trimmedEmail === ADMIN_EMAIL.toLowerCase()) {
    if (password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const adminUser = { id: "admin", email: ADMIN_EMAIL, name: "Admin", role: "admin" };
    const token = signToken(adminUser);
    res.json({ token, user: { ...adminUser, phone: "" } });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, trimmedEmail)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.profilePicUrl ?? "" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.profilePicUrl ?? "" } });
});

router.get("/auth/me", requireAuth, async (req, res) => {
  if (req.user?.id === "admin") {
    res.json({ user: { id: "admin", name: "Admin", email: ADMIN_EMAIL, phone: "", role: "admin", avatar: "" } });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.profilePicUrl ?? "" } });
});

router.put("/auth/me", requireAuth, async (req, res) => {
  if (req.user?.id === "admin") {
    res.status(403).json({ error: "Admin profile cannot be edited" });
    return;
  }
  const { name, phone, role, avatar } = req.body;
  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (avatar !== undefined) updates.profilePicUrl = avatar;
  if (role && ["buyer", "seller", "renter"].includes(role)) updates.role = role;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id)).returning();
  res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, avatar: user.profilePicUrl ?? "" } });
});

export default router;
