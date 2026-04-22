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
  const cloudMode = useStore((s) => s.cloudMode);
  const splitSubnet = useStore((s) => s.splitSubnet);
  const updateSubnet = useStore((s) => s.updateSubnet);

  const net = node.networkAddress;
  const prefix = node.cidr;
  const total = totalAddresses(prefix);
  const usable = usableHosts(prefix, cloudMode);
  const first = firstUsable(net, prefix, cloudMode);
  const last = lastUsable(net, prefix, cloudMode);
  const displayColor = node.color || groupForRow?.color || null;
  const animDelay = Math.min(index * 20, 200);

  // Group border styling
  const groupColor = groupForRow?.color;
  const groupBorder = groupColor ? {
    borderLeft: `3px solid ${groupColor}`,
    borderRight: `3px solid ${groupColor}`,
    ...(isFirstInGroup ? { borderTop: `3px solid ${groupColor}` } : {}),
    ...(isLastInGroup ? { borderBottom: `3px solid ${groupColor}` } : {}),
  } : {};

  return (
    <tr
      className="animate-slide-down border-b border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors duration-100"
      style={{
        animationDelay: `${animDelay}ms`,
        backgroundColor: displayColor ? `${displayColor}08` : undefined,
        ...groupBorder,
      }}
    >
      {/* Color indicator */}
      <td className="w-1 p-0">
        {displayColor && (
          <div className="w-1 h-full min-h-[40px]" style={{ backgroundColor: displayColor }} />
        )}
      </td>

      {/* Network */}
      <td className="px-3 py-2 font-mono text-sm font-medium whitespace-nowrap">
        {intToIp(net)}/{prefix}
      </td>

      {/* Range of addresses (network - broadcast) */}
      <td className="hidden md:table-cell px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
        {`${intToIp(net)} - ${intToIp(broadcastAddress(net, prefix))}`}
      </td>

      {/* Usable IPs */}
      <td className="hidden lg:table-cell px-3 py-2 font-mono text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
        {prefix < 31
          ? `${intToIp(first)} - ${intToIp(last)}`
          : intToIp(net)}
      </td>

      {/* Hosts */}
      <td className="px-3 py-2 text-right font-mono text-sm whitespace-nowrap">
        {usable.toLocaleString()}
      </td>

      {/* Label */}
      <td className="px-2 py-1">
        <input
          type="text"
          value={node.label}
          onChange={(e) => updateSubnet(node.id, { label: e.target.value })}
          placeholder="Label..."
          aria-label={`Label for ${intToIp(net)}/${prefix}`}
          className="w-full px-2 py-1 rounded-md text-xs bg-transparent border border-transparent hover:border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none transition-all"
        />
      </td>

      {/* Color */}
      <td className="px-2 py-1">
        <ColorPicker
          value={node.color}
          onChange={(c) => updateSubnet(node.id, { color: c })}
        />
      </td>

      {/* Group */}
      <td className="px-2 py-1">
        <select
          value={node.groupId || ''}
          onChange={(e) => updateSubnet(node.id, { groupId: e.target.value || null })}
          aria-label={`Group for ${intToIp(net)}/${prefix}`}
          className="text-xs px-1.5 py-1 rounded-md bg-transparent border border-transparent hover:border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none cursor-pointer transition-all max-w-[100px]"
        >
          <option value="">—</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </td>

      {/* Divide */}
      <td className="px-2 py-1 text-center">
        {canSplit(prefix) && (
          <button
            onClick={() => splitSubnet(node.id)}
            className="text-ahead-cyan hover:text-ahead-cyan-light text-xs font-medium hover:underline transition-colors"
            aria-label={`Divide /${prefix} into two /${prefix + 1}s`}
          >
            Divide
          </button>
        )}
      </td>
    </tr>
  );
}
