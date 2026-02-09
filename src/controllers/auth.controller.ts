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
    const { name, country, email, password } = req.body;

    if (!email || !password)
      return error(res, "Email and password required", 400);

    const existing = await User.findOne({ where: { email } });
    if (existing) return error(res, "Email already registered", 400);

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      ...(typeof country === "string" &&
        country.trim() && { country: country.trim() }),
    });

    const token = createToken(user.id);

    // set httpOnly cookie (for browser requests)
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return success(
      res,
      "User registered successfully",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          country: user.country,
        },
        token,
      },
      201
    );
  } catch (err: any) {
    return error(res, err.message || "Registration failed", 500);
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return error(res, "Email and password required", 400);

    const user: any = await User.findOne({ where: { email } });
    if (!user) return error(res, "Invalid credentials", 401);

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return error(res, "Invalid credentials", 401);

    const token = createToken(user.id);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(
      res,
      "Logged in successfully",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          country: user.country,
        },
        token,
      },
      201
    );
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

    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "country", "createdAt"],
    });
    return success(res, "Profile fetched", user, 200);
  } catch (err: any) {
    return error(res, err.message || "Failed to fetch profile", 500);
  }
}

export async function UpdateProfile(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    if (!userId) return error(res, "Unauthorized", 401);

    const { name, country } = req.body;

    if (!name && !country) {
      return error(res, "Nothing to update", 400);
    }

    const user = await User.findByPk(userId);
    if (!user) return error(res, "User not found", 404);

    if (name) user.name = name.trim();
    if (country) user.country = country;

    await user.save();

    return success(
      res,
      "Profile updated successfully",
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          country: user.country,
          createdAt: user.createdAt,
        },
      },
      200
    );
  } catch (err: any) {
    return error(res, err.message || "Failed to update profile", 500);
  }
}

export async function deleteAccount(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    if (!userId) return error(res, "Unauthorized", 401);

    const user = await User.findByPk(userId);
    if (!user) return error(res, "User not found", 404);

    await user.destroy(); // soft delete

    // clear cookie
    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return success(res, "Account deleted successfully");
  } catch (err: any) {
    return error(res, err.message || "Failed to delete account", 500);
  }
}

export async function updatePassword(req: Request, res: Response) {
  try {
    const authReq = req as any;
    const userId = authReq.userId;
    if (!userId) return error(res, "Unauthorized", 401);

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return error(res, "Old and new passwords required", 400);
    }

    if (oldPassword === newPassword) {
      return error(res, "New password must be different", 400);
    }

    // basic password strength check
    if (newPassword.length < 6) {
      return error(res, "Password must be at least 6 characters", 400);
    }

    const user = await User.findByPk(userId);
    if (!user) return error(res, "User not found", 404);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return error(res, "Incorrect old password", 400);

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    await user.save();

    // optional: force logout after password change
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return success(res, "Password updated successfully");
  } catch (err: any) {
    return error(res, err.message || "Failed to update password", 500);
  }
}
