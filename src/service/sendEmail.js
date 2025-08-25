import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments = [] }) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: to || " ",
    subject: subject || "Hello from Saraha App",
    text: "This is a test email from Saraha App",
    html: html || "<b>This is a test email from Saraha App</b>",
    attachments: attachments || [],
  });
  if (info.accepted.length > 0) {
    return true;
  } else {
    return false;
  }
};
