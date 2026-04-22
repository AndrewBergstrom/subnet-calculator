import { useState } from 'react';
import type { SubnetNode, Group } from '../types';
import { intToIp, totalAddresses, usableHosts, firstUsable, lastUsable, broadcastAddress, canSplit } from '../lib/subnet-math';
import { useStore } from '../store';
import ColorPicker from './ColorPicker';

interface SubnetRowProps {
  node: SubnetNode;
  index: number;
  groups: Group[];
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  groupForRow?: Group;
}

export default function SubnetRow({ node, index, groups, isFirstInGroup, isLastInGroup, groupForRow }: SubnetRowProps) {
  const [showDetails, setShowDetails] = useState(false);
  const cloudMode = useStore((s) => s.cloudMode);
  const splitSubnet = useStore((s) => s.splitSubnet);
  const updateSubnet = useStore((s) => s.updateSubnet);

  const net = node.networkAddress;
  const prefix = node.cidr;
  const usable = usableHosts(prefix, cloudMode);
  const first = firstUsable(net, prefix, cloudMode);
  const last = lastUsable(net, prefix, cloudMode);
  const broadcast = broadcastAddress(net, prefix);
  const displayColor = node.color || groupForRow?.color || null;
  const animDelay = Math.min(index * 20, 200);

  // Group border styling
  const groupColor = groupForRow?.color;
  const groupBorderStyle: React.CSSProperties = groupColor ? {
    borderLeft: `3px solid ${groupColor}`,
    borderRight: `3px solid ${groupColor}`,
    ...(isFirstInGroup ? { borderTop: `3px solid ${groupColor}` } : {}),
    ...(isLastInGroup ? { borderBottom: `3px solid ${groupColor}` } : {}),
  } : {};

  return (
    <>
      <tr
        className="animate-slide-down border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors duration-100"
        style={{
          animationDelay: `${animDelay}ms`,
          backgroundColor: displayColor ? `${displayColor}08` : undefined,
          ...groupBorderStyle,
        }}
      >
        {/* Color dot */}
        <td className="pl-4 pr-1 py-3">
          <ColorPicker
            value={node.color}
            onChange={(c) => updateSubnet(node.id, { color: c })}
          />
        </td>

        {/* Network */}
        <td className="px-3 py-3 font-mono text-sm font-medium whitespace-nowrap">
          {intToIp(net)}/{prefix}
        </td>

        {/* Range of addresses */}
        <td className="hidden lg:table-cell px-3 py-3 font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          {`${intToIp(net)} - ${intToIp(broadcast)}`}
        </td>

        {/* Usable IPs */}
        <td className="hidden xl:table-cell px-3 py-3 font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
          {prefix < 31 ? `${intToIp(first)} - ${intToIp(last)}` : intToIp(net)}
        </td>

        {/* Hosts */}
        <td className="px-3 py-3 text-right font-mono text-sm tabular-nums whitespace-nowrap">
          {usable.toLocaleString()}
        </td>

        {/* Label */}
        <td className="px-3 py-1.5">
          <input
            type="text"
            value={node.label}
            onChange={(e) => updateSubnet(node.id, { label: e.target.value })}
            placeholder="Add label..."
            aria-label={`Label for ${intToIp(net)}/${prefix}`}
            className="w-full min-w-[120px] px-2.5 py-1.5 rounded-lg text-xs bg-transparent border border-transparent hover:border-[var(--color-border)] focus:border-ahead-cyan focus:bg-[var(--color-surface-alt)] focus:outline-none transition-all"
          />
        </td>

        {/* Divide */}
        <td className="px-3 py-3 text-center whitespace-nowrap">
          {canSplit(prefix) ? (
            <button
              onClick={() => splitSubnet(node.id)}
              className="text-ahead-cyan hover:text-ahead-cyan-light text-xs font-medium hover:underline underline-offset-2 transition-colors"
              aria-label={`Divide into /${prefix + 1}`}
            >
              Divide
            </button>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">—</span>
          )}
        </td>

        {/* More actions toggle */}
        <td className="pr-4 py-3 text-center">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className={`p-1 rounded-lg transition-all ${showDetails ? 'bg-ahead-blue/10 text-ahead-blue' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'}`}
            aria-label="More options"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </button>
        </td>
      </tr>

      {/* Detail row */}
      {showDetails && (
        <tr className="animate-fade-in">
          <td
            colSpan={8}
            className="px-6 py-3 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]"
            style={{
              borderLeft: displayColor ? `3px solid ${displayColor}` : undefined,
            }}
          >
            <div className="flex flex-wrap items-center gap-6">
              {/* Group */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Group</span>
                <select
                  value={node.groupId || ''}
                  onChange={(e) => updateSubnet(node.id, { groupId: e.target.value || null })}
                  aria-label={`Group for ${intToIp(net)}/${prefix}`}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none cursor-pointer transition-all"
                >
                  <option value="">None</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                {groups.length === 0 && (
                  <span className="text-[10px] text-[var(--color-text-muted)]">Create groups in the toolbar above</span>
                )}
              </div>

              {/* Notes */}
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Notes</span>
                <input
                  type="text"
                  value={node.notes}
                  onChange={(e) => updateSubnet(node.id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  aria-label={`Notes for ${intToIp(net)}/${prefix}`}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none transition-all"
                />
              </div>

              {/* Quick info */}
              <div className="hidden md:flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                <span className="font-mono">Total: {totalAddresses(prefix).toLocaleString()}</span>
                <span className="font-mono">Broadcast: {intToIp(broadcast)}</span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
