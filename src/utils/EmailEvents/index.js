import { EventEmitter } from "events";
import { generateToken } from "../../utils/token/generateToken.js";
import { sendEmail } from "../../service/sendEmail.js";

export const eventEmitter = new EventEmitter();
eventEmitter.on("sendEmail", async (data) => {
  const { email, otp, confirmLink } = data;

  console.log("📧 Attempting to send email to:", email);
  console.log("📱 OTP:", otp);
  console.log("🔗 Confirm Link:", confirmLink);

  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Email Verification</h2>
      <p>Hello,</p>
      <p>Thank you for signing up with Saraha App. Please use the following verification code to confirm your email address:</p>
      <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #333; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
      </div>
      <p>This code will expire in 5 minutes.</p>
      ${
        confirmLink
          ? `<p>Or click the link to confirm your email: <a href="${confirmLink}">Confirm Email</a></p>`
          : ""
      }
      <p>If you didn't create an account with us, please ignore this email.</p>
      <br>
      <p>Best regards,<br>Saraha App Team</p>
    </div>
  `;

  try {
    const isSend = await sendEmail({
      to: email,
      subject: "Email Verification - Saraha App",
      html,
    });

    console.log("✅ Email sent successfully:", isSend);

    if (!isSend) {
      throw new Error("Failed to send verification email", { cause: 400 });
    }
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw new Error("Failed to send verification email", { cause: 400 });
  }
});

eventEmitter.on("forgetPassword", async (data) => {
  const { email, otp } = data;
  const isSend = await sendEmail({
    to: email,
    subject: "forget password",
    html: `<h1>your otp is ${otp}</h1>`,
  });
  if (!isSend) {
    throw new Error("Failed to send email", { cause: 400 });
  }
});
