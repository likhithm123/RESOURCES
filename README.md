# Resources Portal

Interview-prep portal: handwritten-style notes in a protected viewer, a role-based track sheet that saves
progress, resources, project ideas, a Connect tab, and an admin CMS.

- **Web:** React + Vite (static, served by Vercel)
- **API:** one Vercel serverless function (`api/index.js`, Hono)
- **Database:** Cloudflare D1 over its HTTP API (tables prefixed `rp_`); local fallback is a SQLite file
- **Files:** ImageKit private files. Notes are stored as page images, never as a PDF
- **Email:** SMTP (sign-in / verification / reset codes)

## Run locally
```bash
pnpm install
cp .env.example .env.local     # fill in the values
pnpm db:migrate                # creates the rp_ tables (safe to re-run)
pnpm dev                       # web on :5173, API on :8799
```
Without the `CF_*` values the API uses `.data/portal.db` (SQLite). Set `DEV_LOG_OTP=1` and `DEV_NO_MAIL=1`
locally to print codes in the API console instead of emailing them.

## Deploy on Vercel
1. Import this repository in Vercel (framework preset: Vite - `vercel.json` already sets build and rewrites).
2. Add every variable from `.env.example` under **Settings -> Environment Variables**.
3. Deploy, then run `pnpm db:migrate` once from your machine (it talks to D1 directly).
4. Sign up with an email listed in `ADMIN_EMAILS` to get the Admin tab.

## Publishing notes
- **Admin -> Documents**: choose a PDF; the browser converts pages to images and uploads them as private files.
- Or from a machine that has the PDFs: `pnpm pdfs:upload` (all) / `pnpm pdfs:upload 11-dsa` (one).

## How the viewer protects documents
- The PDF is never uploaded or served. Each page is a private ImageKit image fetched by the server with a
  short-lived signed URL, watermarked with the reader's email, AES-GCM encrypted per view and painted on a canvas.
- Page requests need a signed-in session plus a 30-minute view token and are rate limited.
- Right-click, save/print shortcuts, text selection and printing are disabled; the page hides when the tab is not active.
- Limit: anything shown on a screen can still be photographed or screen-captured. The watermark makes leaks traceable.
