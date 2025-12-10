import { MailerSend, EmailParams, Sender } from "mailersend";

export const sendEmail = async (to, subject, htmlMessage) => {
  try {
    const mailerSend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY,
    });

    const sentFrom = new Sender(
      process.env.MAIL_FROM,
      process.env.MAIL_FROM_NAME
    );

    const recipients = [{
      email: to,
    }];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(htmlMessage);

    await mailerSend.email.send(emailParams);

    console.log("📧 Email sent successfully");
    return true;
  } catch (error) {
    console.error("❌ MailerSend error:", error);
    return false;
  }
};
