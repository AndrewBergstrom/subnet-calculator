# Contributing

## Development Setup

### Prerequisites

- **Node.js** 20+ (22 recommended)
- **npm** 10+

### Getting started

```bash
git clone https://github.com/AndrewBergstrom/subnet-calculator.git
cd subnet-calculator
npm install
npm run dev
```

The dev server starts at [http://localhost:5173](http://localhost:5173) with hot module replacement (HMR).

### Available commands

| Command          | Description                          |
|-----------------|--------------------------------------|
| `npm run dev`    | Start dev server with HMR           |
| `npm run build`  | Build for production to `dist/`     |
| `npm run preview`| Preview production build locally    |
| `npx tsc --noEmit` | Type-check without emitting files |

## Code Organization

```
src/
├── types.ts        # All TypeScript interfaces (SubnetNode, Group, CloudMode, AppState)
├── store.ts        # Zustand store — all state and mutations
├── constants.ts    # Color palette, cloud reserve counts
├── lib/            # Pure utility functions (no React, no state)
│   ├── subnet-math.ts   # IP/subnet calculations
│   └── export.ts        # JSON serialization
└── components/     # React components (one component per file)
```

### Conventions

- **One component per file.** Component name matches filename.
- **Colocation.** Component-specific logic lives in the component file, not extracted into hooks or utils unless shared.
- **Pure functions in `lib/`.** No side effects, no state, no React imports. Easy to test.
- **State in `store.ts`.** All mutations go through Zustand actions. Components read state with selectors.
- **CSS via Tailwind utilities.** No CSS modules, no styled-components. Custom CSS is only in `app.css` for theme variables and animations.

### Naming

- Components: `PascalCase` (e.g., `SubnetRow.tsx`)
- Functions and variables: `camelCase`
- Types and interfaces: `PascalCase`
- CSS custom properties: `--color-kebab-case`
- Files in `lib/`: `kebab-case.ts`

## Adding a Feature

1. **Types first.** If the feature needs new data, add interfaces to `types.ts`.
2. **Store next.** Add state and actions to `store.ts`.
3. **Math in `lib/`.** If the feature needs calculations, add pure functions to `lib/`.
4. **Component last.** Build or modify components to use the new state.

### Example: Adding a new cloud provider

1. Add the provider to the `CloudMode` type in `types.ts`:
   ```typescript
   type CloudMode = 'none' | 'azure' | 'aws' | 'gcp';
   ```

2. Add reserved IP count to `constants.ts`:
   ```typescript
   export const CLOUD_RESERVES: Record<string, number> = {
     none: 2,
     azure: 5,
     aws: 5,
     gcp: 4,  // GCP reserves 4 per subnet
   };
   ```

3. Update `usableHosts` and `firstUsable` in `lib/subnet-math.ts` to handle the new mode.

4. Add the option to `CloudModeSelector.tsx`.

## Modifying Styles

### AHEAD brand colors

Brand colors are defined in `src/app.css` under `@theme`:

```css
@theme {
  --color-ahead-blue: #1c4cbf;
  --color-ahead-cyan: #009fdc;
  --color-ahead-dark: #102033;
  /* ... */
}
```

Changing these values updates the entire app.

### Dark mode

Dark mode overrides are in `.dark { ... }` in `app.css`. The toggle is controlled by adding/removing the `dark` class on `<html>`.

### Animations

Two keyframe animations are defined in `app.css`:
- `slideDown` — Used for new rows appearing in the table
- `fadeIn` — Used for detail panels and the empty state

## Subnet Math

All IP calculations are in `src/lib/subnet-math.ts`. Key things to know:

- IPs are stored as 32-bit unsigned integers, not strings.
- Use `>>> 0` after bitwise operations to maintain unsigned representation.
- `totalAddresses(prefix)` uses `Math.pow(2, 32 - prefix)` instead of bit shifting to avoid signed integer issues for `/0` and `/1`.

## Pull Requests

1. Create a feature branch from `main`.
2. Make your changes.
3. Run `npx tsc --noEmit` to verify types.
4. Run `npm run build` to verify the production build.
5. Open a PR with a clear description of what changed and why.

## Reporting Issues

Open an issue on GitHub with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser and OS information
