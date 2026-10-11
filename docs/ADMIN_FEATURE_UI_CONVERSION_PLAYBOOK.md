# Admin Feature UI Conversion Playbook

> **Purpose:** Repeatable instructions for converting an external admin feature (e.g. Hotel Alabine The Oak) into SkinDx Bioc `admin` + `backend`.  
> **How to use:** For every new dashboard section the owner supplies, follow **Part 1** (universal process), then produce a feature-specific appendix (or separate `docs/FEATURE_<NAME>_IMPLEMENTATION.md`) using **Part 2** (template).  
> **Worked example:** [Part 3 — Company Basic Information](#part-3--worked-example-company-basic-information).  
> **Repos rule:** Treat supplied code as a **functional reference**, not architecture to copy. Preserve business behavior; rewrite to SkinDx conventions.

**Repo layout (verified):** `admin/`, `backend/`, `docs/`, `frontend/` (not `apps/admin`).

---

## Part 1 — Universal process (every future UI)

Use this same sequence for Gallery, Navbar, Webpages, Products, or any other supplied admin page.

### 1.1 Owner supplies source

Accept any of: pasted files, folder path, zip, or repo path. Prefer receiving related files together (UI + API + model + service), then convert **UI one file/section at a time** after the feature spec exists.

Minimum useful set:

| Layer | Typical Hotel / source files |
| --- | --- |
| Admin page/UI | `components/admin/pages/*.jsx` |
| API | `app/api/(admin)/.../route.js` |
| Model | `models/Admin/*.js` |
| Service | `services/*.service.js` |
| Optional | providers, upload helpers, related forms |

### 1.2 Inspect SkinDx first

Before planning changes, verify real paths in this repo:

| Area | Where to look |
| --- | --- |
| Project rules | `.cursor/rules/project.mdc`, `docs/ARCHITECTURE.md`, `DATABASE.md`, `API_CONTRACT.md`, `SECURITY.md`, `DESIGN.md`, `DO_AND_DONT.md`, `TESTING.md` |
| Admin nav / shells | `admin/src/config/sidebar.ts`, `admin/src/config/admin-modules.ts` |
| Admin routes | `admin/src/app/admin/[siteCode]/...` |
| Admin API client | `admin/src/services/api/` |
| Toasts | `admin/src/lib/toast` |
| Backend features | `backend/src/features/<feature>/` |
| Auth / site | `authenticate`, `authorize`, `requireSiteAccess` |
| Media | `backend/src/features/media`, Cloudinary `ALLOWED_FEATURE_FOLDERS` |
| Prisma | `backend/prisma/schema.prisma` |

Do not invent endpoints, models, or folders that do not exist.

### 1.3 Analyze supplied code (do not invent rules)

Document for the feature:

1. Purpose and workflows  
2. Pages / components / interactions  
3. Forms, fields, validation  
4. Entities and API operations  
5. Auth assumptions and media needs  
6. Dependencies and incomplete parts  

Mark **demonstrated** vs **implied/missing**. Put gaps in Unresolved Questions.

### 1.4 Spec first, then implement

For each feature:

1. **Docs-only:** Write or extend a feature appendix / `docs/FEATURE_<SLUG>_IMPLEMENTATION.md` using Part 2 sections A–Q.  
2. **Owner review.**  
3. **Implement** in the order in section O (DB → backend → tests → admin types/services → UI → nav → docs).  
4. **UI conversion:** Adapt Hotel JSX into SkinDx TypeScript components **one file or section at a time** as the owner provides them; match admin design system, never copy Hotel slate/`react-hot-toast`/relative Next API routes.

### 1.5 Always rewrite these Hotel patterns

| Hotel / external pattern | SkinDx replacement |
| --- | --- |
| Next.js Route Handlers in the same app | Express feature under `/api/v1/...` |
| Mongoose models | Prisma + PostgreSQL |
| Global single-tenant record | Site-scoped (`siteId` / `siteCode` `IN` \| `COM`) when data is per-website |
| `fetch('/api/...')` | `admin/src/services/api` Axios client + `endpoints.ts` |
| `react-hot-toast` | `admin/src/lib/toast` (`goey-toast`, top-center) |
| `/api/cloudinary` | `POST /api/v1/media/images?siteCode=&feature=<allowed>` |
| Image `{ url, key }` | `{ url, publicId }` |
| Unauthenticated admin APIs | JWT + `ADMIN`/`SUPER_ADMIN` + `requireSiteAccess` |
| Hotel slate-900 card theme | Existing admin teal/navy shell + white cards |
| Public React providers for storefront | Defer unless the task explicitly asks for storefront |

### 1.6 Non-negotiable SkinDx constraints

1. Next.js App Router + TypeScript (`admin`).  
2. Tailwind + shadcn/ui + Lucide.  
3. Existing Axios instance only.  
4. Zod on backend (and client UX schemas where useful).  
5. Express feature modules: routes / controller / service / repository / validation / types / tests.  
6. PostgreSQL + Prisma; no duplicate User/Site/Media models.  
7. Backend enforces auth and site scope (never trust client `siteId` / roles).  
8. Centralized logger; never log secrets, tokens, OTPs, full sensitive payloads.  
9. `goey-toast` only; success only after backend confirmation; no interceptor auto-success spam.  
10. Existing Cloudinary/media integration for uploads.  
11. Meaningful Jest + Supertest tests; disposable test DB; mock externals.  
12. No enquiry pages/nav unless the owner explicitly requests them.  
13. Do not fabricate endpoints or claim unrun tests passed.  
14. Incomplete modules use navigable shells until live — then flip `shell` → `live`/`active` in registry + sidebar.

### 1.7 Standard admin file shape (adapt names per feature)

```text
admin/src/
├── app/admin/[siteCode]/<feature-slug>/
│   └── page.tsx
├── components/<feature-slug>/
│   ├── <feature>-page.tsx
│   ├── <feature>-form.tsx / -table.tsx / ...
│   └── *.test.tsx
├── services/api/
│   ├── <feature-slug>.ts
│   └── endpoints.ts          # extend
├── types/<feature-slug>.ts
├── schemas/<feature-slug>-schema.ts
└── config/
    ├── admin-modules.ts      # shell → live
    └── sidebar.ts            # shell → active
```

```text
backend/src/features/<feature-slug>/
├── <feature>.routes.ts
├── <feature>.controller.ts
├── <feature>.service.ts
├── <feature>.repository.ts
├── <feature>.validation.ts
├── <feature>.types.ts
└── __tests__/
```

Prefer mounting site-scoped admin APIs on `admin.routes.ts` as:

`/api/v1/admin/sites/:siteCode/<resource>`

with `authenticate` + `authorize('ADMIN','SUPER_ADMIN')` + `validate` + `requireSiteAccess('siteCode')`.

### 1.8 Design system (every admin page)

- Use `AdminAppShell` / existing layout; dark teal sidebar unchanged.  
- Light main background; white content cards; teal primary actions.  
- Comfortable inputs; consistent radius/border/shadow with dashboard.  
- Lucide icons; accessible focus; responsive single-column on mobile.  
- No alternate theme hardcoded from the source project.

### 1.9 Cursor task prompts (copy/paste)

**A — Spec only (first message for a new feature)**

```text
Follow docs/ADMIN_FEATURE_UI_CONVERSION_PLAYBOOK.md Part 1–2.
Analyze the supplied source files for <FEATURE NAME>.
Create docs/FEATURE_<SLUG>_IMPLEMENTATION.md (sections A–Q).
Do not implement code yet.
```

**B — Implement after spec approval**

```text
Implement docs/FEATURE_<SLUG>_IMPLEMENTATION.md for admin + backend.
Follow Part 1 constraints and implementation order O.
```

**C — Convert next UI file**

```text
Convert this supplied UI file into SkinDx admin TypeScript components
per docs/ADMIN_FEATURE_UI_CONVERSION_PLAYBOOK.md and the feature MD.
Match admin design system; wire existing API/services only.
```

---

## Part 2 — Feature specification template (sections A–Q)

Every feature MD must include these sections. Fill with feature-specific facts; keep universal rules by reference to Part 1.

| Section | Contents |
| --- | --- |
| **A. Feature Overview** | Name, purpose, extracted behavior, expected SkinDx behavior, dependencies, scope/exclusions |
| **B. Existing Code Analysis** | Each supplied file: does / preserve / change / replace / issues |
| **C. Proposed File Structure** | Exact paths; new vs modify vs reuse; no junk files |
| **D. Frontend UI Specification** | Layout, hierarchy, fields, tables, dialogs, empty/loading/error, a11y |
| **E. Design System** | Point to Part 1.8; note any feature-specific layout only |
| **F. Routing and Navigation** | Route, IN/COM, sidebar group/label/icon, permissions, shell→live |
| **G. Frontend API** | Service functions, types, Zod, state matrix |
| **H. Backend API** | Methods/paths, auth, schemas, status codes; mark exists vs new |
| **I. Backend Module Responsibilities** | Thin controllers; service/repo/validation/tests |
| **J. Database** | Models, FKs, site ownership, migration notes — or “no DB changes” |
| **K. Site Separation and Authorization** | How isolation is enforced and tested |
| **L. Media** | Types/sizes/flow — or N/A |
| **M. Logging and Toasts** | Events; redaction |
| **N. Testing** | Frontend + backend unit/integration |
| **O. Implementation Order** | Adjust only if architecture requires |
| **P. Acceptance Criteria** | Checklist |
| **Q. Unresolved Questions** | Assumptions vs owner decisions |

Default implementation order (O):

1. Confirm existing models/APIs/shells  
2. Prisma changes (if any)  
3. Backend schemas + business logic  
4. Routes + middleware  
5. Backend tests  
6. Admin types + Zod  
7. Admin API services  
8. Page/components/forms  
9. Routes + sidebar/module status  
10. Loading/errors/logging/toasts  
11. Run tests/typecheck/lint/build; report actual results  
12. Update `API_CONTRACT.md` / `DATABASE.md` when needed  

---

## Part 3 — Worked example: Company Basic Information

This section is the first feature converted with this playbook. Future features should get their own `docs/FEATURE_<SLUG>_IMPLEMENTATION.md` using the same A–Q shape; keep this example as the reference pattern.

### A. Feature Overview

**Name:** Company Basic Information (`company-basic-info`)

**Purpose:** Site-scoped company profile (name, domain, phones, WhatsApp, emails, addresses, maps, social, SEO/tracking, three logos) for `IN` and `COM`.

**Hotel behavior (demonstrated):** Single admin form; GET latest / POST create / PUT update; Mongo model; cached read + metadata builder; Cloudinary upload; `react-hot-toast`.

**SkinDx expected:** `/admin/{in|com}/company-basic-info`; GET + PUT upsert; media `feature=branding`; `goey-toast`; auth + site isolation.

**Exclusions:** Storefront metadata/provider; public APIs; enquiries; env email branding rewrite; tracking-script rendering on storefronts.

### B. Existing Code Analysis (Hotel)

| File | Preserve | Change / replace | Issues |
| --- | --- | --- | --- |
| `route.js` | Field normalize; name required; 10-digit contacts | Express + Zod + auth + site upsert | No auth; POST duplicates; global latest PUT |
| `CompanyBasicInfo.js` | Field set; image + arrays | Prisma + `siteId` unique; `key`→`publicId` | No site ownership |
| `companyBasicInfo.service.js` | Serialization ideas | Backend service/repo; defer metadata | `console.error`; storefront-only helpers |
| `CompanyBasicInformation.jsx` | Sections, list fields, logo UX | TS + admin theme + Axios + goey-toast | Hotel styling; relative APIs |
| `CompanyBasicInfoProvider.jsx` | — | Defer (storefront) | Not needed for admin CRUD |

**SkinDx facts:** Shell already in sidebar/modules; `SiteSetting` unsuitable (no `siteId`); media `branding` folder exists; response envelope `sendSuccess`.

### C. Proposed File Structure

**Backend**

```text
backend/src/features/company-basic-info/
├── company-basic-info.routes.ts
├── company-basic-info.controller.ts
├── company-basic-info.service.ts
├── company-basic-info.repository.ts
├── company-basic-info.validation.ts
├── company-basic-info.types.ts
└── __tests__/
    ├── company-basic-info.service.test.ts
    └── company-basic-info.routes.test.ts
```

Modify: `schema.prisma`, migration, mount on `admin.routes.ts`, later `API_CONTRACT.md` / `DATABASE.md`.

**Admin**

```text
admin/src/
├── app/admin/[siteCode]/company-basic-info/page.tsx
├── components/company-basic-info/
│   ├── company-basic-info-page.tsx
│   ├── company-basic-info-form.tsx
│   ├── company-general-fields.tsx
│   ├── company-list-fields.tsx
│   ├── company-location-fields.tsx
│   ├── company-logo-uploader.tsx
│   ├── company-social-fields.tsx
│   ├── company-seo-fields.tsx
│   └── company-basic-info-skeleton.tsx
├── services/api/company-basic-info.ts
├── types/company-basic-info.ts
├── schemas/company-basic-info-schema.ts
└── config/ (admin-modules.ts, sidebar.ts, endpoints.ts)
```

### D. Frontend UI Specification

- `AdminAppShell`; header “Company Details” + Save (teal).  
- Hierarchy: Page → Form → General / Lists / Location / Logos / Social / SEO.  
- Fields: see table below. No table/pagination (single upsert).  
- Loading skeleton; empty defaults; inline validation; Alert + toast on errors; success toast after PUT.  
- Responsive 2-col → 1-col; accessible labels; remove buttons visible on focus (not hover-only).

| Field | Required | Notes |
| --- | --- | --- |
| `companyName`, `companyDomainName` | Yes | Trim |
| `contactNumbers[]` | 10 digits if present | `+91` display |
| `whatsappNumber` | Optional; 10 digits if set | |
| `emails[]`, `officeAddresses[]`, `keywords[]` | Optional | Validate emails when non-empty |
| Map / social / SEO / tracking | Optional | Tracking stored as text only in admin |
| `mainLogo`, `footerLogo`, `mobileUiLogo` | Optional | `{ url, publicId }` |

### E. Design System

Follow Part 1.8. Do not use Hotel `bg-slate-900` primary.

### F. Routing and Navigation

| Item | Value |
| --- | --- |
| Routes | `/admin/in/company-basic-info`, `/admin/com/company-basic-info` |
| Sites | Both `IN` and `COM` |
| Nav | Dashboard Home → “Company Basic Info” (`Building2`) |
| Status | `shell` → `live`/`active` when wired |
| Gates | Existing `RequireAuth` + `RequireSiteAccess` |

### G. Frontend API

```ts
endpoints.admin.companyBasicInfo = (siteCode) =>
  `/admin/sites/${siteCode}/company-basic-info`;

fetchCompanyBasicInfo(siteCode)           // GET
upsertCompanyBasicInfo(siteCode, body)    // PUT
```

DTO includes `id: string | null`, `siteCode`, all form fields, logos as `{ url, publicId }`, `updatedAt`.

### H. Backend API

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/v1/admin/sites/:siteCode/company-basic-info` | Defaults if none; **new** |
| `PUT` | same | Upsert by `req.site.id`; **new** |

No Hotel-style unauthenticated GET/POST create in wave 1. Statuses: 200 / 400 / 401 / 403 / 500.

### I. Backend Module Responsibilities

Thin controller; service normalizes + upserts; repository Prisma `findBySiteId` / `upsertBySiteId`; Zod validation; mount on `admin.routes.ts` with shared auth + `requireSiteAccess`.

### J. Database

Dedicated `CompanyBasicInfo` with unique `siteId` → `Site`. Logo URL/publicId columns; `String[]` for lists; `@db.Text` for map/tracking blobs. Do not use global `SiteSetting`.

```prisma
model CompanyBasicInfo {
  id                         String   @id @default(uuid()) @db.Uuid
  siteId                     String   @unique @map("site_id") @db.Uuid
  companyName                String   @default("") @map("company_name")
  companyDomainName          String   @default("") @map("company_domain_name")
  contactNumbers             String[] @default([]) @map("contact_numbers")
  whatsappNumber             String   @default("") @map("whatsapp_number")
  mainLogoUrl                String   @default("") @map("main_logo_url")
  mainLogoPublicId           String   @default("") @map("main_logo_public_id")
  footerLogoUrl              String   @default("") @map("footer_logo_url")
  footerLogoPublicId         String   @default("") @map("footer_logo_public_id")
  mobileUiLogoUrl            String   @default("") @map("mobile_ui_logo_url")
  mobileUiLogoPublicId       String   @default("") @map("mobile_ui_logo_public_id")
  emails                     String[] @default([])
  officeAddresses            String[] @default([]) @map("office_addresses")
  googleAddress              String   @default("") @map("google_address") @db.Text
  googleUrl                  String   @default("") @map("google_url")
  googleLink                 String   @default("") @map("google_link")
  facebookLink               String   @default("") @map("facebook_link")
  instagramLink              String   @default("") @map("instagram_link")
  youtubeLink                String   @default("") @map("youtube_link")
  googleMapLink              String   @default("") @map("google_map_link")
  googleTrackingTag          String   @default("") @map("google_tracking_tag") @db.Text
  titleTagForMainLandingPage String   @default("") @map("title_tag_for_main_landing_page")
  keywords                   String[] @default([])
  createdAt                  DateTime @default(now()) @map("created_at")
  updatedAt                  DateTime @updatedAt @map("updated_at")

  site Site @relation(fields: [siteId], references: [id], onDelete: Cascade)

  @@map("company_basic_infos")
}
```

### K. Site Separation and Authorization

`siteId` only from `req.site`; ignore body ownership fields; test IN/COM isolation and 401/403.

### L. Media

`POST /api/v1/media/images?siteCode=&feature=branding`. Clear refs on remove; hard-delete Cloudinary orphan cleanup is follow-up.

### M. Logging and Toasts

Log site/user/record ids only. Toasts: load/upload/save errors; save/upload success after API OK. `goey-toast` only.

### N. Testing

Backend: normalize, upsert, validation, auth, site isolation (Supertest + test DB).  
Frontend: validation, render, save payload, loading/error, siteCode in calls.

### O. Implementation Order

Follow Part 2 default order for this slug; convert Hotel UI sections incrementally after API exists.

### P. Acceptance Criteria

- [ ] Both sites openable from sidebar; live (not shell)  
- [ ] Admin design system (not Hotel slate)  
- [ ] Site-scoped GET defaults + PUT upsert; cross-site blocked; 401 without auth  
- [ ] Name/domain required; phone rules; logos via media API  
- [ ] `goey-toast` success only after confirm; no secrets in logs  
- [ ] Tests/typecheck/lint/build reported with actual results  
- [ ] API/DB docs updated when code lands  

### Q. Unresolved Questions (company info)

**Assumptions:** One row per site; PUT-only; both sites; `publicId` naming; tracking text stored only; domain free text; no admin provider.

**Ask owner if needed:** Sync domain to `Site.domain`? WhatsApp required? Allow raw HTML/scripts in map/tracking fields? Delete old Cloudinary on replace? Restrict to SUPER_ADMIN? Drop Google review widget field?

---

## Part 4 — Registry of converted features

| Feature | Spec location | Status |
| --- | --- | --- |
| Company Basic Information | Part 3 of this playbook | Implemented in `admin` + `backend` + `.in` storefront provider/SEO |
| *(next feature)* | `docs/FEATURE_<SLUG>_IMPLEMENTATION.md` | — |

When a new feature is specified, add a row here and link its MD.

---

## Confirmation

This playbook is documentation. It does not by itself implement features, migrate the database, or change runtime admin/backend code. Implementation happens only in a follow-up task that explicitly asks to implement a feature MD.
