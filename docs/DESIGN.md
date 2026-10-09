# Design System
## SkinDx Bioc websites

## 1. Visual direction

Use the supplied ecommerce screenshots as structural inspiration, not as a literal brand copy. The reference uses a white canvas, a compact announcement/header area, a strong full-width hero, service/benefit strips, editorial split sections, product rails, promotional tiles, and grouped product lists.

Adapt that structure for a trustworthy skincare / biomedical / pharmaceutical brand:
- Clean, clinical, premium, calm, and evidence-led.
- Prioritize legibility and product information over decorative effects.
- Use authentic product/lab/ingredient imagery approved by the company.
- Avoid unsupported medical claims, before/after claims, or imagery implying guaranteed outcomes.
- `.in` can be more conversion-focused; `.com` can emphasize company credibility, product information, and enquiries.

## 2. Initial visual tokens

These are starting tokens inferred from the supplied reference and should be checked against the actual brand logo and product packaging. They are not a claim about official brand colors.

```css
:root {
  --color-background: #FFFFFF;
  --color-surface: #F6F7F8;
  --color-surface-warm: #F5EEE5;
  --color-text: #17191C;
  --color-text-muted: #626A73;
  --color-border: #E4E7EB;

  /* Adapted from the reference's teal hero and blue healthcare panels */
  --color-primary: #287F79;
  --color-primary-hover: #206A65;
  --color-secondary: #1D3B68;
  --color-accent: #7B4AA5;

  --color-success: #247547;
  --color-warning: #946200;
  --color-error: #B42318;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  --shadow-card: 0 4px 18px rgb(20 35 45 / 8%);
}
```

Use semantic tokens rather than scattering hex values through components. Confirm contrast ratios and adjust colors if needed for WCAG AA.

## 3. Typography

- Use a readable sans-serif family with reliable Devanagari support if Hindi content is later introduced.
- Suggested hierarchy: compact utility text, clear page heading, readable section headings, body copy, and small metadata.
- Avoid excessively thin text, tiny product descriptions, or all-caps body text.
- Use responsive type scales with `clamp()` where appropriate.
- Product names, price, pack size, and important usage/safety information must remain readable on mobile.

## 4. Layout and spacing

Use a consistent spacing scale based on 4px increments:

```text
4, 8, 12, 16, 24, 32, 48, 64, 80
```

- Main content max width: start around 1200–1320px and adjust after responsive testing.
- Desktop side padding: roughly 32–48px; tablet: 24px; mobile: 16px.
- Section spacing: 48–80px desktop, 32–48px mobile.
- Cards should have consistent alignment and enough space for product names and details.
- Avoid fixed heights for text-heavy content.
- Use responsive grids; do not shrink desktop layouts onto mobile.

## 5. Homepage composition inspired by the reference

Recommended `.in` sequence:
1. Slim announcement bar for a verified promotion or shipping message.
2. Main header with logo, primary navigation, search, account, wishlist, and cart.
3. Optional trust/benefit strip (only show claims the company can substantiate).
4. Hero banner with product/company visual, concise headline, short supporting copy, and one primary CTA.
5. Featured categories or product use-case tiles.
6. Bestsellers / featured products rail.
7. Split editorial section: company/product science or quality information.
8. Campaign/promotion area when a real campaign exists.
9. Recent products or curated collections.
10. Educational content / FAQs as appropriate.
11. Newsletter or contact CTA only with proper consent.
12. Comprehensive footer with policies, contact details, and company information.

Recommended `.com` sequence:
1. Brand header and clear navigation.
2. Company/product-focused hero with “Explore products” or “Make an enquiry”.
3. Company credibility, facilities, quality process, or capabilities—only if verified.
4. Product/category overview.
5. Featured product information with enquiry CTA.
6. Educational/resources section.
7. FAQ and enquiry form.
8. Footer with official company and policy information.

Do not force every section onto every page. Sections should be configurable and orderable in the CMS where useful.

## 6. Header and navigation

- Desktop: compact utility/announcement strip, primary header, then optional secondary navigation.
- Mobile: accessible menu drawer, visible search entry, and cart access for `.in`.
- Sticky headers are optional; avoid excessive vertical stacking.
- Active states must be obvious; all controls need keyboard focus styles.
- Use the correct domain's navigation and content. Avoid links that accidentally send users to the other site's equivalent page without clear intent.

## 7. Buttons and interaction

- Primary button: filled primary color with white text; use a clear verb such as “Add to cart”, “Continue to checkout”, or “Send enquiry”.
- Secondary button: outlined or neutral surface.
- Destructive button: semantic error styling and confirmation where appropriate.
- Target height: about 44–48px for primary touch controls.
- Padding: approximately 16–24px horizontal and 10–14px vertical, adapted to text and size.
- Button radius: 6–10px; do not use pill shapes everywhere.
- Include hover, focus-visible, active, disabled, loading, and error states.
- Do not use color alone to convey state.

## 8. Product cards

Each card should support, as applicable:
- Product image with consistent aspect ratio and object-fit behavior.
- Category or product type.
- Product name.
- Pack size/variant and price.
- Availability indicator only when accurate.
- Rating/review count only when genuine.
- Clear CTA or product-detail link.
- Optional wishlist control with accessible label.

Do not display fake reviews, fake discounts, invented stock counts, fake urgency timers, or unverified medical benefits. Images must have appropriate alt text. Avoid showing an “Add to cart” action for products that cannot be purchased on that site.

## 9. Images and media

- Use Cloudinary for managed media delivery and transformations.
- Prefer WebP/AVIF where supported and responsive image sizes.
- Define aspect ratios for banners and product cards to reduce layout shift.
- Keep source assets and Cloudinary public IDs/asset metadata where needed.
- Never embed provider secrets or unrestricted upload credentials in the frontend.
- Provide meaningful alt text; decorative images should have empty alt text.
- Admins should preview images and be able to manage alt text.

## 10. Component system

- Use shadcn/ui for accessible component primitives and own the project styling.
- Use Lucide React for icons; maintain consistent stroke size and icon dimensions.
- Prefer semantic HTML and reusable components.
- Use design tokens for color, spacing, radius, typography, borders, and shadows.
- Do not fork or duplicate the same primitive without a clear reason.
- Do not over-customize shadcn components in ways that remove keyboard or screen-reader behavior.

## 11. Responsive behavior

Test at minimum:
- Small mobile: 320–375px
- Large mobile: 390–430px
- Tablet: 768px
- Desktop: 1024px
- Wide desktop: 1440px and above

Mobile requirements:
- No horizontal overflow.
- Product grids collapse appropriately.
- Touch controls are comfortably sized.
- Navigation, cart, forms, and dialogs work without hover.
- Sticky elements do not obscure content or focus targets.

## 12. Accessibility and trust

- Target WCAG 2.2 AA.
- Use visible keyboard focus, semantic headings, labels, error descriptions, and accessible dialogs.
- Maintain sufficient text/background contrast.
- Never hide important safety, usage, or product qualification information behind tiny text.
- Clearly distinguish editorial content from medical advice.
- Use only business-approved and legally reviewed product claims.
- Ensure consent and privacy copy is visible at the point of data collection.

## 13. Design implementation rule

Before building a new page, inspect existing tokens and components first. Implement responsive states and loading/empty/error states along with the happy path. Do not invent the final logo, brand palette, product claims, or imagery if official assets/content have not been supplied.
