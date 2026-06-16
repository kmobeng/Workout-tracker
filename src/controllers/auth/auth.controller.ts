import { Request, Response, NextFunction } from "express";
import {
  emailVerificationTokenSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  resetTokenSchema,
  signUpSchema,
} from "../validators/auth.validator";
import { createError } from "../utils/createError.util";
import { prisma } from "../config/prisma";
import bcrypt from "bcrypt";
import {
  loginService,
  logoutService,
  refreshTokenService,
  requestEmailVerificationService,
  signUpService,
} from "../services/auth.service";
import {
  generateRefreshToken,
  generateToken,
  sendToken,
} from "../utils/auth.util";
import crypto from "crypto";
import sendEmail, { maskEmail } from "../utils/email.util";
import logger from "../config/winston.config";
import { User } from "../generated/prisma/client";

const expiresAt = new Date(
  Date.now() +
    Number(process.env.REFRESH_TOKEN_EXPIRES_IN) * 24 * 60 * 60 * 1000,
);

export const signUp = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = signUpSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map((err: any) => err.message)
        .join(", ");
      throw createError(errorMessages, 400);
    }

    const { name, email, password } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError("User already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await signUpService(name, email, hashedPassword);

    generateToken(newUser.id, req, res);

    const { refreshToken, hashedRefreshToken } = generateRefreshToken();

    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: newUser.id,
        expiresAt,
      },
    });

    sendToken(req, res, refreshToken);

    const { password: _, ...user } = newUser;

    await requestEmailVerificationService(newUser.id, email);

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Email verification token has been sent to your email",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map((err: any) => err.message)
        .join(", ");
      throw createError(errorMessages, 400);
    }

    const { email, password } = parsed.data;

    const user = await loginService(email, password);

    generateToken(user.id, req, res);

    const { refreshToken, hashedRefreshToken } = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    sendToken(req, res, refreshToken);

    const { password: _, ...userData } = user;
    res.status(200).json({ success: true, data: userData });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw createError("No refresh token provided", 401);
    }
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await refreshTokenService(hashedRefreshToken, req, res, expiresAt);

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw createError("No refresh token provided", 401);
    }
    const hashedRefreshToken = crypto
      .createHash("sha256")
      .update(refreshToken)
      .digest("hex");

    await logoutService(hashedRefreshToken);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};



export const googleRedirect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = req.user as unknown as User;
    const authAction =
      (req.authInfo as { authAction?: "signup" | "login" } | undefined)
        ?.authAction ?? "login";

    generateToken(user.id, req, res);

    const { refreshToken, hashedRefreshToken } = generateRefreshToken();
    await prisma.refreshToken.create({
      data: {
        token: hashedRefreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    sendToken(req, res, refreshToken);

    const { password: _, ...userData } = user;

    res.status(200).json({
      success: true,
      message:
        authAction === "signup"
          ? "Account created with Google. Please set password to continue."
          : "Logged in with Google successfully.",
      data: { user: userData },
    });
  } catch (error) {
    next(error);
  }
};

