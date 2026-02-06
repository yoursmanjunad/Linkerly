const hasEmailWebhook = () => Boolean(process.env.EMAIL_WEBHOOK_URL);

export const sendPasswordResetEmail = async ({ to, userName, resetUrl }) => {
  if (hasEmailWebhook()) {
    try {
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          userName,
          resetUrl,
          template: "password-reset",
        }),
      });
      return;
    } catch (error) {
      console.warn("Failed to send reset email via webhook:", error);
    }
  }

  console.warn("Email delivery not configured. Set EMAIL_WEBHOOK_URL to enable emails.");
  console.info(`Password reset link for ${to}: ${resetUrl}`);
};
