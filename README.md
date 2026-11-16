# UPSC - From Zero to IAS

Handwritten-style notebooks for the whole UPSC Civil Services syllabus plus a synchronized progress-tracker website.

| Folder | What it is |
|---|---|
| `notes/` | Markdown sources (`content/*.md`) and the builder that turns them into handwritten notebook PDFs |
| `pdfs/` | The built notebooks |
| `portal/` | Tracker website: Cloudflare Worker + D1 (progress sync, library) + ImageKit (file store) + admin CMS |

## Build the notebooks

```bash
cd notes && pnpm install && node build.mjs
```

## Run the tracker locally

```bash
cd portal && pnpm install && pnpm wrangler d1 execute resources --local --file=schema.sql && pnpm dev
```

`portal/.dev.vars` (not committed) must define `IMAGEKIT_PRIVATE_KEY` and `ADMIN_PASSWORD`.

## Deploy

```bash
cd portal
pnpm db:init                                  # creates the upsc_* tables in the D1 database "resources"
pnpm wrangler secret put IMAGEKIT_PRIVATE_KEY
pnpm wrangler secret put ADMIN_PASSWORD
pnpm run deploy
SITE=https://<worker-url> pnpm upload:pdfs    # PDFs -> ImageKit, registered in the library
```

The tracker's topic list is generated from the notebook headings (`pnpm gen`), so the website always matches the notes.
Admin CMS: `/admin.html`.
