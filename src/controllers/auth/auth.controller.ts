import { Request, Response, NextFunction } from "express";
import { loginSchema, signUpSchema } from "./validators/auth.validator";
import { createError } from "../../utils/error.util";
import bcrypt from "bcrypt";
import { signupRow, signUpService } from "../../services/auth/auth.service";
import {
  generateRefreshToken,
  generateToken,
  sendToken,
} from "../../utils/auth.util";
import pool from "../../database/index";

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

    const { name, email, password, username } = parsed.data;

    const existingUser = await pool.query<{ email: string; username: string }>(
      `SELECT username, email
      FROM users 
      WHERE username = $1 OR email=$2`,
      [username, email],
    );

    if (existingUser.rows[0]?.email) {
      throw createError("Email is already taken", 400);
    }

    if (existingUser.rows[0]?.username) {
      throw createError("Username is already taken", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = (await signUpService(
      name,
      email,
      username,
      hashedPassword,
    )) as signupRow;

    generateToken(newUser.id, req, res);

    const { refreshToken, hashedRefreshToken } = generateRefreshToken();

    // await prisma.refreshToken.create({
    //   data: {
    //     token: hashedRefreshToken,
    //     userId: newUser.id,
    //     expiresAt,
    //   },
    // });

    await pool.query(`
      `);

    sendToken(req, res, refreshToken);

    // await requestEmailVerificationService(newUser.id, email);

    res.status(201).json({
      success: true,
      message:
        "Account created successfully. Email verification token has been sent to your email",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// export const login = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ): Promise<void> => {
//   try {
//     const parsed = loginSchema.safeParse(req.body);
//     if (!parsed.success) {
//       const errorMessages = parsed.error.issues
//         .map((err: any) => err.message)
//         .join(", ");
//       throw createError(errorMessages, 400);
//     }

//     const { email, password } = parsed.data;

//     const user = await loginService(email, password);

//     generateToken(user.id, req, res);

//     const { refreshToken, hashedRefreshToken } = generateRefreshToken();
//     await prisma.refreshToken.create({
//       data: {
//         token: hashedRefreshToken,
//         userId: user.id,
//         expiresAt,
//       },
//     });

//     sendToken(req, res, refreshToken);

//     const { password: _, ...userData } = user;
//     res.status(200).json({ success: true, data: userData });
//   } catch (error) {
//     next(error);
//   }
// };

// export const refreshToken = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) {
//       throw createError("No refresh token provided", 401);
//     }
//     const hashedRefreshToken = crypto
//       .createHash("sha256")
//       .update(refreshToken)
//       .digest("hex");

//     await refreshTokenService(hashedRefreshToken, req, res, expiresAt);

//     res.status(200).json({ success: true });
//   } catch (error) {
//     next(error);
//   }
// };

// export const logout = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const refreshToken = req.cookies.refreshToken;
//     if (!refreshToken) {
//       throw createError("No refresh token provided", 401);
//     }
//     const hashedRefreshToken = crypto
//       .createHash("sha256")
//       .update(refreshToken)
//       .digest("hex");

//     await logoutService(hashedRefreshToken);

//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     res.clearCookie("accessToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     res.status(200).json({ success: true, message: "Logged out successfully" });
//   } catch (error) {
//     next(error);
//   }
// };

// export const googleRedirect = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {
//     const user = req.user as unknown as User;
//     const authAction =
//       (req.authInfo as { authAction?: "signup" | "login" } | undefined)
//         ?.authAction ?? "login";

//     generateToken(user.id, req, res);

//     const { refreshToken, hashedRefreshToken } = generateRefreshToken();
//     await prisma.refreshToken.create({
//       data: {
//         token: hashedRefreshToken,
//         userId: user.id,
//         expiresAt,
//       },
//     });

//     sendToken(req, res, refreshToken);

//     const { password: _, ...userData } = user;

//     res.status(200).json({
//       success: true,
//       message:
//         authAction === "signup"
//           ? "Account created with Google. Please set password to continue."
//           : "Logged in with Google successfully.",
//       data: { user: userData },
//     });
//   } catch (error) {
//     next(error);
//   }
// };
