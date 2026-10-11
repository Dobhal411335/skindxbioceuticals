# Feature: Manage Navbar

> Converted from Hotel Alabine The Oak per [ADMIN_FEATURE_UI_CONVERSION_PLAYBOOK.md](./ADMIN_FEATURE_UI_CONVERSION_PLAYBOOK.md).

## A. Feature Overview

**Name:** Manage Navbar (`manage-navbar` / `navbar-sections`)

**Purpose:** Site-scoped primary navigation sections with optional nested dropdown links for `IN` and `COM`.

**Hotel behavior:** CRUD on `NavbarSection` with embedded `subSections`; title/url/order/active; public navbar filters active items.

**SkinDx expected:** Admin CRUD under `/admin/{in|com}/manage-navbar`; Express APIs with auth + `requireSiteAccess`; public read of active sections for storefront header/mobile nav.

**Exclusions:** Media uploads; enquiry pages; inventing medical claims in nav labels.

## B. Existing Code Analysis (Hotel)

| File | Preserve | Change / replace |
| --- | --- | --- |
| `NavbarSection.jsx` | Form + table workflows, nested links | TS + admin theme + Axios + goey-toast |
| `navbar-sections/route.js` | Field normalize, CRUD verbs | Express + Zod + auth + site scope |
| `NavbarSection.js` | title/url/active/order + subSections | Prisma models with `siteId` |
| `Navbar.jsx` | Active filter, order sort, dropdowns | Wire SkinDx `site-header` / `mobile-nav` |

## C. Proposed File Structure

Backend: `backend/src/features/navbar-sections/` (routes, controller, service, repository, validation, types, tests).

Admin: `admin/src/app/admin/[siteCode]/manage-navbar/page.tsx` + `components/manage-navbar/*` + services/types/schemas.

Frontend: `frontend/src/features/navbar-sections/*` + provider; update `site-header.tsx` / `mobile-nav.tsx`.

## D–Q

See playbook Part 2. Key decisions:

- **API:** `GET/POST /admin/sites/:siteCode/navbar-sections`; `PUT/PATCH/DELETE .../:sectionId`; public `GET /sites/:siteCode/navbar-sections` (active only).
- **DB:** `NavbarSection` + `NavbarSubSection` with FK; cascade delete; indexes on `(siteId, order)`.
- **Auth:** JWT + ADMIN/SUPER_ADMIN + `requireSiteAccess`; `siteId` from `req.site` only.
- **Media:** N/A.
- **Storefront:** Fallback to static `navLinks` when API empty/unavailable.
