import { useState } from 'react';
import type { SubnetNode, Group } from '../types';
import { intToIp, totalAddresses, usableHosts, firstUsable, lastUsable, broadcastAddress, canSplit } from '../lib/subnet-math';
import { useStore } from '../store';
import { SUBNET_COLORS } from '../constants';

interface SubnetRowProps {
  node: SubnetNode;
  index: number;
  groups: Group[];
  canMerge: boolean;
  mergeParentId?: string;
  mergeCidr?: number;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  groupForRow?: Group;
}

export default function SubnetRow({ node, index, groups, canMerge, mergeParentId, mergeCidr, isFirstInGroup, isLastInGroup, groupForRow }: SubnetRowProps) {
  const [expanded, setExpanded] = useState(false);
  const cloudMode = useStore((s) => s.cloudMode);
  const splitSubnet = useStore((s) => s.splitSubnet);
  const joinSubnet = useStore((s) => s.joinSubnet);
  const updateSubnet = useStore((s) => s.updateSubnet);

  const net = node.networkAddress;
  const prefix = node.cidr;
  const usable = usableHosts(prefix, cloudMode);
  const first = firstUsable(net, prefix, cloudMode);
  const last = lastUsable(net, prefix, cloudMode);
  const broadcast = broadcastAddress(net, prefix);
  const displayColor = node.color || groupForRow?.color || null;
  const animDelay = Math.min(index * 20, 200);

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
        className="animate-slide-down border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors duration-100 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        style={{
          animationDelay: `${animDelay}ms`,
          ...groupBorderStyle,
        }}
      >
        {/* Color bar */}
        <td className="w-1.5 p-0">
          <div
            className="w-1.5 h-full min-h-[44px]"
            style={{ backgroundColor: displayColor || 'transparent' }}
          />
        </td>

        {/* Network */}
        <td className="px-4 py-3 font-mono text-sm font-medium whitespace-nowrap">
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
        <td className="px-3 py-1.5" onClick={(e) => e.stopPropagation()}>
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
        <td className="px-3 py-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
          {canSplit(prefix) ? (
            <button
              onClick={() => splitSubnet(node.id)}
              className="text-ahead-cyan hover:text-ahead-cyan-light text-xs font-medium hover:underline underline-offset-2 transition-colors"
            >
              Divide
            </button>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">—</span>
          )}
        </td>

        {/* Expand indicator */}
        <td className="pr-4 py-3 text-center">
          <svg
            className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </td>
      </tr>

      {/* Detail panel */}
      {expanded && (
        <tr className="animate-fade-in">
          <td className="p-0 w-1.5">
            <div className="w-1.5 h-full" style={{ backgroundColor: displayColor || 'transparent' }} />
          </td>
          <td
            colSpan={7}
            className="px-4 py-4 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)]"
          >
            <div className="space-y-4">
              {/* Color selection */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-14 shrink-0">Color</span>
                <div className="flex items-center gap-2">
                  {SUBNET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateSubnet(node.id, { color: node.color === color ? null : color })}
                      className={`w-6 h-6 rounded-full transition-all hover:scale-110 ${node.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--color-surface-alt)]' : ''}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Set color to ${color}`}
                    />
                  ))}
                  {node.color && (
                    <button
                      onClick={() => updateSubnet(node.id, { color: null })}
                      className="text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] ml-1 underline underline-offset-2"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Group */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-14 shrink-0">Group</span>
                <select
                  value={node.groupId || ''}
                  onChange={(e) => updateSubnet(node.id, { groupId: e.target.value || null })}
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
              <div className="flex items-start gap-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] w-14 shrink-0 pt-1.5">Notes</span>
                <input
                  type="text"
                  value={node.notes}
                  onChange={(e) => updateSubnet(node.id, { notes: e.target.value })}
                  placeholder="Add notes about this subnet..."
                  className="flex-1 max-w-md px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none transition-all"
                />
              </div>

              {/* Subnet details + Merge */}
              <div className="flex items-center justify-between flex-wrap gap-3 pt-1 border-t border-[var(--color-border)]">
                <div className="flex items-center gap-5 text-xs text-[var(--color-text-secondary)] font-mono">
                  <span>Total: {totalAddresses(prefix).toLocaleString()}</span>
                  <span>Broadcast: {intToIp(broadcast)}</span>
                  <span>/{prefix} = {usable.toLocaleString()} usable hosts</span>
                </div>

                {canMerge && mergeParentId && (
                  <button
                    onClick={() => joinSubnet(mergeParentId)}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
                  >
                    Merge back into /{mergeCidr}
                  </button>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
