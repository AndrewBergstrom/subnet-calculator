import { useState } from 'react';
import type { SubnetNode, Group } from '../types';
import { intToIp, subnetMaskString, totalAddresses, usableHosts, firstUsable, lastUsable, broadcastAddress, canSplit } from '../lib/subnet-math';
import { useStore } from '../store';
import ColorPicker from './ColorPicker';

interface SubnetRowProps {
  node: SubnetNode;
  depth: number;
  index: number;
  groups: Group[];
}

export default function SubnetRow({ node, depth, index, groups }: SubnetRowProps) {
  const [expanded, setExpanded] = useState(false);
  const cloudMode = useStore((s) => s.cloudMode);
  const splitSubnet = useStore((s) => s.splitSubnet);
  const joinSubnet = useStore((s) => s.joinSubnet);
  const updateSubnet = useStore((s) => s.updateSubnet);

  const net = node.networkAddress;
  const prefix = node.cidr;
  const total = totalAddresses(prefix);
  const usable = usableHosts(prefix, cloudMode);
  const first = firstUsable(net, prefix, cloudMode);
  const last = lastUsable(net, prefix, cloudMode);
  const broadcast = broadcastAddress(net, prefix);
  const isLeaf = !node.children;
  const group = groups.find((g) => g.id === node.groupId);
  const displayColor = node.color || group?.color || null;
  const animDelay = Math.min(index * 30, 300);

  return (
    <div
      className="animate-slide-down"
      style={{ animationDelay: `${animDelay}ms` }}
    >
      <div
        className="
          flex items-center gap-3 px-4 py-2.5
          border-b border-[var(--color-border)]
          hover:bg-[var(--color-surface-hover)] transition-colors duration-150
          cursor-default
        "
        style={{
          paddingLeft: `${Math.min(depth * 24, 96) + 16}px`,
          borderLeft: displayColor ? `4px solid ${displayColor}` : '4px solid transparent',
          backgroundColor: displayColor ? `${displayColor}10` : undefined,
        }}
      >
        {/* Expand toggle (leaf only) */}
        {isLeaf ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 rounded transition-transform duration-150 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
            aria-label={expanded ? 'Collapse details' : 'Expand details'}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        ) : (
          <div className="w-4" />
        )}

        {/* Network / CIDR */}
        <div className="w-36 shrink-0">
          <span className="font-mono text-sm font-medium">
            {intToIp(net)}/{prefix}
          </span>
        </div>

        {/* Subnet Mask */}
        <div className="hidden md:block w-28 shrink-0 font-mono text-xs text-[var(--color-text-secondary)]">
          {subnetMaskString(prefix)}
        </div>

        {/* Usable Range */}
        <div className="hidden lg:block w-56 shrink-0 font-mono text-xs text-[var(--color-text-secondary)]">
          {prefix < 31 ? `${intToIp(first)} - ${intToIp(last)}` : intToIp(net)}
        </div>

        {/* Hosts */}
        <div className="w-16 shrink-0 text-right">
          <span className="font-mono text-sm">{usable.toLocaleString()}</span>
        </div>

        {/* Label (inline) */}
        {isLeaf ? (
          <input
            type="text"
            value={node.label}
            onChange={(e) => updateSubnet(node.id, { label: e.target.value })}
            placeholder="Add label..."
            aria-label={`Label for subnet ${intToIp(net)}/${prefix}`}
            className="
              flex-1 min-w-[100px] px-2 py-1 rounded-lg text-xs
              bg-transparent border border-transparent
              hover:border-[var(--color-border)]
              focus:border-ahead-cyan focus:outline-none
              transition-all duration-150
            "
          />
        ) : (
          <div className="flex-1 min-w-[100px] text-xs text-[var(--color-text-muted)] italic px-2">
            {node.children ? `Split into /${prefix + 1}` : ''}
          </div>
        )}

        {/* Group badge */}
        {group && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-[var(--color-border)]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }} />
            {group.name}
          </span>
        )}

        {/* Split / Join — always visible */}
        {isLeaf && canSplit(prefix) && (
          <button
            onClick={() => splitSubnet(node.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-ahead-cyan/10 text-ahead-cyan hover:bg-ahead-cyan/20 transition-colors shrink-0"
            aria-label={`Split /${prefix} into two /${prefix + 1}s`}
          >
            Split
          </button>
        )}

        {!isLeaf && (
          <button
            onClick={() => joinSubnet(node.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors shrink-0"
            aria-label={`Join back into /${prefix}`}
          >
            Join
          </button>
        )}
      </div>

      {/* Expanded detail panel */}
      {expanded && isLeaf && (
        <div
          className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] animate-slide-down space-y-3"
          style={{
            paddingLeft: `${Math.min(depth * 24, 96) + 16}px`,
            borderLeft: displayColor ? `4px solid ${displayColor}` : '4px solid transparent',
          }}
        >
          {/* Detail grid */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <div>
              <span className="text-[var(--color-text-muted)]">Mask: </span>
              <span className="font-mono">{subnetMaskString(prefix)}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Range: </span>
              <span className="font-mono">{prefix < 31 ? `${intToIp(first)} - ${intToIp(last)}` : intToIp(net)}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Broadcast: </span>
              <span className="font-mono">{intToIp(broadcast)}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Total: </span>
              <span className="font-mono">{total.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-muted)]">Usable: </span>
              <span className="font-mono">{usable.toLocaleString()}</span>
            </div>
          </div>

          {/* Color */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-muted)] w-12">Color</span>
            <ColorPicker value={node.color} onChange={(c) => updateSubnet(node.id, { color: c })} />
          </div>

          {/* Group */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--color-text-muted)] w-12">Group</span>
            <select
              value={node.groupId || ''}
              onChange={(e) => updateSubnet(node.id, { groupId: e.target.value || null })}
              aria-label={`Group for subnet ${intToIp(net)}/${prefix}`}
              className="
                text-xs px-2 py-1 rounded-lg
                bg-[var(--color-surface)] border border-[var(--color-border)]
                focus:border-ahead-cyan focus:outline-none
                transition-all cursor-pointer
              "
            >
              <option value="">None</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            {groups.length === 0 && (
              <span className="text-[10px] text-[var(--color-text-muted)]">Create a group above first</span>
            )}
          </div>

          {/* Notes */}
          <div className="flex items-start gap-3">
            <span className="text-xs text-[var(--color-text-muted)] w-12 pt-1">Notes</span>
            <textarea
              value={node.notes}
              onChange={(e) => updateSubnet(node.id, { notes: e.target.value })}
              placeholder="Add notes about this subnet..."
              aria-label={`Notes for subnet ${intToIp(net)}/${prefix}`}
              rows={2}
              className="
                flex-1 px-3 py-2 rounded-lg text-xs font-mono
                bg-[var(--color-surface)] border border-[var(--color-border)]
                focus:border-ahead-cyan focus:outline-none
                resize-y transition-colors
              "
            />
          </div>
        </div>
      )}
    </div>
  );
}
