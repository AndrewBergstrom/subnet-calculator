import type { SubnetNode } from '../types';
import { useStore } from '../store';
import { totalAddresses, usableHosts, intToIp, subnetMaskString } from '../lib/subnet-math';

function collectLeaves(node: SubnetNode): SubnetNode[] {
  if (!node.children) return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

export default function SummaryStats() {
  const rootNode = useStore((s) => s.rootNode);
  const cloudMode = useStore((s) => s.cloudMode);

  if (!rootNode) return null;

  const leaves = collectLeaves(rootNode);
  const rootTotal = totalAddresses(rootNode.cidr);
  const totalUsable = leaves.reduce((sum, l) => sum + usableHosts(l.cidr, cloudMode), 0);
  const labeled = leaves.filter((l) => l.label).length;
  const cloudLabel = cloudMode === 'none' ? 'Standard' : cloudMode === 'azure' ? 'Azure' : 'AWS';
  const reservedPerSubnet = cloudMode === 'none' ? 2 : 5;
  const totalReserved = leaves.reduce((sum, l) => sum + Math.min(reservedPerSubnet, totalAddresses(l.cidr)), 0);

  const stats = [
    { label: 'Network', value: `${intToIp(rootNode.networkAddress)}/${rootNode.cidr}`, sub: subnetMaskString(rootNode.cidr) },
    { label: 'Subnets', value: leaves.length.toString(), sub: `${labeled} labeled` },
    { label: 'Total IPs', value: rootTotal.toLocaleString(), sub: `${totalUsable.toLocaleString()} usable` },
    { label: 'Reserved', value: totalReserved.toLocaleString(), sub: `${cloudLabel} mode` },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            {s.label}
          </div>
          <div className="text-xl font-semibold font-mono mt-1">{s.value}</div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
