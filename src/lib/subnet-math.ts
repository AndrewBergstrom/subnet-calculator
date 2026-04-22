import type { CloudMode } from '../types';

export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(n: number): string {
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff,
  ].join('.');
}

export function subnetMask(prefix: number): number {
  if (prefix === 0) return 0;
  return (~0 << (32 - prefix)) >>> 0;
}

export function networkAddress(ip: number, prefix: number): number {
  return (ip & subnetMask(prefix)) >>> 0;
}

export function broadcastAddress(ip: number, prefix: number): number {
  return (networkAddress(ip, prefix) | ~subnetMask(prefix)) >>> 0;
}

export function totalAddresses(prefix: number): number {
  return Math.pow(2, 32 - prefix);
}

export function usableHosts(prefix: number, cloudMode: CloudMode): number {
  const total = totalAddresses(prefix);
  if (prefix === 32) return 1;
  if (prefix === 31) return 2; // point-to-point

  if (cloudMode === 'azure' || cloudMode === 'aws') {
    return Math.max(0, total - 5);
  }
  return Math.max(0, total - 2); // network + broadcast
}

export function firstUsable(network: number, prefix: number, cloudMode: CloudMode): number {
  if (prefix >= 31) return network;
  if (cloudMode === 'azure' || cloudMode === 'aws') {
    return (network + 4) >>> 0; // first 4 reserved
  }
  return (network + 1) >>> 0;
}

export function lastUsable(network: number, prefix: number, cloudMode: CloudMode): number {
  const broadcast = broadcastAddress(network, prefix);
  if (prefix >= 31) return broadcast;
  if (cloudMode === 'azure' || cloudMode === 'aws') {
    return (broadcast - 1) >>> 0;
  }
  return (broadcast - 1) >>> 0;
}

export function parseCidr(input: string): { ip: number; prefix: number } | null {
  const match = input.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) return null;

  const parts = match[1].split('.').map(Number);
  if (parts.some(p => p > 255)) return null;

  const prefix = parseInt(match[2], 10);
  if (prefix > 32) return null;

  const ip = ipToInt(match[1]);
  const aligned = networkAddress(ip, prefix);

  return { ip: aligned, prefix };
}

export function isValidCidr(input: string): boolean {
  return parseCidr(input) !== null;
}

export function canSplit(prefix: number): boolean {
  return prefix < 32;
}

export function subnetMaskString(prefix: number): string {
  return intToIp(subnetMask(prefix));
}
