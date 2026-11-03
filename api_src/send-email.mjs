import nodemailer from 'nodemailer';

const SMTP_USER = process.env.SMTP_USER || 'smartfxlabs@gmail.com';
const SMTP_PASS = process.env.SMTP_PASS || 'tjptswbqmllstxux';
const EMAIL_FROM = process.env.EMAIL_FROM || '"XYZ Intelligence" <smartfxlabs@gmail.com>';
const INTERNAL_SECRET = process.env.INTERNAL_MAIL_SECRET || 'xyz_internal_otp_dispatcher_99';

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ success: false, error: 'Method not allowed' }));
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const str = Buffer.concat(chunks).toString('utf-8');
      body = JSON.parse(str || '{}');
    } catch (e) {
      body = {};
    }
  }

  const { to, subject, html, secret } = body || {};
  if (secret !== INTERNAL_SECRET) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Unauthorized mail dispatcher' }));
  }

  if (!to || !subject || !html) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, error: 'Missing to, subject, or html' }));
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html
    });

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, delivered: true, messageId: info.messageId }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: false, delivered: false, error: err.message }));
  }
}
