import type { SubnetNode, Group } from '../types';
import { useStore } from '../store';
import { totalAddresses } from '../lib/subnet-math';
import SubnetRow from './SubnetRow';

function collectLeaves(node: SubnetNode): SubnetNode[] {
  if (!node.children) return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

function collectAll(node: SubnetNode): { node: SubnetNode; depth: number }[] {
  const result: { node: SubnetNode; depth: number }[] = [];

  function walk(n: SubnetNode, d: number) {
    if (!n.children) {
      result.push({ node: n, depth: d });
    } else {
      // Show parent row for join button
      result.push({ node: n, depth: d });
      walk(n.children[0], d + 1);
      walk(n.children[1], d + 1);
    }
  }

  walk(node, 0);
  return result;
}

function SizeBar({ rootNode }: { rootNode: SubnetNode }) {
  const leaves = collectLeaves(rootNode);
  const rootTotal = totalAddresses(rootNode.cidr);

  return (
    <div className="flex h-6 rounded-xl overflow-hidden border border-[var(--color-border)]">
      {leaves.map((leaf) => {
        const pct = (totalAddresses(leaf.cidr) / rootTotal) * 100;
        const color = leaf.color || '#64748b';
        return (
          <div
            key={leaf.id}
            className="relative group/bar flex items-center justify-center text-[9px] font-mono text-white font-medium transition-all duration-300 hover:brightness-110"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              minWidth: pct > 3 ? undefined : '2px',
            }}
          >
            {pct > 8 && `/${leaf.cidr}`}
            <div className="absolute bottom-full mb-1 hidden group-hover/bar:block bg-[var(--color-text)] text-[var(--color-surface)] text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10">
              {leaf.label || `/${leaf.cidr}`} — {totalAddresses(leaf.cidr).toLocaleString()} IPs
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SubnetTable() {
  const rootNode = useStore((s) => s.rootNode);
  const groups = useStore((s) => s.groups);

  if (!rootNode) return null;

  const rows = collectAll(rootNode);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      {/* Visual size bar */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <SizeBar rootNode={rootNode} />
      </div>

      {/* Column headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
        <div className="w-4" /> {/* expand toggle spacer */}
        <div className="w-36 shrink-0">Network</div>
        <div className="hidden md:block w-28 shrink-0">Mask</div>
        <div className="hidden lg:block w-56 shrink-0">Usable Range</div>
        <div className="w-16 shrink-0 text-right">Hosts</div>
        <div className="flex-1 min-w-[100px]">Label</div>
        <div className="w-14 shrink-0" />
      </div>

      {/* Rows */}
      <div>
        {rows.map(({ node: n, depth }, i) => (
          <SubnetRow key={n.id} node={n} depth={depth} index={i} groups={groups} />
        ))}
      </div>
    </div>
  );
}
