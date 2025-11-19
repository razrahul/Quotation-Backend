// src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models";
import { success, error } from "../utils/response";

const COOKIE_NAME = "tt_auth";
const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";
const TOKEN_EXPIRES = "7d";

function createToken(userId: number) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES });
}

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) return error(res, "Email and password required", 400);

    const existing = await User.findOne({ where: { email } });
    if (existing) return error(res, "Email already registered", 400);

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    const token = createToken(user.id);

    // set httpOnly cookie (for browser requests)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    return success(res, "User registered successfully", {
      user: { id: user.id, name: user.name, email: user.email },
      token
    }, 201);
  } catch (err: any) {
    return error(res, err.message || "Registration failed", 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, "Email and password required", 400);

    const user: any = await User.findOne({ where: { email } });
    if (!user) return error(res, "Invalid credentials", 401);

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return error(res, "Invalid credentials", 401);

    const token = createToken(user.id);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return success(res, "Logged in successfully", {
      user: { id: user.id, name: user.name, email: user.email },
      token
    },
    201);
  } catch (err: any) {
    return error(res, err.message || "Login failed", 500);
  }
}

export async function logout(req: Request, res: Response) {
  res.clearCookie(COOKIE_NAME);
  return success(res, "Logged out successfully");
}

export async function profile(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    if (!userId) return error(res, "Unauthorized", 401);

    const user = await User.findByPk(userId, { attributes: ["id", "name", "email", "createdAt"] });
    return success(res, "Profile fetched", user, 200);
  } catch (err: any) {
    return error(res, err.message || "Failed to fetch profile", 500);
  }
}
