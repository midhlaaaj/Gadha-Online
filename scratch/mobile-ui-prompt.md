# Prompt: Mobile-Responsive UI for Tutoboard

## Context
Tutoboard is a Next.js 16 + Tailwind 4 + Supabase app. It currently has a desktop-first UI across four areas. We need mobile-responsive layouts for **three of them** — the admin panel (`src/app/admin/**`) is explicitly **out of scope** and must not be touched.

In scope:
1. **Home / marketing site** — `src/app/page.tsx`, `courses`, `courses/[id]`, `sessions`, `sessions/[id]`, `mentors`, `mentors/[id]`, `bookings`, `my-children`, `profile`, plus shared components `src/components/Navbar.tsx`, `AuthModal.tsx`, `BookingModal.tsx`, `UserNotificationBell.tsx`.
2. **Parent dashboard** — `src/app/dashboard/**` (`overview`, `classes`, `assignments`, `attendance`, `messages`, plus `_components/DashboardSidebar.tsx` and `_components/ChildSwitcher.tsx`).
3. **Student dashboard (LMS)** — `src/app/lms/**` (`overview`, `courses`, `classes`, `assignments`, `resources`, `performance`, `messages`, `bookings`, plus `_components/StudentTopbar.tsx` and the LMS sidebar).
4. **Mentor dashboard** — `src/app/mentor/**` (`overview`, `classes`, `students`, `attendance`, `assignments`, `availability`, `earnings`, `resources`, `messages`, `profile`, plus `_components/MentorSidebar.tsx`).

## Approach
This is a **responsive retrofit**, not a separate mobile app or separate routes. Keep every existing route and component; add Tailwind breakpoint classes and mobile-specific layout branches (e.g. conditional rendering of a bottom nav vs. a sidebar) so the same page adapts across viewport widths. Use Tailwind's default breakpoints, mobile-first (`sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`) — treat `<768px` as the "mobile" target to design and test against, with `md:` and up preserving the current desktop layout.

## Navigation patterns (decided)

### Home / marketing site
Already has a hamburger + slide-down drawer pattern in `Navbar.tsx` (`mobileMenuOpen` state, lines ~328-410) — this is the right pattern, keep it. Audit it for:
- Consistent spacing/touch-target sizing (min 44px tap targets) across all drawer links.
- The auth dropdown pattern (`dropdownOpen`, lines ~231-309) is desktop-only right now — mobile currently shows profile links inline in the drawer instead (lines ~382-410). Confirm this dual pattern (drawer duplicates dropdown content) stays consistent as new links are added — don't let the two lists drift out of sync.
- `AuthModal.tsx` and `BookingModal.tsx` need to become full-screen sheets on mobile (see Modals section below).

### Parent / Student / Mentor dashboards
Replace the persistent desktop sidebar (`DashboardSidebar.tsx`, `StudentTopbar.tsx` + its sidebar, `MentorSidebar.tsx`) with a **fixed bottom tab bar** on mobile (`<768px`), showing 4-5 primary destinations per role:
- **Parent**: Overview, Classes, Assignments, Attendance, Messages (pick the 4-5 most-used; fold the rest into a page reachable from the top bar, not a bottom tab).
- **Student (LMS)**: Overview, Courses, Classes, Assignments, Messages.
- **Mentor**: Overview, Classes, Students, Messages, Earnings (or similar — Attendance/Assignments/Availability/Resources/Profile move elsewhere if they don't fit).

Each dashboard also gets a **slim top bar** on mobile containing: page title/logo, any contextual control (e.g. `ChildSwitcher.tsx` for parents), and the user's **avatar on the right**. Tapping the avatar opens a dropdown (same interaction pattern as the home Navbar's profile dropdown) containing: Profile, role-specific links that didn't fit in the bottom tabs (e.g. Attendance, Resources, Availability, Performance, Profile settings), and Sign out. Do not put Sign out in the bottom tab bar.

Bottom tab bar requirements:
- Fixed position, safe-area-aware (respect `env(safe-area-inset-bottom)` for iOS home indicator).
- Active tab visually distinct (icon + label), using `@tabler/icons-react` icons already used in the sidebars.
- Add bottom padding to page content (`pb-[…]`) so the tab bar never overlaps content, including scrollable lists.

