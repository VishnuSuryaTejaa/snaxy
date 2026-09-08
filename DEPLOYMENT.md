# 🚀 Snaxy Deployment Guide (100% Free Tier on Vercel + MongoDB Atlas)

Snaxy is designed to run seamlessly on free cloud infrastructure with zero recurring costs:
- **Hosting:** [Vercel](https://vercel.com) (Hobby Free Plan)
- **Database:** [MongoDB Atlas](https://www.mongodb.com/atlas) (Free M0 Shared Cluster with 512MB storage)
- **Real-Time Admin Notifications:**
  1. **Telegram Bot:** Direct serverless webhooks with inline Verify/Reject buttons.
  2. **Web Push / PWA:** Standard VAPID push notifications directly to admin phones and laptops.
  3. **In-App Notification Center:** Unread badge + synthesized Web Audio chime.

---

## 1. Database Setup (MongoDB Atlas)

1. Log in to your [MongoDB Atlas Dashboard](https://cloud.mongodb.com).
2. Create a Database User under **Security > Database Access** (note down the `<db_username>` and password).
3. Under **Security > Network Access**, click **Add IP Address** -> Allow Access From Anywhere (`0.0.0.0/0`) so Vercel serverless functions can connect.
4. Construct your `DATABASE_URL`:
   ```bash
   DATABASE_URL="mongodb+srv://<db_username>:<db_password>@cluster0.nzlky6l.mongodb.net/snaxy?retryWrites=true&w=majority&appName=Cluster0"
   ```
5. Push the Prisma collections & indexes to MongoDB:
   ```bash
   npx prisma db push
   ```
6. Optionally seed the initial menu items:
   ```bash
   npm run db:seed
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

1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) -> Import Project -> Select `snaxy-app`.
3. Add the following **Environment Variables** in Vercel project settings:

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `mongodb+srv://<db_username>:password@cluster0.../snaxy?retryWrites=true&w=majority&appName=Cluster0` | MongoDB Atlas URI |
| `ADMIN_USERNAME` | `admin` | Admin portal username |
| `ADMIN_PASSWORD` | `snaxy_admin_2026` | Staff login password |
| `SESSION_SECRET` | `f9b4c8a2e1d74389a915afe16aa5ae24bc27943f4a6049c5a34d2db09b5fa779` | Used to sign session tokens |
| `VAPID_PUBLIC_KEY` | *(From `npm run gen:vapid`)* | Web Push public key |
| `VAPID_PRIVATE_KEY` | *(From `npm run gen:vapid`)* | Web Push private key |
| `VAPID_SUBJECT` | `mailto:admin@snaxy.local` | Contact email for Web Push |
| `TELEGRAM_BOT_TOKEN` | `7123456789:AAF...` | From @BotFather |
| `TELEGRAM_CHAT_ID` | `123456789` | Your Telegram Chat ID |
| `TELEGRAM_WEBHOOK_SECRET`| `whsec_snaxy_telegram_2026` | Secret token to verify webhook |
| `NEXT_PUBLIC_SITE_URL` | `https://snaxy-app.vercel.app` | Your deployed Vercel domain |
| `NEXT_PUBLIC_UPI_ID` | `snaxy@upi` | Your UPI ID to receive payments |
| `NEXT_PUBLIC_MERCHANT_NAME` | `Snaxy Store` | Store name shown on UPI app |

---

## 5. Register Telegram Webhook (1-Click)

```bash
node scripts/set-telegram-webhook.mjs https://snaxy-app.vercel.app
```
