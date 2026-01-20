// src/templates/email.templates.ts
import { transporter } from "../config/email.config";




export const welcomeEmailTemplate = (firstName: string, email: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .button { 
          display: inline-block; 
          padding: 10px 20px; 
          background: #4CAF50; 
          color: white; 
          text-decoration: none; 
          border-radius: 5px; 
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #777; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Our Platform!</h1>
        </div>
        <div class="content">
          <h2>Hello ${firstName}!</h2>
          <p>Thank you for registering with us. We're excited to have you on board.</p>
          <p>Your account has been successfully created with the email: <strong>${email}</strong></p>
          <p>You can now start exploring our platform and enjoy all the features we offer.</p>
          <a href="https://yourapp.com/login" class="button">Get Started</a>
        </div>
        <div class="footer">
          <p>© 2024 Your Company. All rights reserved.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};




interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const mailOptions = {
      from: `"Your App" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error("Failed to send email");
  }
};

export const sendWelcomeEmail = async (
  email: string,
  firstName: string
): Promise<void> => {
  await sendEmail({
    to: email,
    subject: "Welcome to Our Platform!",
    html: welcomeEmailTemplate(firstName, email),
  });
};