# Playbook

The financial hub for college athletes earning NIL income. Playbook connects to a
student-athlete's bank accounts (via Plaid), shows them where their money is, calculates
how much to set aside for taxes, and sends simple in-app alerts.

> **Playbook is a router and tracker.** It never holds or moves money, and it never gives
> licensed financial advice. All guidance is educational. The disclaimers in this MVP are
> placeholders, not legal cover — see [Before going to production](#before-going-to-production).

This is the MVP. It runs against **Plaid Sandbox** only (fake banks, fake money).

---

## What you need first

1. **Node.js 20.9 or newer.** Check with `node --version`.
   - Don't have Node? The easiest way on Mac/Linux is [nvm](https://github.com/nvm-sh/nvm):
     ```bash
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
     # then restart your terminal and:
     nvm install --lts
     ```
   - On Windows, download the installer from [nodejs.org](https://nodejs.org).
2. **A PostgreSQL database.** Free options (no credit card):
   - **Neon** — https://neon.tech → create a project → copy the connection string.
   - **Supabase** — https://supabase.com → new project → Settings → Database → Connection string (URI).
3. **Free Plaid sandbox keys** — https://dashboard.plaid.com → sign up → **Developers → Keys**.
   Copy your **client_id** and your **Sandbox** secret. No approval needed for sandbox.

---

## Setup (about 10 minutes)

From this `playbook/` folder, in a terminal:

### 1. Install dependencies
```bash
npm install
```

### 2. Create your environment file
```bash
cp .env.example .env
```
Then open `.env` and fill in the values:

| Variable | Where it comes from |
| --- | --- |
| `DATABASE_URL` | Your Neon/Supabase connection string |
| `AUTH_SECRET` | Run `openssl rand -base64 32` and paste the result |
| `ENCRYPTION_KEY` | Run `openssl rand -hex 32` and paste the result |
| `APP_URL` | Leave as `http://localhost:3000` for local use |
| `PLAID_CLIENT_ID` | From the Plaid dashboard Keys page |
| `PLAID_SECRET` | The **Sandbox** secret from the Plaid Keys page |
| `PLAID_ENV` | Leave as `sandbox` |

> `.env` is gitignored — your secrets are never committed.

### 3. Set up the database
```bash
npm run db:migrate   # creates all the tables
npm run db:seed      # adds the test school + access code
```

### 4. Run it
```bash
npm run dev
```
Open **http://localhost:3000**.

---

## Trying it out

- **Sign up** with any email and a password (8+ characters).
  - Optional **school access code**: `CANES26` (links you to "University of Miami Athletics").
- **Email verification:** the MVP has no email provider, so the verification link is
  printed in your terminal *and* shown on screen after signup. Click it to verify, then log in.
- **Linking a bank (Plaid Sandbox):** when prompted by Plaid, use the test credentials
  username **`user_good`** / password **`pass_good`**. It's all fake sandbox data.

---

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / run |
| `npm test` | Run the unit tests (rules + projection math) |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Seed the test school + access code |
| `npm run db:studio` | Open Prisma Studio to browse the database |
| `npm run lint` | Lint the code |

---

## Deploying

Recommended: **Vercel** (the app) + **Neon** or **Supabase** (the database). All have free tiers.

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **New Project** → import the repo.
   - If this app lives in a `playbook/` subfolder, set Vercel's **Root Directory** to `playbook`.
3. Add the same environment variables from your `.env` in Vercel's **Settings → Environment Variables**
   (set `APP_URL` to your real Vercel URL, e.g. `https://your-app.vercel.app`).
4. Apply migrations to your production database once:
   ```bash
   DATABASE_URL="<your production db url>" npm run db:deploy
   DATABASE_URL="<your production db url>" npm run db:seed
   ```
5. Deploy. Vercel runs `npm run build` automatically.

---

## How it's built

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **PostgreSQL** via **Prisma 7** (with the `@prisma/adapter-pg` driver adapter)
- **Tailwind CSS v4** for styling
- **Auth:** email/password with `bcryptjs` hashing + signed-JWT sessions (`jose`) in
  HTTP-only cookies, following Next.js 16's official authentication guide
- **Plaid** (sandbox) via the official Node client; access tokens are encrypted at rest
- **Installable PWA** (manifest + offline-shell service worker)

```
src/
  app/
    (auth)/        login, signup, verify screens
    (app)/         authenticated shell + Home, Money, Alerts, Timeline, Settings
    onboarding/    the 6-step onboarding wizard
    actions/       server actions (auth, onboarding, settings)
  lib/             rules engine, projection math, prisma client, session, crypto
  components/      shared UI
prisma/            schema + seed
```

---

## Before going to production

This MVP is for development and demos only. **Before launching with real bank data:**

- Commission an independent **security review**.
- Complete **Plaid's production approval** process and switch `PLAID_ENV`.
- Get **legal review** of all financial-guidance language and disclaimers.
- Wire up a real **email provider** for verification.

The educational disclaimers in this app are placeholders, not legal cover.
