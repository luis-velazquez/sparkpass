# SparkyPass Deployment Guide

This guide covers deploying SparkyPass to Vercel with Turso database.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Turso](https://turso.tech) account (free tier available)
3. OAuth credentials (optional, for social login)
4. A GitHub/GitLab/Bitbucket repository with the code

## Step 1: Set Up Turso Database

1. Sign up at [turso.tech](https://turso.tech)

2. Install the Turso CLI:
   ```bash
   brew install tursodatabase/tap/turso
   # or
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

3. Login to Turso:
   ```bash
   turso auth login
   ```

4. Create a database:
   ```bash
   turso db create sparkypass
   ```

5. Get your database URL:
   ```bash
   turso db show sparkypass --url
   # Output: libsql://sparkypass-<your-username>.turso.io
   ```

6. Create an auth token:
   ```bash
   turso db tokens create sparkypass
   # Save this token securely!
   ```

7. Push your schema to the remote database:
   ```bash
   TURSO_DATABASE_URL="libsql://sparkypass-<your-username>.turso.io" \
   TURSO_AUTH_TOKEN="your-auth-token" \
   npm run db:push
   ```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)

2. Import your Git repository

3. Set the Root Directory to `sparkypass` (if deploying from a monorepo)

4. Add Environment Variables in Vercel dashboard:

   | Variable | Value | Notes |
   |----------|-------|-------|
   | `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Your production URL |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` | Generate a secure secret |
   | `TURSO_DATABASE_URL` | `libsql://sparkypass-xxx.turso.io` | From Step 1 |
   | `TURSO_AUTH_TOKEN` | `your-turso-token` | From Step 1 |
   | `GOOGLE_CLIENT_ID` | Your OAuth ID | Optional |
   | `GOOGLE_CLIENT_SECRET` | Your OAuth secret | Optional |
   | `FACEBOOK_CLIENT_ID` | Your OAuth ID | Optional |
   | `FACEBOOK_CLIENT_SECRET` | Your OAuth secret | Optional |
   | `APPLE_CLIENT_ID` | Your OAuth ID | Optional |
   | `APPLE_CLIENT_SECRET` | Your OAuth secret | Optional |
   | `CONTACT_EMAIL` | `avgluis@gmail.com` | Contact form recipient |

5. Click "Deploy"

### Option B: Via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   cd sparkypass
   vercel
   ```

4. Add environment variables:
   ```bash
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   vercel env add TURSO_DATABASE_URL
   vercel env add TURSO_AUTH_TOKEN
   # ... add other variables
   ```

5. Redeploy with production settings:
   ```bash
   vercel --prod
   ```

## Step 3: Configure OAuth Providers (Optional)

For social login to work in production:

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Add your production URL to authorized origins
3. Add `https://your-domain.vercel.app/api/auth/callback/google` to redirect URIs

### Facebook OAuth
1. Go to [Facebook Developers](https://developers.facebook.com/apps/)
2. Add your production domain to valid OAuth redirect URIs
3. Add `https://your-domain.vercel.app/api/auth/callback/facebook`

### Apple OAuth
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Configure your Return URLs with production domain

## Step 4: Post-Deployment Verification

Test these features in production:

- [ ] Landing page loads at `/`
- [ ] Registration with email/password at `/register`
- [ ] Email verification flow (check console logs in Vercel)
- [ ] Login with email/password at `/login`
- [ ] Dashboard loads at `/dashboard` after login
- [ ] Quiz category selection at `/quiz`
- [ ] Quiz taking with progress tracking
- [ ] Quiz results with XP display
- [ ] Contact form submission at `/contact`
- [ ] Profile page at `/profile`
- [ ] Bookmarks functionality at `/bookmarks`
- [ ] Logout functionality

## Troubleshooting

### Database Connection Errors
- Verify `TURSO_DATABASE_URL` starts with `libsql://`
- Ensure `TURSO_AUTH_TOKEN` is set correctly
- Check Turso dashboard for database status

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches your actual production URL
- Ensure `NEXTAUTH_SECRET` is set (use `openssl rand -base64 32`)
- Check OAuth provider redirect URIs match production URL

### Build Failures
- Check Vercel build logs for specific errors
- Ensure all required environment variables are set
- Verify the root directory is set to `sparkypass` if in a monorepo

## Environment Variables Reference

```env
# Required
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-32-char-secret
TURSO_DATABASE_URL=libsql://sparkypass-xxx.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token
CONTACT_EMAIL=avgluis@gmail.com

# Optional (for social login)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
FACEBOOK_CLIENT_ID=xxx
FACEBOOK_CLIENT_SECRET=xxx
APPLE_CLIENT_ID=xxx
APPLE_CLIENT_SECRET=xxx
```
