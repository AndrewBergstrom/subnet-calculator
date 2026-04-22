# Architecture

This document covers the codebase structure, data model, and key design decisions.

## Project Structure

```
subnet-calculator/
├── index.html              # Entry point, loads fonts (Poppins, PT Serif, JetBrains Mono)
├── vite.config.ts          # Vite config with React + Tailwind CSS v4 plugins
├── package.json            # Dependencies: react, zustand (runtime); tailwindcss, vite (dev)
├── docs/                   # Documentation
│   ├── user-guide.md
│   ├── cloud-modes.md
│   ├── architecture.md     # (this file)
│   ├── deployment.md
│   └── contributing.md
└── src/
    ├── main.tsx            # React entry point, renders <App />
    ├── App.tsx             # Root layout: Header, SummaryStats, Toolbar, SubnetTable
    ├── app.css             # Tailwind import, AHEAD theme colors, animations
    ├── types.ts            # TypeScript interfaces
    ├── store.ts            # Zustand state store
    ├── constants.ts        # Color palette, cloud reserve counts
    ├── lib/
    │   ├── subnet-math.ts  # Pure functions for IP/subnet calculations
    │   └── export.ts       # JSON import/export serialization
    └── components/
        ├── Header.tsx           # App header: logo, CIDR input, cloud toggle, theme toggle
        ├── NetworkInput.tsx     # CIDR text input + Calculate button
        ├── CloudModeSelector.tsx # Standard/Azure/AWS segmented control
        ├── ThemeToggle.tsx      # Dark/light mode toggle
        ├── SummaryStats.tsx     # Four stat cards (network, subnets, usable, reserved)
        ├── Toolbar.tsx          # Groups chips + Add Group + Export/Import
        ├── SubnetTable.tsx      # Main table + address space map
        ├── SubnetRow.tsx        # Individual subnet row + expandable detail panel
        └── EmptyState.tsx       # Welcome screen when no network is entered
```

## Data Model

### SubnetNode (binary tree)

The core data structure is a binary tree. Each node represents a subnet.

```typescript
interface SubnetNode {
  id: string;              // Path-based ID: "root", "root-0", "root-1", "root-0-1"
  networkAddress: number;  // 32-bit unsigned integer
  cidr: number;            // Prefix length (0-32)
  children: [SubnetNode, SubnetNode] | null;  // null = leaf (visible), pair = split
  label: string;           // User-assigned name
  notes: string;           // User-assigned notes
  color: string | null;    // Hex color (only used when not in a group)
  groupId: string | null;  // Reference to a Group
}
```

**Key invariants:**
- Only leaf nodes (where `children === null`) are displayed as rows in the table.
- Splitting a leaf creates two children at `cidr + 1`.
- Joining a node discards its entire subtree (sets `children = null`).
- Node IDs encode the tree path: `"root-0"` is the left child of root, `"root-0-1"` is the right child of root's left child.

### Group

```typescript
interface Group {
  id: string;     // UUID
  name: string;   // User-assigned name
  color: string;  // Hex color applied to all members
}
```

Groups are stored separately from the tree. Subnets reference groups by ID. Renaming or recoloring a group updates all members automatically.

### CloudMode

```typescript
type CloudMode = 'none' | 'azure' | 'aws';
```

Affects only the `usableHosts` and `firstUsable` calculations. Does not modify the tree structure.

## State Management

The app uses a single Zustand store (`src/store.ts`). All state mutations go through store actions.

### Tree operations

- **`setNetwork(cidr)`** — Parses the CIDR string, creates a single root node.
- **`splitSubnet(nodeId)`** — Clones the tree, finds the node, creates two children.
- **`joinSubnet(nodeId)`** — Clones the tree, finds the node, sets `children = null`.
- **`updateSubnet(nodeId, updates)`** — Clones the tree, applies partial updates to a leaf.

All tree mutations follow an immutable pattern: clone the entire tree, modify the clone, set the new tree as state. This ensures React re-renders correctly.

### Why clone the whole tree?

Zustand uses reference equality for change detection. If we mutated nodes in place, React wouldn't know to re-render. Cloning the full tree is simple and fast enough for the expected tree sizes (hundreds of nodes at most).

## Subnet Math

All IP math is in `src/lib/subnet-math.ts`. Functions are pure (no side effects) and operate on 32-bit unsigned integers.

**Important: unsigned integer handling**

JavaScript's bitwise operators work on 32-bit signed integers. The IP `255.255.255.255` is `-1` in signed representation. We use `>>> 0` (unsigned right shift by zero) to convert back to unsigned:

```typescript
export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}
```

## Color Logic

Colors follow a clear precedence:

1. **Group color** — If a subnet is assigned to a group, the group's color is used. The individual color picker is hidden.
2. **Individual color** — If no group is assigned, the subnet can have its own color.
3. **No color** — The row has no color bar.

When assigning a subnet to a group, any individual color is automatically cleared.

## Group Border Regions

When consecutive leaf nodes in the display order share the same group, they are wrapped with a colored border. The table component builds "group runs" by scanning the leaf array:

```
[no group] [group-A] [group-A] [group-A] [no group] [group-B] [group-B]
           |-------- border region -------|           |--- region ---|
```

The first row in a run gets a top border, the last gets a bottom border, and all rows get left/right borders.

## Styling

- **AHEAD brand colors** are defined as CSS custom properties in `app.css` via Tailwind's `@theme` directive.
- **Dark mode** uses the `.dark` class on `<html>`, which overrides CSS custom properties for surface, text, and border colors.
- **Animations** use CSS keyframes (`slideDown`, `fadeIn`) with spring-like cubic-bezier curves.
- **Glassmorphism** is applied to the header via `backdrop-filter: blur(12px)`.

## Key Design Decisions

| Decision | Why |
|----------|-----|
| Binary tree, not flat array | Matches how subnets actually divide. Splitting/joining is O(1) on the node. |
| Zustand over Redux/Context | Minimal boilerplate, no providers needed, fast enough for this scale. |
| No router | Single-page app with one view. Adding a router would be premature. |
| No backend | All computation is trivial client-side. Export/import via JSON files. |
| Tailwind v4 | CSS-first config, fast builds, matches AHEAD's modern aesthetic. |
| Path-based node IDs | Makes tree lookups O(depth) by splitting the ID string. No separate index needed. |
| Immutable tree cloning | Simple correctness over optimization. Tree sizes are small. |
