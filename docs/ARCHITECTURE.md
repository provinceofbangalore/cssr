# CSSR.IN implementation notes

## Visual design
Color palette: deep navy `#053f5b`, teal `#086762`, off-white `#f4f8f7`, coral `#ff9b83`.
The public website follows the uploaded composite reference: dark utility bar, large logo/navigation header, left-text/right-image hero, teal quick-strip, mission cards, St. Alphonsus feature panel, steps, community stories, dark footer.
Admin uses left navy sidebar, top utility bar, KPI cards, visitor chart, donut chart and content tables.

## Data models
- `User` ↔ `UserRole` ↔ `Role` ↔ `RolePermission` ↔ `Permission`: granular role-based access.
- `Page` / `PageTranslation`: pages with URLs, status, and locale-dependent title/summary/body.
- `Blog` / `BlogTranslation`: blogs with category, status, image, publication date and translations.
- `MenuItem`: top-level and nested links in a self-referencing tree.
- `HomeSlide`: homepage carousel slides, image and action link.
- `SiteSetting`: brand and map/contact details.
- `Inquiry`: submitted form messages and response triage status.
- `Media`: uploaded assets with sanitized server filename.
- `DailyVisit`: page-view totals by day.
- `AuditLog`: editor activity across mutations.

## API routes
Public: `GET /api/public/site`, `GET /api/public/pages`, `GET /api/public/page/*`, `GET /api/public/blogs`, `GET /api/public/blog/:slug`, `GET /api/public/search?q=`, `POST /api/public/contact`, `POST /api/public/visit`.

Auth: `GET /api/auth/csrf`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`.

Admin: `GET /api/admin/dashboard`, `GET /api/admin/reports`, resource CRUD `GET/POST /api/admin/{pages|blogs|menus|slides|users|roles|permissions|inquiries|settings|media}`, `PUT/DELETE /api/admin/{resource}/:id`, `POST /api/admin/media/upload`.

## Authentication and permission guidelines
- Passwords hashed with bcrypt (cost factor 12).
- JWT with 8-hour expiry stored in HTTP-only Secure (production) SameSite=Lax cookie.
- Mutating requests guarded by per-browser CSRF token and origin verification. Public inquiry uses honeypot + rate limiting.
- Backend checks permissions for every admin resource operation. Client UI additionally hides unauthorized controls.
- Set a unique password and 32+ character JWT_SECRET; do not commit `.env`.
- API sanitizes HTML before storing. Client also applies DOMPurify when displaying.
- Prefer production reverse proxy over exposing port 4000 externally. Set HTTPS and rate limits at reverse proxy too.

## Content completion
The source document files are preserved under `server/prisma/*.txt` and seeded into specific pages. Unapproved sections are left in DRAFT; source documents included some `Attachment.png` placeholders without the original embedded pictures. Photos and logos copied/cropped from supplied references must be checked for permission before publication. The platform does not process donations and does not invent official payment methods.
