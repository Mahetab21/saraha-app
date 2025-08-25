import dotenv from "dotenv";
import path from "path";
import { sendEmail } from "./src/service/sendEmail.js";

// Load environment variables
dotenv.config({ path: "./src/config/.env" });

console.log("📧 Testing email configuration...");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASSWORD exists:", !!process.env.EMAIL_PASSWORD);

async function testEmail() {
  try {
    console.log("🚀 Sending test email...");

    const result = await sendEmail({
      to: "mahitabayman80@gmail.com", // Send to yourself for testing
      subject: "Test Email from Saraha App",
      html: `
        <h2>Test Email</h2>
        <p>This is a test email to verify your email configuration is working.</p>
        <p>If you receive this, your email setup is correct!</p>
      `,
    });

    console.log("✅ Email sent successfully:", result);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
}

testEmail();
