export const requestEmailVerification = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (req.user?.isEmailVerified) {
      throw createError("Email already verified", 400);
    }

    await requestEmailVerificationService(req.user!.id, req.user!.email);

    res.status(200).json({
      success: true,
      message: `Verification code sent to ${maskEmail(req.user!.email)}`,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = emailVerificationTokenSchema.safeParse({
      token: req.body.token,
    });

    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map((err: any) => err.message)
        .join(", ");
      throw createError(errorMessages, 400);
    }

    const { token } = parsed.data;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const emailVerificationToken =
      await prisma.emailVerificationToken.findUnique({
        where: { token: hashedToken },
      });

    if (
      !emailVerificationToken ||
      emailVerificationToken.expiresAt < new Date()
    ) {
      throw createError("Invalid or expired verification token", 400);
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: emailVerificationToken.userId },
        data: { isEmailVerified: true },
      }),
      prisma.emailVerificationToken.delete({
        where: { id: emailVerificationToken.id },
      }),
    ]);

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};