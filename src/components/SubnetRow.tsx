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
  const [showNotes, setShowNotes] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
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
          group flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-3 px-3 md:px-4 py-2.5
          border-b border-[var(--color-border)]
          hover:bg-[var(--color-surface-hover)] transition-colors duration-150
        "
        style={{
          paddingLeft: `${Math.min(depth * 20, 80) + 12}px`,
          borderLeft: displayColor ? `4px solid ${displayColor}` : '4px solid transparent',
          backgroundColor: displayColor ? `${displayColor}10` : undefined,
        }}
      >
        {/* Network / CIDR */}
        <div className="w-full md:w-40 shrink-0">
          <span className="font-mono text-sm font-medium">
            {intToIp(net)}/{prefix}
          </span>
        </div>

        {/* Subnet Mask */}
        <div className="hidden md:block w-32 shrink-0 font-mono text-xs text-[var(--color-text-secondary)]">
          {subnetMaskString(prefix)}
        </div>

        {/* Usable Range */}
        <div className="hidden lg:block w-64 shrink-0 font-mono text-xs text-[var(--color-text-secondary)]">
          {prefix < 31 ? `${intToIp(first)} - ${intToIp(last)}` : intToIp(net)}
        </div>

        {/* Hosts */}
        <div className="shrink-0 md:w-20 md:text-right">
          <span className="font-mono text-sm">{usable.toLocaleString()}</span>
          <span className="text-xs text-[var(--color-text-muted)] ml-1">/ {total.toLocaleString()}</span>
        </div>

        {/* Broadcast */}
        <div className="hidden xl:block w-28 shrink-0 font-mono text-xs text-[var(--color-text-muted)]">
          {intToIp(broadcast)}
        </div>

        {/* Label */}
        {isLeaf && (
          <input
            type="text"
            value={node.label}
            onChange={(e) => updateSubnet(node.id, { label: e.target.value })}
            placeholder="Label..."
            aria-label={`Label for subnet ${intToIp(net)}/${prefix}`}
            className="
              flex-1 min-w-[80px] px-2 py-1 rounded-lg text-xs
              bg-transparent border border-transparent
              hover:border-[var(--color-border)]
              focus:border-ahead-cyan focus:outline-none
              transition-all duration-150
            "
          />
        )}
        {!isLeaf && <div className="flex-1 min-w-[80px]" />}

        {/* Actions — visible on hover (desktop) or always (mobile) */}
        <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100 transition-opacity duration-150 shrink-0">
          {isLeaf && (
            <>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors"
                aria-label="Set color"
              >
                <div
                  className="w-3.5 h-3.5 rounded-full border border-[var(--color-border)]"
                  style={{ backgroundColor: displayColor || 'transparent' }}
                />
              </button>

              <button
                onClick={() => setShowNotes(!showNotes)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-surface-alt)] transition-colors text-[var(--color-text-muted)]"
                aria-label="Toggle notes"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
              </button>

              <select
                value={node.groupId || ''}
                onChange={(e) => updateSubnet(node.id, { groupId: e.target.value || null })}
                aria-label={`Group for subnet ${intToIp(net)}/${prefix}`}
                className="
                  text-xs px-1 py-1 rounded-lg
                  bg-transparent border border-transparent
                  hover:border-[var(--color-border)]
                  focus:border-ahead-cyan focus:outline-none
                  transition-all cursor-pointer
                  text-[var(--color-text-muted)]
                "
              >
                <option value="">No group</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </>
          )}

          {isLeaf && canSplit(prefix) && (
            <button
              onClick={() => splitSubnet(node.id)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-ahead-cyan/10 text-ahead-cyan hover:bg-ahead-cyan/20 transition-colors"
              aria-label={`Split subnet ${intToIp(net)}/${prefix}`}
            >
              Split
            </button>
          )}

          {!isLeaf && (
            <button
              onClick={() => joinSubnet(node.id)}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 transition-colors"
              aria-label={`Join subnet ${intToIp(net)}/${prefix}`}
            >
              Join
            </button>
          )}
        </div>
      </div>

      {/* Color picker row */}
      {showColorPicker && isLeaf && (
        <div className="px-3 md:px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] animate-fade-in"
             style={{ paddingLeft: `${Math.min(depth * 20, 80) + 12}px` }}>
          <ColorPicker value={node.color} onChange={(c) => updateSubnet(node.id, { color: c })} />
        </div>
      )}

      {/* Notes row */}
      {showNotes && isLeaf && (
        <div className="px-3 md:px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] animate-fade-in"
             style={{ paddingLeft: `${Math.min(depth * 20, 80) + 12}px` }}>
          <textarea
            value={node.notes}
            onChange={(e) => updateSubnet(node.id, { notes: e.target.value })}
            placeholder="Add notes about this subnet..."
            aria-label={`Notes for subnet ${intToIp(net)}/${prefix}`}
            rows={2}
            className="
              w-full px-3 py-2 rounded-lg text-xs font-mono
              bg-[var(--color-surface)] border border-[var(--color-border)]
              focus:border-ahead-cyan focus:outline-none
              resize-y transition-colors
            "
          />
        </div>
      )}
    </div>
  );
}
