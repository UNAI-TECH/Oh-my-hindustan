import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

export const sendCreatorCredentials = async (req: Request, res: Response) => {
  try {
    const { toEmail, password } = req.body;

    if (!toEmail || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Configure transporter
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
      console.error('Nodemailer configuration missing EMAIL_USER or EMAIL_PASS');
      return res.status(500).json({ error: 'Email service configuration is incomplete' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    const mailOptions = {
      from: `"Oh My Hindusthan Admin" <${user}>`,
      to: toEmail,
      subject: 'Your Creator Account Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #E31E24;">Welcome to Oh My Hindusthan</h2>
          <p>Your account has been approved. Use the following credentials to sign in and access the Creator Studio.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${toEmail}</p>
            <p style="margin: 0;"><strong>Password:</strong> ${password}</p>
          </div>
          <p>Please keep these credentials secure.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error: any) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};
