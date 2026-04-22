# User Guide

This guide walks through every feature of the AHEAD Subnet Calculator.

## Getting Started

1. Open the app in your browser.
2. In the header, you'll see a CIDR input field pre-filled with `10.0.0.0/16`.
3. Change it to your desired network (e.g., `10.70.0.0/16`) and click **Calculate**.
4. The table below shows your network as a single row.

## Dividing Subnets

Click **Divide** on any row to split that subnet into two equal halves at the next prefix length.

For example:
- Dividing a `/16` creates two `/17`s
- Dividing a `/17` creates two `/18`s
- You can keep dividing down to `/32` (a single host)

Each divide doubles the number of rows in that portion of the address space.

### Merging Subnets Back

If you divided a subnet and want to undo it:

1. Click on either of the two sibling rows to expand the detail panel.
2. At the bottom of the panel, you'll see a **"Merge back into /X"** button.
3. Click it to recombine the two halves.

Note: Merge is only available when both halves are still leaf subnets (neither has been further divided).

## Labels

Each row has an inline **"Add label..."** field. Click it and type to name the subnet.

Good label examples:
- `App Tier - Prod`
- `Database Subnet`
- `AKS Node Pool`
- `GatewaySubnet`
- `Firewall Mgmt`

Labels appear in the Address Space Map visualization and in exported JSON.

## Detail Panel

Click any row (or the chevron `>` on the right) to expand its detail panel. The panel contains:

- **Group** — Assign the subnet to a group (see below)
- **Color** — Pick a color for the subnet (only shown when no group is assigned)
- **Notes** — Add free-text notes about the subnet's purpose
- **Subnet Info** — Total IPs, broadcast address, usable host count
- **Merge** — Button to merge back with sibling (when available)

## Colors

Colors help you visually distinguish subnets at a glance.

### How colors work

- **Individual color**: When a subnet is not in a group, you can pick a color from the palette in the detail panel. The color shows as a thin bar on the left edge of the row.
- **Group color**: When a subnet is assigned to a group, it uses the group's color. The individual color picker is hidden to avoid confusion.

The 10 available colors are chosen to work well in both dark and light mode.

## Groups

Groups let you organize subnets logically — like drawing colored boxes around related subnets on a whiteboard.

### Creating a group

1. In the toolbar above the table, click **+ Add Group**.
2. Pick a color from the swatches.
3. Type a name (e.g., "Production VNet", "Shared Services", "Hub Network").
4. Click **Add**.

The group appears as a chip in the toolbar.

### Assigning subnets to a group

1. Click a subnet row to open the detail panel.
2. Use the **Group** dropdown to select a group.
3. The subnet inherits the group's color.

### Visual effect

When consecutive subnets in the table belong to the same group, they are wrapped with a colored border — similar to drawing a colored box around them in Excalidraw.

### Removing a group

Click the **x** on a group chip in the toolbar. All subnets assigned to that group will be unassigned.

## Cloud Modes

The toggle in the header switches between three modes:

### Standard (default)
- Reserves 2 IPs per subnet: the network address and broadcast address.
- Example: A `/24` (256 total) has 254 usable hosts.

### Azure
- Reserves 5 IPs per subnet.
- Azure reserves the first 4 addresses (x.x.x.0 through x.x.x.3) and the last address (broadcast) in each subnet.
- Example: A `/24` (256 total) has 251 usable hosts.
- Use this when planning Azure VNets.

### AWS
- Reserves 5 IPs per subnet.
- AWS reserves the first 3 addresses, the network address, and the broadcast address.
- Example: A `/24` (256 total) has 251 usable hosts.
- Use this when planning AWS VPCs.

The selected mode affects the **Hosts** column, the **Useable IPs** column, and all summary statistics.

## Address Space Map

Once you start adding labels or colors to subnets, a proportional bar appears above the table labeled **"Address Space Map"**.

- Each segment represents a subnet, sized proportionally to its address count.
- Colored segments show the subnet's color (or group color).
- Hover over a segment to see the subnet's label and IP count.
- The map is hidden when nothing is colored or labeled (to avoid visual noise).

## Summary Stats

Four cards above the table show at-a-glance information:

| Card | Description |
|------|-------------|
| **Network** | The root CIDR and subnet mask |
| **Subnets** | How many leaf subnets exist, and how many are labeled |
| **Usable IPs** | Total usable hosts across all subnets (adjusted for cloud mode) |
| **Reserved IPs** | Total reserved IPs with explanation of what's reserved |

## Export / Import

### Exporting

Click **Export** in the toolbar. A `subnet-config.json` file downloads containing:
- All subnets (the full tree structure)
- All groups (names and colors)
- The selected cloud mode

### Importing

Click **Import** in the toolbar and select a previously exported JSON file. The app state is fully restored — subnets, labels, colors, groups, and cloud mode.

If the file is invalid, an error message appears briefly.

### Sharing with your team

Export your subnet layout, send the JSON file to a colleague, and they can import it to see exactly what you designed. No account or server needed.

## Dark / Light Mode

Click the sun/moon icon in the top-right corner of the header to toggle between dark mode (AHEAD dark blue) and light mode. The preference persists during your session.

## Keyboard Tips

- **Tab** through the table to navigate between label inputs and controls.
- **Enter** in the CIDR input field triggers Calculate.
- Click anywhere on a row to toggle the detail panel. Click the label input or Divide link directly without opening the panel.