## Tables, lists, and data-heavy views
No single global rule — decide per page:
- Simple record lists (e.g. a booking list, a simple attendance log) → collapse into stacked cards with label/value pairs, one card per row, on `<768px`.
- Wide/complex grids (e.g. a full schedule grid, multi-column earnings breakdown) → keep the table structure and let it scroll horizontally inside its own `overflow-x-auto` container; never let the page itself scroll horizontally.
- Whichever you choose per page, make sure it's still scannable one-handed and doesn't require horizontal scrolling to read a single row's core info (id/name/status should always be visible without scrolling).

## Modals and forms
All modals (`AuthModal.tsx`, `BookingModal.tsx`, and any dashboard forms reused from admin-style components) become **full-screen sheets on mobile**: on `<768px`, the modal expands to fill the viewport (or slides up from the bottom covering the full screen) instead of a centered floating dialog with a backdrop. Keep the centered-dialog behavior unchanged at `md:` and above. Ensure:
- A clear, large close/back affordance (top-left X or back arrow) since there's no backdrop to tap-dismiss on a full-screen sheet.
- Forms inside scroll internally with a sticky submit button/footer, so long forms (e.g. booking flow steps) don't hide the primary action below the fold.

## Typography scale (mobile, `<768px`)
The codebase uses arbitrary pixel sizes (e.g. `text-[22px]`, `text-[18px]`) rather than Tailwind's named scale — keep that convention, but standardize the values below across all three dashboards so hierarchy is consistent:
- **Page title (h1)**: 20-22px, `font-extrabold font-heading` — unchanged from current usage (e.g. `dashboard/overview/page.tsx:308`).
- **Section title (h2)** — e.g. "Upcoming Classes", "Recent Activity", "My Students": **16-18px, `font-extrabold font-heading`**. Audit existing instances that currently use 20-22px for what is functionally a section header (not a page header, e.g. `dashboard/overview/page.tsx:280`) and bring them down into this range so section titles read distinctly smaller than the page h1 at small widths.
- **Card/list item title**: 14-16px, `font-semibold`.
- **Body/meta text**: 13-14px, regular weight.
This is a hard rule, not a per-page judgment call — apply it consistently across parent, student, and mentor dashboards.

## Visual language
No external design reference — derive everything from the existing desktop Tailwind theme (colors, fonts, border radii, shadows already used in `Navbar.tsx` and the dashboard sidebars, e.g. `#0f2347` primary, `#ffc107` accent, `rounded-2xl`/`rounded-full`, existing shadow/animation utility classes). Mobile should feel like the same product at a smaller size, not a re-skin.

## Explicit exclusions
- Do **not** touch `src/app/admin/**` — no mobile treatment needed there.
- Do not introduce new routes/pages for mobile — everything renders from the existing routes with responsive classes and conditional layout components.
- Do not change desktop (`md:` and up) behavior or visuals — this is additive.

## Suggested execution order
1. Shared primitives first: a `BottomNav` component (parameterized per role), a `MobileTopBar`/avatar-dropdown component, and a full-screen sheet variant for the existing modal wrapper(s).
2. Wire `BottomNav` + top bar into the three dashboard layouts (`dashboard/layout.tsx`, `lms/layout.tsx`, `mentor/layout.tsx` — confirm actual layout file names), hiding the desktop sidebar at `<768px` and hiding the bottom nav at `md:` and up.
3. Go page-by-page within each dashboard, fixing table/list/card layout at `<768px`.
4. Update `Navbar.tsx`, `AuthModal.tsx`, `BookingModal.tsx` for the marketing site.
5. Sweep remaining marketing pages (`courses`, `mentors`, `sessions`, detail pages, `my-children`, `profile`) for responsive layout issues (grid columns collapsing, font scaling, image sizing).
6. Manually test at common widths (375px, 390px, 428px) using dev tools device emulation for every route touched, including modal open states and bottom-nav overlap.

## Acceptance criteria
- Every in-scope route is usable and free of horizontal page-scroll or overlapping/clipped elements at 375px width.
- Bottom tab bar present and functional on all three dashboards at `<768px`, absent at `md:`+.
- Avatar dropdown on dashboards mirrors the home Navbar's dropdown pattern and includes Sign out.
- All modals become full-screen sheets at `<768px` and remain centered dialogs at `md:`+.
- No changes to `src/app/admin/**` or to desktop-width behavior anywhere.
