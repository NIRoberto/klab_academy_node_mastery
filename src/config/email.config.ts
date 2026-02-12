// src/config/email.config.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter - Works with Gmail, Brevo, or any SMTP service
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
});

// Verify connection
if (process.env.NODE_ENV === 'development') {
  transporter.verify((error, success) => {
    if (error) {
      console.error("Email configuration error:", error);
    } else {
      console.log("Email server is ready to send messages");
    }
  });
} else {
  console.log("Email configured for production. Use Brevo/Mailtrap for reliable delivery on Render.");
}
