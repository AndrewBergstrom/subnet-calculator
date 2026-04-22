import type { SubnetNode, Group } from '../types';
import { useStore } from '../store';
import { totalAddresses } from '../lib/subnet-math';
import type { ColumnVisibility } from '../types';
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

function AddressMap({ rootNode, groups }: { rootNode: SubnetNode; groups: Group[] }) {
  const leaves = collectLeaves(rootNode);
  const rootTotal = totalAddresses(rootNode.cidr);
  const hasAnyColor = leaves.some((l) => l.color || (l.groupId && groups.find((g) => g.id === l.groupId)));

  // Don't show the map if nothing is colored/labeled — it's just gray noise
  if (!hasAnyColor && leaves.every((l) => !l.label)) return null;

  return (
    <div className="px-4 pt-4 pb-2 border-b border-[var(--color-border)]">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
        Address Space Map
      </div>
      <div className="flex h-7 rounded-lg overflow-hidden border border-[var(--color-border)]">
        {leaves.map((leaf) => {
          const pct = (totalAddresses(leaf.cidr) / rootTotal) * 100;
          const group = leaf.groupId ? groups.find((g) => g.id === leaf.groupId) : null;
          const color = group?.color || leaf.color || 'var(--color-border)';
          const hasColor = !!(group?.color || leaf.color);
          return (
            <div
              key={leaf.id}
              className={`relative group/bar flex items-center justify-center text-[10px] font-mono font-medium transition-all duration-300 border-r border-white/10 last:border-r-0 ${hasColor ? 'text-white hover:brightness-110' : 'text-[var(--color-text-muted)]'}`}
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                minWidth: pct > 1.5 ? undefined : '1px',
              }}
            >
              {pct > 10 && (
                <span className="truncate px-1">
                  {leaf.label || `/${leaf.cidr}`}
                </span>
              )}
              <div className="absolute bottom-full mb-2 hidden group-hover/bar:block z-20 pointer-events-none">
                <div className="bg-[var(--color-text)] text-[var(--color-surface)] text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                  {leaf.label || `/${leaf.cidr}`} — {totalAddresses(leaf.cidr).toLocaleString()} IPs
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] ${className}`}>
      {children}
    </th>
  );
}

export default function SubnetTable() {
  const rootNode = useStore((s) => s.rootNode);
  const groups = useStore((s) => s.groups);
  const columns = useStore((s) => s.columns);

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
      {/* Address space map — only shows when there are colors/labels */}
      <AddressMap rootNode={rootNode} groups={groups} />

      {/* Table */}
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <Th className="w-1.5 p-0" />
            <Th>Subnet Address</Th>
            {columns.netmask && <Th>Netmask</Th>}
            {columns.range && <Th className="hidden lg:table-cell">Range of Addresses</Th>}
            {columns.usableIps && <Th className="hidden xl:table-cell">Useable IPs</Th>}
            {columns.hosts && <Th className="text-right">Hosts</Th>}
            {columns.label && <Th>Label</Th>}
            <Th className="text-center">Divide</Th>
            <Th className="w-10 pr-4" />
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
                columns={columns}
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
