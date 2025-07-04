import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Email Server is running!");
});

app.post("/send-email", async (req, res) => {
  const { firstName, lastName, email, subject, message } = req.body;
  const fullName = `${firstName} ${lastName}`;

  if (!firstName || !lastName || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }

  const { EMAIL_SERVER_USER, EMAIL_SERVER_PASSWORD, ADMIN_EMAIL } = process.env;

  if (!EMAIL_SERVER_USER || !EMAIL_SERVER_PASSWORD || !ADMIN_EMAIL) {
    console.error("ERROR: Missing environment variables");
    return res.status(500).json({ success: false, message: "Server configuration error." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.zoho.com",
   port: 587,
   secure: false,
    auth: {
      user: EMAIL_SERVER_USER,
      pass: EMAIL_SERVER_PASSWORD,
    },
  });

  // ✅ SMTP verification block
  try {
    await transporter.verify();
    console.log("SMTP connection verified successfully.");
  } catch (smtpError) {
    console.error("[SMTP VERIFY ERROR]", smtpError);
    return res.status(500).json({ success: false, message: "SMTP verification failed", error: smtpError.message });
  }

  const mailToAdmin = {
    from: `"${fullName}" <${EMAIL_SERVER_USER}>`,
    to: ADMIN_EMAIL,
    subject: `New Contact Form Submission: ${subject}`,
    html: `
      <h2>New Message from Madrid Pharmaceuticals Website</h2>
      <p><strong>Name:</strong> ${fullName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <hr>
      <h3>Message:</h3>
      <p>${message}</p>
    `,
  };

  const mailToUser = {
    from: `"Madrid Pharmaceuticals" <${EMAIL_SERVER_USER}>`,
    to: email,
    subject: "Thank you for contacting Madrid Pharmaceuticals",
    html: `
      <h2>Thank You, ${firstName}!</h2>
      <p>We have successfully received your message and appreciate you contacting us.</p>
      <p>One of our team members will get back to you shortly.</p>
      <hr>
      <p><strong>Your Submitted Message:</strong></p>
      <p><em>"${message}"</em></p>
      <br>
      <p>Best regards,</p>
      <p><strong>The Madrid Pharmaceuticals Team</strong></p>
    `,
  };

  try {
    await transporter.sendMail(mailToAdmin);
    await transporter.sendMail(mailToUser);
    return res.status(200).json({ success: true, message: "Message sent successfully!" });
  } catch (error) {
    console.error("[EMAIL_SERVER_ERROR]", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email.",
      error: error.message, // ✅ Return actual error to frontend for visibility
    });
  }
});

app.listen(PORT, () => {
  console.log(`Email server is listening on port ${PORT}`);
});
