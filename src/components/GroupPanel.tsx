import { useState } from 'react';
import { useStore } from '../store';
import { SUBNET_COLORS } from '../constants';

export default function GroupPanel() {
  const groups = useStore((s) => s.groups);
  const addGroup = useStore((s) => s.addGroup);
  const removeGroup = useStore((s) => s.removeGroup);
  const updateGroup = useStore((s) => s.updateGroup);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(SUBNET_COLORS[5]); // ahead cyan

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addGroup(newName.trim(), newColor);
    setNewName('');
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <h2 className="text-sm font-semibold">Groups</h2>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">Organize subnets logically</p>
      </div>

      {/* Group list */}
      <div className="divide-y divide-[var(--color-border)]">
        {groups.map((g) => (
          <div key={g.id} className="flex items-center gap-2 px-4 py-2.5 group">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: g.color }}
            />
            <input
              type="text"
              value={g.name}
              onChange={(e) => updateGroup(g.id, { name: e.target.value })}
              className="
                flex-1 text-sm bg-transparent border-none outline-none
                focus:underline decoration-ahead-cyan underline-offset-4
              "
            />
            <button
              onClick={() => removeGroup(g.id)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
              title="Remove group"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}

        {groups.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
            No groups yet
          </div>
        )}
      </div>

      {/* Add group form */}
      <form onSubmit={handleAdd} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="appearance-none w-6 h-6 rounded-full cursor-pointer border-2 border-[var(--color-border)]"
              style={{ backgroundColor: newColor }}
            >
              {SUBNET_COLORS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Group name..."
            className="
              flex-1 px-2 py-1.5 rounded-lg text-xs
              bg-[var(--color-surface)] border border-[var(--color-border)]
              focus:border-ahead-cyan focus:outline-none
              transition-colors
            "
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="
              px-3 py-1.5 rounded-lg text-xs font-medium
              bg-ahead-blue text-white
              hover:bg-ahead-blue-light
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all
            "
          >
            Add
          </button>
        </div>
      </form>
    </div>
  );
}
