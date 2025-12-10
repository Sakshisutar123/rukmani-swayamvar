// src/utils/mailer.js
import MailerSend from "mailersend";
import dotenv from "dotenv";
dotenv.config();

const mailer = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY,
});

export const sendEmail = async (to, subject, html) => {
  try {
    await mailer.email.send({
      from: process.env.MAIL_FROM,
      to: [to],
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error("MailerSend API error:", err);
    return false;
  }
};
