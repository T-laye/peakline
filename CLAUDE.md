# Peakline

Ghana-focused digital wallet & merchant payment platform (USDC on Stellar testnet).
Product brief lives outside the repo — ask the user for `PEAKLINE Brief.pdf` if you need scope detail.

## Monorepo layout

Turborepo + pnpm. Deliberate decisions (don't re-litigate without asking):

```
apps/
  web/        landing, marketing, auth, AND the full app — individual dashboard
              today (`src/app/(dashboard)/*`), merchant capability folding into
              the same app rather than a separate one (see below)
packages/
  ui/                 shared design system (@repo/ui) — components, tokens, assets
  eslint-config/
  typescript-config/
```

- **One app, not one-per-surface** — revised from an earlier plan (this repo's git
  history/CLAUDE.md once described separate `apps/dashboard`/`apps/merchant`; neither was
  ever actually started, and the individual dashboard was built straight into `apps/web`
  instead). Merchant follows the same precedent: no `apps/merchant`. Merchant capability is
  **permission-gated within `apps/web`**, keyed off the account's `customerType`
  (`"individual" | "merchant"` — chosen at `/auth/sign-up/account-type`, persisted via the
  real `PATCH /auth/customer-type`, read back from `authStore`). A merchant account sees
  additional nav items/routes an individual doesn't; there's no separate deployment, domain,
  or login for it. Concrete gating mechanism (route guards vs. nav-item visibility vs. both)
  isn't decided yet — resolve it when the first merchant-only screen actually gets built,
  not preemptively.
- **Auth lives in `apps/web`** (still true — nothing to redirect *to* anymore, since
  dashboard/merchant are this same app now).
- **No admin app** in the MVP (not in the brief's P0/P1 scope).

## Form/data stack (apps, not `packages/ui`)

Every form uses **react-hook-form** + **zod** (`@hookform/resolvers/zod`) for validation,
and **TanStack Query** for submissions/API calls (currently stubbed `fakeRequest` mutations
in each feature's `hooks/index.ts` — swap the `mutationFn` for a real call when the backend
exists, nothing else about the component needs to change). **zustand** handles cross-step
client state that shouldn't go in a URL (e.g. `signUpFlowStore` carries the phone number
from Sign Up to Verify — session-storage-persisted via `zustand/middleware`'s
`createJSONStorage`, not hand-rolled).

The shared `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` primitives
live in `@repo/ui/form` (shadcn's canonical RHF wiring, adapted to our `Label`/`HelperText`).
`FormItem` generates its own id via `React.useId()` — don't expect `#sign-up-email`-style
hardcoded ids on fields wired through `FormField`; target `input[name="..."]` instead.

## Design system (`packages/ui`)

All tokens are in `packages/ui/src/styles/globals.css`. Apps consume it with two lines
in their own `globals.css` (`@import "@repo/ui/globals.css"` + an `@source` pointing at
`packages/ui/src` so Tailwind scans the package for classes).

- **Colors** — exact values from the Figma file. `primary-*` (forest emerald 100–900),
  `secondary-*` (gold 100–900), `neutral-*` (green-black 100–900). `success`/`danger`/
  `warning`/`info` are Tailwind's green/red/yellow/blue ramps (50–900). Body text uses a
  dedicated ink color `#131927` (`--foreground`), not `neutral-900`.
- **Type scale** — exact Figma spec, weight + line-height baked into each token, so
  `className="text-b2"` alone gives the right size *and* weight:
  `text-h1`–`text-h5`, `text-s1`/`s2`, `text-b1`–`text-b4`, `text-c1`–`text-c3`,
  `text-label`, and a separate button scale `text-btn-giant`→`text-btn-tiny`.
- **Font** is DM Sans, loaded per-app via `next/font/google` as `--font-dm-sans`.
- **Payment states** map to fixed tokens everywhere they appear:
  Pending→warning, Processing→info, Completed→success, Failed→destructive, Cancelled→neutral.

## Landmines (each of these cost real debugging time)

1. **`cn()` must stay `extendTailwindMerge`d.** tailwind-merge doesn't know our custom
   `text-*` size tokens are font-sizes, so it classifies them as *colors* and silently
   drops whichever color class comes first — e.g. `text-primary-foreground` vanishing off
   a button, leaving black text. The custom scale is registered under `font-size` in
   `packages/ui/src/lib/utils.ts`. Don't replace it with a plain `twMerge`.
2. **pnpm strict linking**: any package whose bare specifier is imported directly in a file
   must be a dependency of *that file's own* package. `lucide-react` is a dep of both
   `@repo/ui` and `apps/web` for this reason. Same trap applies to `next/*` imports — that's
   why font loading stays in each app's own `layout.tsx` rather than in `packages/ui`.
3. **Restart the dev server after `pnpm install`.** Turbopack resolves `node_modules` at
   startup and won't see newly linked packages, producing bogus "Can't resolve X" errors.
4. **Toasts render the actual `Alert` component** via `toast.custom()` (see
   `packages/ui/src/sonner.tsx`). Sonner's own close button can't be reordered through
   `classNames`, so styling a lookalike drifts. Don't re-implement the toast visual.
5. **Every `<form>` using `form.handleSubmit(...)` needs `noValidate`.** Without it, the
   browser's native HTML5 constraint validation (e.g. `type="email"` format checking)
   intercepts the submit event and silently blocks it *before* react-hook-form/zod ever
   run — no console error, no `aria-invalid`, nothing. It only shows up when a field like
   email is non-empty AND malformed, which makes it look like an intermittent React/zod bug
   rather than a missing HTML attribute. Cost real time to trace back to the actual cause —
   see the fix across all four auth forms for the pattern.

## Conventions

- Feature-based structure inside apps: `src/features/<domain>/components/`, page files in
  `src/app/**` stay thin and just render the feature component.
- Shared visual shells live in `src/components/layouts/` (e.g. `AuthLayout`).
- Full-page states reuse `StatusPage` from `@repo/ui` (error + not-found), and the
  indeterminate `LoadingBar` for `loading.tsx`.
- Verify UI changes against the **running app** (Playwright is available in the scratchpad),
  not just a successful build — several bugs this project hit compiled perfectly fine.

## Known issues

- `packages/ui/src/assets/illustrations/auth/*.svg` are ~1.9MB each (vector wrappers around
  embedded base64 PNGs). The brief calls for fast-loading mobile pages — these should be
  re-exported as true vector or compressed WebP.
- Auth screens (sign in / sign up / verify-otp / personal-details) were built to sensible
  defaults, **not** to a Figma mockup — the design images could never be transferred in the
  session that built them. Reference designs are in `../images_for_dev/`. Verify against
  those before treating the auth UI as final.
