import { createError } from "../../utils/error.util";

export const verifyEmailUpdateService = async (
  userId: string,
  token: string,
) => {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw createError("Invalid or expired token", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { pendingEmail: true },
    });
    if (!user?.pendingEmail) throw createError("No pending email update", 400);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { email: user.pendingEmail, pendingEmail: null },
      }),
      prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      }),
    ]);

    return;
  } catch (error) {
    throw error;
  }
};
