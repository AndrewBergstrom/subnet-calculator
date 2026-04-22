import type { SubnetNode, Group } from '../types';
import { useStore } from '../store';
import { totalAddresses, intToIp } from '../lib/subnet-math';
import SubnetRow from './SubnetRow';

function collectLeaves(node: SubnetNode): SubnetNode[] {
  if (!node.children) return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

// Find the parent of a leaf node so we can offer "Join" on sibling pairs
function findJoinableParents(node: SubnetNode): Map<string, SubnetNode> {
  const parents = new Map<string, SubnetNode>();

  function walk(n: SubnetNode) {
    if (!n.children) return;
    // If both children are leaves, they can be joined
    if (!n.children[0].children && !n.children[1].children) {
      parents.set(n.children[0].id, n);
      parents.set(n.children[1].id, n);
    }
    walk(n.children[0]);
    walk(n.children[1]);
  }

  walk(node);
  return parents;
}

function SizeBar({ rootNode }: { rootNode: SubnetNode }) {
  const leaves = collectLeaves(rootNode);
  const rootTotal = totalAddresses(rootNode.cidr);

  return (
    <div className="flex h-7 rounded-xl overflow-hidden border border-[var(--color-border)]">
      {leaves.map((leaf) => {
        const pct = (totalAddresses(leaf.cidr) / rootTotal) * 100;
        const color = leaf.color || '#64748b';
        return (
          <div
            key={leaf.id}
            className="relative group/bar flex items-center justify-center text-[9px] font-mono text-white font-medium transition-all duration-300 hover:brightness-125"
            style={{
              width: `${pct}%`,
              backgroundColor: color,
              minWidth: pct > 2 ? undefined : '2px',
            }}
          >
            {pct > 6 && (
              <span className="truncate px-1">
                {leaf.label || `/${leaf.cidr}`}
              </span>
            )}
            <div className="absolute bottom-full mb-1.5 hidden group-hover/bar:block bg-[var(--color-text)] text-[var(--color-surface)] text-[10px] px-2 py-1 rounded-lg whitespace-nowrap z-10 shadow-lg">
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
  const joinSubnet = useStore((s) => s.joinSubnet);

  if (!rootNode) return null;

  const leaves = collectLeaves(rootNode);
  const joinableParents = findJoinableParents(rootNode);

  // Build group runs: consecutive leaves in the same group
  const groupRuns: { groupId: string; startIdx: number; endIdx: number }[] = [];
  let currentGroupId: string | null = null;
  let runStart = 0;
  leaves.forEach((leaf, i) => {
    if (leaf.groupId && leaf.groupId === currentGroupId) {
      // continue run
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

  // Map leaf index -> group run info
  const leafGroupInfo = new Map<number, { group: Group; isFirst: boolean; isLast: boolean }>();
  for (const run of groupRuns) {
    const group = groups.find((g) => g.id === run.groupId);
    if (!group) continue;
    for (let i = run.startIdx; i <= run.endIdx; i++) {
      leafGroupInfo.set(i, {
        group,
        isFirst: i === run.startIdx,
        isLast: i === run.endIdx,
      });
    }
  }

  // Build join bracket pairs
  // For each pair of joinable siblings, track their indices in the leaf array
  const joinBrackets: { topIdx: number; bottomIdx: number; parentId: string; cidr: number }[] = [];
  const seen = new Set<string>();
  leaves.forEach((leaf, i) => {
    const parent = joinableParents.get(leaf.id);
    if (parent && !seen.has(parent.id)) {
      seen.add(parent.id);
      const siblingIdx = leaves.findIndex((l) => l.id !== leaf.id && joinableParents.get(l.id)?.id === parent.id);
      if (siblingIdx !== -1) {
        joinBrackets.push({
          topIdx: Math.min(i, siblingIdx),
          bottomIdx: Math.max(i, siblingIdx),
          parentId: parent.id,
          cidr: parent.cidr,
        });
      }
    }
  });

  return (
    <div className="rounded-2xl border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
      {/* Visual size bar */}
      <div className="p-4 border-b border-[var(--color-border)]">
        <SizeBar rootNode={rootNode} />
      </div>

      <div className="flex">
        {/* Main table */}
        <div className="flex-1 min-w-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                <th className="w-1 p-0" />
                <th className="px-3 py-2">Subnet Address</th>
                <th className="hidden md:table-cell px-3 py-2">Range of Addresses</th>
                <th className="hidden lg:table-cell px-3 py-2">Useable IPs</th>
                <th className="px-3 py-2 text-right">Hosts</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Color</th>
                <th className="px-3 py-2">Group</th>
                <th className="px-3 py-2 text-center">Divide</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leaf, i) => {
                const info = leafGroupInfo.get(i);
                return (
                  <SubnetRow
                    key={leaf.id}
                    node={leaf}
                    index={i}
                    groups={groups}
                    isFirstInGroup={info?.isFirst}
                    isLastInGroup={info?.isLast}
                    groupForRow={info?.group}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Join bracket column */}
        {joinBrackets.length > 0 && (
          <div className="w-16 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface-alt)] relative">
            {/* Header spacer */}
            <div className="h-[33px] border-b border-[var(--color-border)] flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Join
            </div>
            {/* Brackets rendered relative to row positions */}
            <div className="relative">
              {joinBrackets.map((bracket) => {
                const rowHeight = 41; // approximate row height
                const top = bracket.topIdx * rowHeight;
                const height = (bracket.bottomIdx - bracket.topIdx + 1) * rowHeight;
                return (
                  <button
                    key={bracket.parentId}
                    onClick={() => joinSubnet(bracket.parentId)}
                    className="absolute right-2 flex items-center justify-center hover:text-amber-400 text-[var(--color-text-muted)] transition-colors group/join"
                    style={{ top: `${top}px`, height: `${height}px` }}
                    aria-label={`Join into /${bracket.cidr}`}
                    title={`Join into /${bracket.cidr}`}
                  >
                    {/* Bracket shape */}
                    <svg
                      className="w-5"
                      viewBox="0 0 20 100"
                      preserveAspectRatio="none"
                      style={{ height: '100%' }}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M2,4 L14,4 L14,96 L2,96" />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
