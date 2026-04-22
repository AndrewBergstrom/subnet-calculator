import type { SubnetNode, Group } from '../types';
import { useStore } from '../store';
import { totalAddresses } from '../lib/subnet-math';
import SubnetRow from './SubnetRow';

function collectLeaves(node: SubnetNode): SubnetNode[] {
  if (!node.children) return [node];
  return [...collectLeaves(node.children[0]), ...collectLeaves(node.children[1])];
}

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

// Build ALL brackets at every level of the tree.
// Each internal node with children creates a bracket spanning its leaf range.
interface Bracket {
  nodeId: string;
  cidr: number;
  startLeafIdx: number;
  endLeafIdx: number;  // inclusive
  depth: number;       // 0 = innermost (closest to the leaves), higher = wider
}

function buildBrackets(rootNode: SubnetNode): Bracket[] {
  const leaves = collectLeaves(rootNode);
  const leafIdToIdx = new Map<string, number>();
  leaves.forEach((l, i) => leafIdToIdx.set(l.id, i));

  const brackets: Bracket[] = [];
  let maxDepth = 0;

  function walk(node: SubnetNode, depth: number) {
    if (!node.children) return;

    const nodeLeaves = collectLeaves(node);
    const startIdx = leafIdToIdx.get(nodeLeaves[0].id)!;
    const endIdx = leafIdToIdx.get(nodeLeaves[nodeLeaves.length - 1].id)!;

    brackets.push({
      nodeId: node.id,
      cidr: node.cidr,
      startLeafIdx: startIdx,
      endLeafIdx: endIdx,
      depth,
    });

    if (depth > maxDepth) maxDepth = depth;

    walk(node.children[0], depth + 1);
    walk(node.children[1], depth + 1);
  }

  walk(rootNode, 0);

  // Invert depth so innermost brackets are depth 0 (leftmost column)
  // and outermost brackets are highest depth (rightmost column)
  for (const b of brackets) {
    b.depth = maxDepth - b.depth;
  }

  return brackets;
}

function AddressMap({ rootNode, groups }: { rootNode: SubnetNode; groups: Group[] }) {
  const leaves = collectLeaves(rootNode);
  const rootTotal = totalAddresses(rootNode.cidr);
  const hasAnyColor = leaves.some((l) => l.color || (l.groupId && groups.find((g) => g.id === l.groupId)));

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

// Join bracket column — renders nested brackets like DaveC
function JoinBrackets({ rootNode, leafCount, rowHeight }: { rootNode: SubnetNode; leafCount: number; rowHeight: number }) {
  const joinSubnet = useStore((s) => s.joinSubnet);
  const brackets = buildBrackets(rootNode);

  if (brackets.length === 0) return null;

  const maxDepth = Math.max(...brackets.map((b) => b.depth));
  const colWidth = 28; // width per bracket nesting level
  const totalWidth = (maxDepth + 1) * colWidth;

  return (
    <div
      className="shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface-alt)] relative"
      style={{ width: `${totalWidth}px` }}
    >
      {/* Header */}
      <div
        className="border-b border-[var(--color-border)] flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]"
        style={{ height: `${rowHeight}px` }}
      >
        Join
      </div>

      {/* Brackets */}
      <div className="relative" style={{ height: `${leafCount * rowHeight}px` }}>
        {brackets.map((bracket) => {
          const top = bracket.startLeafIdx * rowHeight + 2;
          const height = (bracket.endLeafIdx - bracket.startLeafIdx + 1) * rowHeight - 4;
          const left = bracket.depth * colWidth;

          return (
            <button
              key={bracket.nodeId}
              onClick={() => joinSubnet(bracket.nodeId)}
              className="absolute flex items-center justify-center text-[var(--color-text-muted)] hover:text-ahead-cyan transition-colors cursor-pointer group/bracket"
              style={{
                top: `${top}px`,
                height: `${height}px`,
                left: `${left}px`,
                width: `${colWidth - 2}px`,
              }}
              aria-label={`Join into /${bracket.cidr}`}
              title={`Join into /${bracket.cidr}`}
            >
              {/* Bracket line */}
              <svg
                className="w-full h-full"
                viewBox="0 0 24 100"
                preserveAspectRatio="none"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M4,2 L18,2 L18,98 L4,98" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* CIDR label */}
              <span className="absolute text-[9px] font-mono font-medium -rotate-90 whitespace-nowrap opacity-60 group-hover/bracket:opacity-100 transition-opacity pointer-events-none">
                /{bracket.cidr}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SubnetTable() {
  const rootNode = useStore((s) => s.rootNode);
  const groups = useStore((s) => s.groups);
  const columns = useStore((s) => s.columns);

  if (!rootNode) return null;

  const leaves = collectLeaves(rootNode);
  const mergeInfo = findMergeableParents(rootNode);
  const hasBrackets = !!rootNode.children;
  const rowHeight = 45; // approximate row height in px

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
      {/* Address space map */}
      <AddressMap rootNode={rootNode} groups={groups} />

      <div className="flex">
        {/* Main table */}
        <div className="flex-1 min-w-0">
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

        {/* Join bracket column */}
        {hasBrackets && (
          <JoinBrackets rootNode={rootNode} leafCount={leaves.length} rowHeight={rowHeight} />
        )}
      </div>
    </div>
  );
}
