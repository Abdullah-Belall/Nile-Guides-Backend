import { InternalServerErrorException } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { WebsiteBaseUrl } from './base';

const emailTemplate = (message: string) => `
  <html>
    <head>
      <style>
        .container {
          text-align: center;
          font-family: Arial, sans-serif;
        }
        .logo {
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 60px;
          display: block;
        }
        .content {
          max-width: 500px;
          padding: 20px;
          border-radius: 10px;
          display: inline-block;
          text-align: left;
          max-width: 500px;
          color: #ae9460;
          font-size: 20px
        }
      </style>
    </head>
    <body>
      <div class="container">
        <a href=${WebsiteBaseUrl}>
          <img class="logo" src="https://res.cloudinary.com/doy0la086/image/upload/logo-no-bac_lrygjs.png" alt="Website Logo" />
        </a>
        <div class="content">
          ${message}
        </div>
      </div>
    </body>
  </html>
`;

export default async function sendMessage(
  email: string,
  subject: string,
  html: string,
): Promise<void> {
  const transporter = createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: emailTemplate(html),
    });
  } catch {
    throw new InternalServerErrorException('problem with send email');
  }
}
