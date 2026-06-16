export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map((err: any) => err.message)
        .join(", ");
      throw createError(errorMessages, 400);
    }

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw createError("User with this email does not exist", 404);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.passwordResetToken.upsert({
      where: { userId: user.id },
      update: { token: hashedResetToken, expiresAt: resetTokenExpires },
      create: {
        token: hashedResetToken,
        userId: user.id,
        expiresAt: resetTokenExpires,
      },
    });

    try {
      const resetURL = `${process.env.BASE_URL}/api/v1/auth/reset-password/${resetToken}`;

      const message = `You requested a password reset. Please click on the following link to reset your password: ${resetURL}
       This link is valid for 10 minutes. If you did not request this, please ignore this email.`;
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message,
      });
    } catch (error) {
      logger.error("Error sending email:", error);
      await prisma.passwordResetToken.delete({ where: { userId: user.id } });
      throw createError(
        "There was an error sending the email. Please try again later.",
        500,
      );
    }

    res.status(200).json({
      success: true,
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const parsedToken = resetTokenSchema.safeParse({ token: req.params.token });
    if (!parsedToken.success) {
      const errorMessages = parsedToken.error.issues
        .map((err: any) => err.message)
        .join(", ");
      throw createError(errorMessages, 400);
    }

    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMessages = parsed.error.issues
        .map((err: any) => err.message)
        .join(", ");
      throw createError(errorMessages, 400);
    }

    const { token } = parsedToken.data;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!passwordResetToken || passwordResetToken.expiresAt < new Date()) {
      throw createError("Invalid or expired reset token", 400);
    }

    const { password } = parsed.data;
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: passwordResetToken.userId },
        data: { password: hashedPassword, passwordChangedAt: new Date() },
      }),
      prisma.passwordResetToken.delete({
        where: { id: passwordResetToken.id },
      }),
    ]);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error) {
    next(error);
  }
};