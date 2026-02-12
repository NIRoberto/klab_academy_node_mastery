// src/config/email.config.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter with STARTTLS (port 587)
export const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false, // false for STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  pool: true, // Use pooled connections
  maxConnections: 1, // Limit connections to save memory
  maxMessages: 100 // Limit messages per connection
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});
