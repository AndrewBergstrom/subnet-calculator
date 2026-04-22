export const SUBNET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#009fdc', // ahead cyan
  '#1c4cbf', // ahead blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#64748b', // slate
] as const;

export const CLOUD_RESERVES: Record<string, number> = {
  none: 2,   // network + broadcast
  azure: 5,  // first 4 + last 1
  aws: 5,    // first 3 + broadcast + network
};
