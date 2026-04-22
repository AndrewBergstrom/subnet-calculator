# AHEAD Subnet Calculator

A modern, browser-based subnet calculator that replaces the workflow of using DaveC's Visual Subnet Calculator + Excalidraw/draw.io. Calculate, divide, color-code, label, and group subnets — all in one tool.

Built for network engineers, cloud architects, and anyone planning IP address spaces.

**Live demo:** [https://andrewbergstrom.github.io/subnet-calculator/](https://andrewbergstrom.github.io/subnet-calculator/)

## Quick Start

```bash
# Clone the repo
git clone https://github.com/AndrewBergstrom/subnet-calculator.git
cd subnet-calculator

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## What It Does

Enter a network CIDR (e.g., `10.0.0.0/16`) and divide it into smaller subnets. Label them, assign colors, organize them into groups, and export your work as JSON.

**Core features:**

- **Divide & Merge** — Split any subnet into two equal halves. Merge them back when needed.
- **Labels & Notes** — Name each subnet (e.g., "App Tier", "Database") and add notes.
- **Color Coding** — Assign colors to individual subnets or let groups set colors automatically.
- **Groups** — Create named groups (e.g., "Production VNet", "Hub Network") that visually wrap subnets with colored borders.
- **Cloud Modes** — Switch between Standard, Azure, and AWS to account for reserved IPs per subnet.
- **Address Space Map** — A proportional visualization of your address space that appears as you label and color subnets.
- **Export / Import** — Save your subnet layout as JSON and reload it later or share it with your team.
- **Dark / Light Mode** — Toggle between themes. Defaults to dark mode with AHEAD branding.

## Cloud Modes

| Mode     | Reserved IPs per Subnet | Details                              |
|----------|------------------------|--------------------------------------|
| Standard | 2                      | Network address + broadcast          |
| Azure    | 5                      | First 4 + last 1 per subnet         |
| AWS      | 5                      | First 3 + network + broadcast        |

The "Hosts" column and summary stats automatically adjust based on the selected mode.

## Tech Stack

- [React 19](https://react.dev) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev) — fast builds, HMR
- [Tailwind CSS v4](https://tailwindcss.com) — utility-first styling
- [Zustand](https://zustand.docs.pmnd.rs/) — lightweight state management
- No backend — 100% client-side, runs entirely in the browser

## Documentation

Detailed documentation is in the [`/docs`](./docs) directory:

- [User Guide](./docs/user-guide.md) — How to use the calculator, feature walkthrough
- [Cloud Modes](./docs/cloud-modes.md) — How Azure, AWS, and Standard modes work
- [Architecture](./docs/architecture.md) — Codebase structure, data model, key decisions
- [Deployment](./docs/deployment.md) — How to build and host the app
- [Contributing](./docs/contributing.md) — Development setup, conventions, how to contribute

## Build for Production

```bash
npm run build
```

Outputs static files to `dist/`. Serve with any static file host (Nginx, Apache, S3, Azure Static Web Apps, etc.). See [Deployment docs](./docs/deployment.md) for details.

## License

MIT
