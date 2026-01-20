import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const ROASTS = [
  "Abe gadhe, DSA kar varna Swiggy pe delivery karega zindagi bhar! 🛵",
  "Oye nikamme! Netflix band kar, LeetCode khol! Nahi toh jobless marega! 💀",
  "Tere dost Google join kar rahe, tu abhi bhi Two Sum mein atka hai ullu! 😭",
  "DSA nahi aati? Koi baat nahi, Chai Ka Thela khol le nalayak! ☕",
  "Ek problem bhi solve nahi karta? Teri toh kismat hi kharab hai bhai! 🏫",
  "Array reverse karna nahi aata? Teri life reverse ho jayegi bekaar! 🔄",
  "Bro itna useless kaun hota hai? Thoda toh padhle kamina! 🙈",
  "Teri struggle story LinkedIn pe viral hogi... rejection ke saath! 😅",
  "Placement season mein tujhe dekhke HR log bhi hasenge! 🤣",
  "Recursion samajh nahi aata? Tu khud ek infinite loop hai bc! 🔁",
  "Aaj bhi kuch nahi kiya? Teri productivity toh COVID se bhi zyada khatarnak hai! 🦠",
  "Tere resume mein sirf WhatsApp forward karne ka experience hai kya? 📱",
  "DSA Dhurandhar banne aaya tha, DSA Bekaar ban gaya! 🤡",
];

const INSULTS = [
  "Tu toh pakka WITCH company bhi reject kar degi! 🧙‍♀️",
  "Tera LeetCode streak dekh ke coding itself ro deti hai! 😢",
  "Tu itna slow hai, turtle bhi race jeet jaaye! 🐢",
  "Bhai tu itna weak hai, ek loop bhi properly nahi chala sakta! ➿",
  "Tere code mein bugs itne hai, pesticide company khol de! 🪲",
];

function getRandomRoast() {
  return ROASTS[Math.floor(Math.random() * ROASTS.length)];
}

function getRandomInsult() {
  return INSULTS[Math.floor(Math.random() * INSULTS.length)];
}

export async function sendDSAReminder(toEmail: string, userName: string) {
  const roast = getRandomRoast();
  const insult = getRandomInsult();

  const mailOptions = {
    from: `"DSA Dhurandhar 🔥" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: '🚨 OYE NALAYAK! DSA KARLE! - Daily Reality Check',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px;">
        <h1 style="color: #ff4444; text-align: center; font-size: 32px; margin-bottom: 10px;">
          🔥 DSA DHURANDHAR 🔥
        </h1>
        <p style="color: #888; text-align: center; font-size: 14px; margin-bottom: 20px;">
          Daily Insult Service for Lazy Developers
        </p>
        
        <div style="background: rgba(255,80,80,0.15); border: 2px solid rgba(255,80,80,0.4); border-radius: 12px; padding: 24px; margin-bottom: 20px;">
          <h2 style="color: #ff6b6b; text-align: center; font-size: 24px; margin: 0 0 10px 0;">
            💀 ROAST OF THE DAY 💀
          </h2>
          <p style="color: #ff9999; text-align: center; font-size: 18px; margin: 0; font-weight: bold;">
            ${roast}
          </p>
        </div>
        
        <div style="background: rgba(255,165,0,0.1); border: 1px solid rgba(255,165,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #ffa500; text-align: center; font-size: 16px; margin: 0;">
            🎯 Bonus Insult: ${insult}
          </p>
        </div>
        
        <p style="color: #e0e0e0; font-size: 16px; text-align: center; line-height: 1.6;">
          Oye <strong style="color: #00d4ff;">${userName}</strong>!<br><br>
          Tere competitors abhi LeetCode grind kar rahe hain<br>
          aur tu yaha mail padh raha hai? 🤦‍♂️<br><br>
          <strong style="color: #ff6b6b;">Pehle ek problem solve kar, phir baaki kaam kar!</strong>
        </p>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="https://leetcode.com/problemset/" style="display: inline-block; background: linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%); color: #fff; padding: 16px 40px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 18px; text-transform: uppercase;">
            🔥 ABHI LEETCODE KHOL! 🔥
          </a>
        </div>
        
        <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-top: 24px; text-align: center;">
          <p style="color: #ff4444; font-size: 20px; margin: 0; font-weight: bold;">
            DSA KARLE BHAI VARNA JOB NHI LAGEGI! 💀🔥
          </p>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="color: #666; font-size: 11px; text-align: center;">
            Ye roast tujhe isliye mila kyunki tune DSA Dhurandhar join kiya hai.<br>
            Ab bhugat! Unsubscribe ka option nahi hai kamzor! 😈
          </p>
        </div>
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
