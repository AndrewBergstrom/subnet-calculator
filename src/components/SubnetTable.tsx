import type { SubnetNode, Group } from '../types';
import { useStore } from '../store';
import { totalAddresses } from '../lib/subnet-math';
import SubnetRow from './SubnetRow';

function collectLeaves(node: SubnetNode): SubnetNode[] {
  if (!node.children) return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

// Find parents whose both children are leaves (mergeable pairs)
function findMergeableParents(node: SubnetNode): Map<string, { parentId: string; cidr: number }> {
  const result = new Map<string, { parentId: string; cidr: number }>();
  function walk(n: SubnetNode) {
    if (!n.children) return;
    if (!n.children[0].children && !n.children[1].children) {
      result.set(n.children[0].id, { parentId: n.id, cidr: n.cidr });
      result.set(n.children[1].id, { parentId: n.id, cidr: n.cidr });
    }
    walk(n.children[0]);
    walk(n.children[1]);
  }
  walk(node);
  return result;
}

function SizeBar({ rootNode }: { rootNode: SubnetNode }) {
  const leaves = collectLeaves(rootNode);
  const rootTotal = totalAddresses(rootNode.cidr);

  return (
    <div className="flex h-8 rounded-xl overflow-hidden border border-[var(--color-border)]">
      {leaves.map((leaf) => {
        const pct = (totalAddresses(leaf.cidr) / rootTotal) * 100;
        const color = leaf.color || 'var(--color-text-muted)';
        return (
          <div
            key={leaf.id}
            className="relative group/bar flex items-center justify-center text-[10px] font-mono text-white font-medium transition-all duration-300 hover:brightness-125 border-r border-white/20 last:border-r-0"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              minWidth: pct > 1.5 ? undefined : '2px',
            }}
          >
            {pct > 8 && (
              <span className="truncate px-1">
                {leaf.label || `/${leaf.cidr}`}
              </span>
            )}
            <div className="absolute bottom-full mb-2 hidden group-hover/bar:flex flex-col items-center z-20 pointer-events-none">
              <div className="bg-[var(--color-text)] text-[var(--color-surface)] text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                {leaf.label || `/${leaf.cidr}`} — {totalAddresses(leaf.cidr).toLocaleString()} IPs
              </div>
              <div className="w-2 h-2 bg-[var(--color-text)] rotate-45 -mt-1" />
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

  const leaves = collectLeaves(rootNode);
  const mergeInfo = findMergeableParents(rootNode);

  // Build group runs for border regions
  const groupRuns: { groupId: string; startIdx: number; endIdx: number }[] = [];
  let currentGroupId: string | null = null;
  let runStart = 0;
  leaves.forEach((leaf, i) => {
    if (leaf.groupId && leaf.groupId === currentGroupId) {
      // continue
    } else {
      if (currentGroupId) {
        groupRuns.push({ groupId: currentGroupId, startIdx: runStart, endIdx: i - 1 });
      }
      if (leaf.groupId) {
        currentGroupId = leaf.groupId;
        runStart = i;
      } else {
        currentGroupId = null;
      }
    }
  });
  if (currentGroupId) {
    groupRuns.push({ groupId: currentGroupId, startIdx: runStart, endIdx: leaves.length - 1 });
  }

  const leafGroupInfo = new Map<number, { group: Group; isFirst: boolean; isLast: boolean }>();
  for (const run of groupRuns) {
    const group = groups.find((g) => g.id === run.groupId);
    if (!group) continue;
    for (let i = run.startIdx; i <= run.endIdx; i++) {
      leafGroupInfo.set(i, { group, isFirst: i === run.startIdx, isLast: i === run.endIdx });
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      {/* Visual size bar */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <SizeBar rootNode={rootNode} />
      </div>

      {/* Table */}
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <th className="w-1.5 p-0" />
            <th className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Subnet Address</th>
            <th className="hidden lg:table-cell px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Range of Addresses</th>
            <th className="hidden xl:table-cell px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Useable IPs</th>
            <th className="px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Hosts</th>
            <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Label</th>
            <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Divide</th>
            <th className="w-10 pr-4 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {leaves.map((leaf, i) => {
            const info = leafGroupInfo.get(i);
            const merge = mergeInfo.get(leaf.id);
            return (
              <SubnetRow
                key={leaf.id}
                node={leaf}
                index={i}
                groups={groups}
                canMerge={!!merge}
                mergeParentId={merge?.parentId}
                mergeCidr={merge?.cidr}
                isFirstInGroup={info?.isFirst}
                isLastInGroup={info?.isLast}
                groupForRow={info?.group}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
