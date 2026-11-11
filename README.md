# CSSR.IN — Redemptorists Bangalore Province

**Full source project:** React 18 + Vite + Bootstrap 5, Node.js + Express, Prisma ORM + MySQL. Public website and secure admin CMS.

## November 2026 website revisions

- Header uses the exact newly supplied CSSR emblem (`client/public/assets/images/cssr-official-emblem.png`). Both the frontend fallback and `logoUrl` CMS setting are updated. Rerun `npm run db:seed` after updating an existing install to switch the saved logo reference; the CMS can later override the logo in Settings.
- Paragraph and readable interface copy is set to a consistent 14px; headings retain their proper hierarchy. Homepage sections now have more generous vertical spacing.
- Footer rewritten using a responsive grid. Bottom row contains horizontal navigation and **Developed & maintain by SheStrong Technology Services** with a direct link to https://shestrong.in.
- Five **verified Bangalore Province news items** are provided in `client/src/verified-news.json` and seeded as published blog records. Short summaries are editorially rewritten, with direct links to the full original reports at `cssr.news`. The pictures are **illustrative from the existing design**, not authenticated photography of the cited events. Replace them with permission-cleared photos from the events before public launch.
- Seed routine adds missing news records without overwriting existing posts/edits. The frontend displays the same source-verified stories when the API is unreachable for a design preview.

## What's implemented

- Homepage faithful to supplied design: top stripe, logo and dropdown navigation, slideshow, ministry cards, mission highlight, steps, community stories and footer.
- Public pages and nested navigation, blog/news listing and articles, prayer and saints pages, search, contact enquiry form and Google Maps embed.
- Admin login and dashboard with **real database statistics and visitor charts**.
- Admin management of pages, blogs, menus, banners, media, users, roles, permissions, messages and settings.
- Edit/create screens use a **60%-width offcanvas drawer on desktop**, Bootstrap validation, toast notifications and delete-confirmation dialogs.
- Page and blog bodies use a CKEditor 5 rich-text editor with a GPL license key. Ensure the project is distributed under compatible terms or use a commercial CKEditor license key.
- Pages and blogs have language-specific content for English, Hindi and Kannada; English is used as fallback until translations are supplied.
- Server-side RBAC, hashed passwords, HTTP-only JWT cookie, CSRF and origin checks, login rate limits, audit trail, upload validation, Zod validation and HTML sanitization.
- Seed data imports **complete user-provided text** for History, What We Do, Saints, prayers and Join Us from the earlier design package.

## Requirements

- Node.js 20.19+ or 22+
- MySQL 8.0+
- npm 10+

## Setup

```bash
# 1. Run inside the extracted project folder
npm install

# 2. Create database and dedicated MySQL user
mysql -u root -p
# CREATE DATABASE cssr_cms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
# CREATE USER 'cssr_user'@'localhost' IDENTIFIED BY 'a-unique-database-password';
# GRANT ALL PRIVILEGES ON cssr_cms.* TO 'cssr_user'@'localhost';
# FLUSH PRIVILEGES;
# exit

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with DATABASE_URL, long JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD.
# Also set CLIENT_ORIGIN=http://localhost:5173 and COOKIE_SECURE=false in local development.

# 4. Generate Prisma client and create MySQL tables
# npm install generates Prisma Client automatically; this command can be rerun if needed.
npm run db:generate
npm run db:push

# 5. Import the pages, menus, roles and first administrator (idempotent)
npm run db:seed

# 6. Start both Vite and API servers
npm run dev
```

Website: **http://localhost:5173**
Admin login: **http://localhost:5173/admin/login**
API health: **http://localhost:4000/api/health**

> The seed refuses to create an administrator with a default or weak password. Provide your own credentials in `server/.env`. Don't commit that file.

## Production deployment

1. Build client with `npm run build`. Host `client/dist` via Nginx with SPA fallback (`try_files $uri $uri/ /index.html`).
2. Run the API (`npm run start -w server`) behind the same HTTPS origin as the website; reverse proxy `/api/` and `/uploads/` to port 4000.
3. Set `NODE_ENV=production`, strong `JWT_SECRET`, `COOKIE_SECURE=true`, and `CLIENT_ORIGIN=https://cssr.in` in `server/.env`.
4. Configure daily MySQL backups, log monitoring, and durable upload storage/backups. For multiple API replicas, move uploads to object storage.
5. For schema upgrades in a managed production environment, convert the schema into reviewed Prisma migrations. `db push` is intended for initial development, not as a substitute for versioned production migration practice.
6. Update logo, photographs, contact details and content after verifying publication rights and accuracy.

## Important content notes

- History, Saint, Prayer, What We Do, and Join Us contents were taken from the supplied original files, with formatted HTML paragraphs for editing.
- Vision & Mission, Parish directory, Communities directory, Blesseds biographies and Donation are **DRAFT** until confirmed source material is provided. The production site does not present invented payment details or false addresses.
- Initial homepage story cards are visual samples **only**; published blog entries are managed in the database.
- Illustrations cropped from the user's supplied mockup are used for matching the design and should be replaced with licensed original photographs prior to launch.
- Multilingual framework is implemented; translations must be written/imported through the admin editor.
- Local visitor reporting counts page views, not unique visitors. Third-party web analytics are not configured.

## Project structure

```
client/             React + Vite frontend, Bootstrap UI
  public/assets/    Logo and design-reference photos
  src/pages/        Public pages, blog, search, contact
  src/admin/        Admin dashboard, management, reports
server/             Express API and authentication
  src/index.js      API routes and middleware
  prisma/           MySQL schema, database seed, source content
  uploads/          Local media uploads (gitignored)
docs/               Implementation notes and screenshot reference
```

See `docs/ARCHITECTURE.md` for API, roles, security and page-content details.
