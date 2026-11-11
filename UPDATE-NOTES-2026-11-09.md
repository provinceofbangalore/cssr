# CSSR.IN Revision — 9 November 2026

## Requested updates, completed

1. **Official emblem** — the first image provided in this revision was copied verbatim to `client/public/assets/images/cssr-official-emblem.png`. It is referenced in the public header, admin sidebar, admin login, client default settings, and the Prisma seed defaults. To apply to a previously seeded database, run `npm run db:seed` after configuring the environment. The seed intentionally updates `logoUrl` to the new emblem.
2. **Typography** — body copy, paragraphs, article text and most interface content are set to 14px. Larger headings preserve the visual hierarchy.
3. **Homepage spacing** — expanded spacing in hero, mission tiles, ministry band, journey strip, news section, call-to-action and footer. Responsive values included.
4. **Footer** — rebuilt as responsive Bootstrap columns and a horizontal secondary navigation bar. The developer credit now reads: **Developed & maintain by [SheStrong Technology Services](https://shestrong.in)**.
5. **Genuine Bangalore Province stories** — `client/src/verified-news.json` holds 5 factual, dated items with source URLs. This file powers offline frontend fallback and is imported by the Prisma database seed, so production records match the fallback content.

## Blog attribution and publication note

All articles are short *paraphrased summaries* drawn from published news reports, with a link to each original source within the article body. The included photos are pre-existing illustrative website design assets: **they are not authenticated photographs of the particular events**. Replace each illustrative image with permission-cleared event photography in the CMS before public launch.

Sources:
- https://www.cssr.news/2026/10/india-thirty-five-lay-partners-in-mission-welcomed-into-the-redemptorist-family/
- https://www.cssr.news/2026/09/india-redemptorists-hold-first-joint-media-venture-of-three-indian-units-in-bangalore/
- https://www.cssr.news/2026/06/india-a-time-to-relax-and-refresh-redemptorist-formees-gathering-2026-province-of-bangalore/
- https://www.cssr.news/2026/03/india-beloved-2026-a-three-day-residential-retreat-for-the-youth-at-nava-spoorthi-kendra-bangalore/
- https://www.cssr.news/2026/01/india-inauguration-of-jeevanodhaya-a-mission-house-in-karnataka-state/

## Setup

```bash
npm install
cp server/.env.example server/.env
# Set MySQL DATABASE_URL, JWT_SECRET, ADMIN_EMAIL and unique ADMIN_PASSWORD in server/.env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

- Public site: http://localhost:5173
- Admin login: http://localhost:5173/admin/login

## Validation performed

- Parsed 19 JS/JSX files with the TypeScript compiler syntax parser: no syntax errors.
- Parsed the main CSS stylesheet with PostCSS: success.
- Node `--check` passed for Prisma seeding and the Express server.
- Dependency installation could not be completed in the execution environment, so a live React build and MySQL test were not performed. Run `npm install` and setup steps on a network-connected development machine.
