# 🚀 Snaxy Deployment Guide (100% Free Tier on Vercel + Turso)

Snaxy is designed to run seamlessly on free cloud infrastructure with zero recurring costs:
- **Hosting:** [Vercel](https://vercel.com) (Hobby Free Plan)
- **Database:** [Turso](https://turso.tech) (Free tier libSQL / SQLite with 9GB storage & 1B rows/month)
- **Real-Time Admin Notifications:**
  1. **Telegram Bot:** Direct serverless webhooks with inline Verify/Reject buttons.
  2. **Web Push / PWA:** Standard VAPID push notifications directly to admin phones and laptops.
  3. **In-App Notification Center:** Unread badge + synthesized Web Audio chime.

---

## 1. Quick Database Setup (Turso)

1. Install Turso CLI or log in at [turso.tech](https://turso.tech):
   ```bash
   brew install tursodatabase/tap/turso # (or signup at turso.tech)
   turso auth signup
   ```
2. Create a database:
   ```bash
   turso db create snaxy-db
   ```
3. Get the connection URL and Auth Token:
   ```bash
   turso db show snaxy-db --url
   # Example: libsql://snaxy-db-yourorg.turso.io

   turso db tokens create snaxy-db
   # Outputs your TURSO_AUTH_TOKEN
   ```

---

## 2. Generate Web Push VAPID Keys (Free)

Run the included key generator script inside `snaxy-app/`:
```bash
npm run gen:vapid
```
This will output `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.

---

## 3. Create Free Telegram Bot (Optional, Recommended)

1. Open Telegram and search for [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the prompts to name your bot (e.g., `SnaxyAdminBot`).
3. BotFather will give you a **Bot Token** (e.g. `7123456789:AAF...`).
4. Start a chat with your new bot (click `/start`).
5. To get your personal `TELEGRAM_CHAT_ID`, message [@userinfobot](https://t.me/userinfobot) on Telegram. It will reply with your numeric ID (e.g. `123456789`).
6. Set a random string for `TELEGRAM_WEBHOOK_SECRET` (e.g. `snaxy_secret_key_9876`).

---

## 4. Deploy to Vercel

1. Push your repository to GitHub / GitLab / Bitbucket.
2. Go to [Vercel Dashboard](https://vercel.com/new) -> Import Project -> Select `Snaxy` / `snaxy-app`.
3. Add the following **Environment Variables** in Vercel project settings:

| Variable | Value | Notes |
|---|---|---|
| `TURSO_URL` | `libsql://snaxy-db-yourorg.turso.io` | Your Turso DB URL |
| `TURSO_AUTH_TOKEN` | `eyJhb...` | Your Turso Auth Token |
| `ADMIN_USERNAME` | `admin` | Admin portal username |
| `ADMIN_PASSWORD` | `YourStrongAdminPassword!` | Staff login password |
| `SESSION_SECRET` | *(64-character random hex string)* | Used to sign session tokens |
| `VAPID_PUBLIC_KEY` | *(From `npm run gen:vapid`)* | Web Push public key |
| `VAPID_PRIVATE_KEY` | *(From `npm run gen:vapid`)* | Web Push private key |
| `VAPID_SUBJECT` | `mailto:admin@snaxy.local` | Contact email for Web Push |
| `TELEGRAM_BOT_TOKEN` | `7123456789:AAF...` | From @BotFather |
| `TELEGRAM_CHAT_ID` | `123456789` | Your Telegram Chat ID |
| `TELEGRAM_WEBHOOK_SECRET`| `snaxy_secret_key_9876` | Secret token to verify webhook |
| `NEXT_PUBLIC_SITE_URL` | `https://your-snaxy-project.vercel.app` | Your deployed Vercel domain |
| `NEXT_PUBLIC_UPI_ID` | `snaxy@upi` | Your UPI ID to receive payments |
| `NEXT_PUBLIC_MERCHANT_NAME` | `Snaxy Store` | Store name shown on UPI app |

4. Click **Deploy**.

---

## 5. Initialize Schema & Push Telegram Webhook

Once deployed on Vercel:

1. **Push database schema to Turso:**
   ```bash
   DATABASE_URL="libsql://snaxy-db-yourorg.turso.io?authToken=YOUR_TOKEN" npx prisma db push
   ```

2. **Register Telegram Webhook (1-click script):**
   ```bash
   node scripts/set-telegram-webhook.mjs https://your-snaxy-project.vercel.app
   ```

3. **Log in to Admin:**
   Visit `https://your-snaxy-project.vercel.app/admin`, enter your admin credentials, and click **🔔 Enable** on the notification bell to activate browser Web Push alerts!
