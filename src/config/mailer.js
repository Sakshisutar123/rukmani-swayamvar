import brevo from "@getbrevo/brevo";

export const sendEmail = async (to, subject, htmlMessage) => {
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );

    const sendSmtpEmail = new brevo.SendSmtpEmail({
      sender: {
        name: process.env.MAIL_FROM_NAME,
        email: process.env.MAIL_FROM, // MUST BE VERIFIED
      },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlMessage,
    });

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    console.log("📧 Brevo: Email sent successfully");
    return true;
  } catch (error) {
    console.log("❌ Brevo Email Error:", error.response?.body || error);
    return false;
  }
};
