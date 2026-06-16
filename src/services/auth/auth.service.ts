import pool from "../../database/index";

export type signupRow = {
  id: string;
  name: string;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
};

export const signUpService = async (
  name: string,
  email: string,
  username: string,
  password: string,
) => {
  try {
    const result = await pool.query<signupRow>(
      `
      INSERT INTO users(name,email,username,password)
      VALUES ($1,$2,$3,$4)
      RETURNING id,name,email,username,created_at,updated_at
      `,
      [name, email, username, password],
    );

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};

// export const loginService = async (email: string, password: string) => {
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });

//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       throw createError("Incorrect email or password", 404);
//     }

//     return user;
//   } catch (error) {
//     throw error;
//   }
// };

// export const refreshTokenService = async (
//   hashedRefreshToken: string,
//   req: Request,
//   res: Response,
//   expiresAt: Date,
// ) => {
//   try {
//     const storedToken = await prisma.refreshToken.findUnique({
//       where: { token: hashedRefreshToken },
//       include: { user: true },
//     });

//     if (!storedToken || storedToken.expiresAt < new Date()) {
//       throw createError("Invalid or expired refresh token", 401);
//     }

//     generateToken(storedToken.userId, req, res);

//     const {
//       refreshToken: newRefreshToken,
//       hashedRefreshToken: newHashedRefreshToken,
//     } = generateRefreshToken();

//     await prisma.refreshToken.update({
//       where: { token: hashedRefreshToken },
//       data: { token: newHashedRefreshToken, expiresAt },
//     });

//     sendToken(req, res, newRefreshToken);
//   } catch (error) {
//     throw error;
//   }
// };

// export const logoutService = async (hashedRefreshToken: string) => {
//   try {
//     await prisma.refreshToken.delete({
//       where: { token: hashedRefreshToken },
//     });
//   } catch (error) {
//     throw error;
//   }
// };
