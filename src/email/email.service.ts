import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configurar el transporter con las variables de entorno
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  // Enviar código de recuperación de contraseña
  async sendResetCode(email: string, code: string, name?: string) {
    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Dashboard Ecommerce'}" <${process.env.SMTP_USER || 'noreply@app.com'}>`,
      to: email,
      subject: 'Código de recuperación de contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Recuperación de contraseña</h2>
          <p>Hola${name ? ` ${name}` : ''},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #333;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">Este código expira en <strong>5 minutos</strong>.</p>
          <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, ignora este correo.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">Dashboard Ecommerce</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }
}