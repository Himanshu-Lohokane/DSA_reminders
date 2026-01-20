import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const ROASTS = [
  "Abe DSA kar varna Swiggy pe delivery karega! 🛵",
  "Netflix band kar, LeetCode khol! Nahi toh fresher hi rahega! 💀",
  "Tere dost Google join kar rahe, tu abhi bhi Two Sum mein atka hai! 😭",
  "DSA nahi aati? Koi baat nahi, Chai Ka Thela bhi acha business hai! ☕",
  "Ek problem roz bhi solve nahi karta? Beta campus mein hi reh jayega! 🏫",
  "Array reverse karna nahi aata? Career bhi reverse ho jayegi! 🔄",
  "Bro 2 ghante ho gaye, ek problem bhi nahi ki? Shame on you! 🙈",
  "Teri struggle story LinkedIn pe viral hogi... galat reason se! 😅",
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

export async function sendDSAReminder(toEmail: string, userName: string) {
  const roast = getRandomRoast();

  const mailOptions = {
    from: `"DSA Dhurandhar 🔥" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: '🚨 DSA KARLE BHOSDIKE ! - 2 Ghante Ka Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px;">
        <h1 style="color: #00d4ff; text-align: center; font-size: 28px; margin-bottom: 20px;">
          🔥 DSA Dhurandhar
        </h1>
        <div style="background: rgba(255,80,80,0.1); border: 1px solid rgba(255,80,80,0.3); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #ff6b6b; text-align: center; font-size: 22px; margin: 0;">
            ${roast}
          </h2>
        </div>
        <p style="color: #e0e0e0; font-size: 16px; text-align: center; line-height: 1.6;">
          Are <strong style="color: #00d4ff;">${userName}</strong>!<br><br>
          Tere competitors abhi LeetCode grind kar rahe hain.<br>
          Peeche mat rah! Aaj kam se kam <strong>ek</strong> problem toh solve kar!
        </p>
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://leetcode.com/problemset/" style="display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #0099ff 100%); color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
            LeetCode Khol Abhi! →
          </a>
        </div>
        <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
          <p style="color: #888; font-size: 14px; margin: 0;">
            Yaad rakh: <strong style="color: #ffd700;">DSA karle bhai varna JOB nahi lagegi!</strong> 💀
          </p>
        </div>
        <p style="color: #666; font-size: 11px; text-align: center; margin-top: 20px;">
          Ye reminder tujhe isliye mila kyunki tune DSA Dhurandhar join kiya hai.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}
