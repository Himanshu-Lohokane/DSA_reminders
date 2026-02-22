<div align="center">
  <img src="./public/logo.png" alt="DSA Grinders Logo" width="120" height="120" />

  # DSA Grinders 🚀

  **The ultimate competitive learning platform for Data Structures & Algorithms.**  
  *Track your LeetCode & GeeksforGeeks progress, compete with friends, and stay motivated through daily syncs and automated roasts!*

  <p align="center">
    <a href="https://dsagrinder.in"><strong>Visit Website</strong></a> ·
    <a href="#-getting-started"><strong>Getting Started</strong></a> ·
    <a href="#-features"><strong>Features</strong></a>
  </p>

  ![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
  ![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)
  ![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-PostgreSQL-C5F74F?style=for-the-badge&logo=drizzle)
</div>

<br />

## 📖 About The Project

**DSA Grinders** is built for developers who want to stay consistent with their coding journey. By integrating directly with platforms like LeetCode and GeeksforGeeks, it automatically tracks your solved problems, calculates your score, and ranks you on a global or group-specific leaderboard. 

Whether you're preparing for placements or just sharpening your skills, DSA Grinders adds a layer of gamification and social accountability to keep you grinding.

---

## ✨ Key Features

- 🏆 **Multi-Platform Sync**: Real-time synchronization with **LeetCode** and **GeeksforGeeks** profiles.
- 📊 **Premium Leaderboards**: Rank-based icons (Gold, Silver, Bronze), global rankings, and private group leaderboards.
- 👥 **Private Groups**: Create or join private groups using unique invite codes to compete directly with your friends or classmates.
- 🎯 **Daily Challenges**: Curated daily problems from the Neetcode 150 list to keep you focused.
- 💬 **Automated Roasts & Reminders**: Daily WhatsApp and Email notifications to keep the grind alive (and roast you if you lose your streak!).
- 🔐 **Seamless Authentication**: Secure, one-tap Google sign-in powered by Supabase.
- 📱 **PWA Support**: Installable as a native-like app on iOS and Android for on-the-go tracking.
- 🎨 **Beautiful UI**: Glassmorphism, dark mode support, and smooth Framer Motion animations.

---

## 🛠️ Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16.1 (App Router), React 19, Tailwind CSS, Framer Motion, Radix UI |
| **Backend** | Next.js Route Handlers, Drizzle ORM |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth (Google OAuth) |
| **State Management** | TanStack React Query |
| **Integrations** | LeetCode GraphQL, RPay Connect (WhatsApp), Nodemailer (Gmail) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase Project (PostgreSQL + Auth)
- Gmail account (for SMTP)
- RPay Connect API Key (for WhatsApp)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/piyushdhoka/DSA_Dhurandhars.git
   cd DSA_Dhurandhars
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or bun install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

4. **Configuration (`.env`):**
   ```env
   # Database & Supabase
   DATABASE_URL=
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # App URL
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   # WhatsApp (RPay Connect)
   RPAY_API_KEY=

   # Email (Gmail SMTP)
   SMTP_EMAIL=
   SMTP_PASSWORD=

   # Security
   CRON_SECRET=
   ADMIN_PASSWORD=
   JWT_SECRET=
   ```

5. **Sync Database Schema:**
   ```bash
   npx drizzle-kit push
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

---

## 🏗️ Architecture

- **Auth**: Managed via `AuthContext.tsx`, blocking incomplete profiles with a mandatory onboarding flow.
- **Data Sync**: Immediate LeetCode/GFG sync upon profile update and daily cron jobs for leaderboard updates.
- **Caching**: In-memory caching and SWR (Stale-While-Revalidate) patterns using React Query for lightning-fast leaderboards.

---

## 📄 License

MIT © [Piyush Dhoka](https://github.com/piyushdhoka)

