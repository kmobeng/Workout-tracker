import {sendEmail } from "../../utils/email.util"

export const requestEmailVerificationService = async (
  userId: string,
  email: string,
) => {
  try {
    const token = crypto.randomInt(100000, 999999).toString();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await prisma.emailVerificationToken.upsert({
      where: { userId },
      update: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      create: {
        token: hashedToken,
        userId,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    try {
      const message = `Your email verification code is: ${token}. This code is valid for 10 minutes. If you did not request this, please ignore this email.`;
      await sendEmail({
        email,
        subject: "Email Verification Code",
        message, 
      });
    } catch (error) {
      await prisma.emailVerificationToken.delete({
        where: { userId },
      });
      throw createError(
        "There was an error sending the email. Please try again later.",
        500,
      );
    }
  } catch (error) {
    throw error;
  }
};