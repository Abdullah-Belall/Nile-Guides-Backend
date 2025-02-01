import { InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export default async function sendMessage(
  email: string,
  subject: string,
  html: string,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: subject,
      html: html,
    });
  } catch {
    throw new InternalServerErrorException('problem with send email');
  }
}
