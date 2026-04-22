import { useState, useRef } from 'react';
import { useStore } from '../store';
import { SUBNET_COLORS } from '../constants';
import { importFromJson } from '../lib/export';

export default function Toolbar() {
  const groups = useStore((s) => s.groups);
  const addGroup = useStore((s) => s.addGroup);
  const removeGroup = useStore((s) => s.removeGroup);
  const exportState = useStore((s) => s.exportState);
  const importState = useStore((s) => s.importState);

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(SUBNET_COLORS[5]);
  const [importError, setImportError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addGroup(newName.trim(), newColor);
    setNewName('');
    setShowAddGroup(false);
  };

  const handleExport = () => {
    const json = exportState();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subnet-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(false);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const data = importFromJson(reader.result);
        if (data) {
          importState(reader.result);
        } else {
          setImportError(true);
          setTimeout(() => setImportError(false), 3000);
        }
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Groups label + chips */}
        <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Groups</span>

        {groups.map((g) => (
          <span
            key={g.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] bg-[var(--color-surface-alt)]"
          >
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
            {g.name}
            <button
              onClick={() => removeGroup(g.id)}
              className="ml-0.5 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
              aria-label={`Remove group ${g.name}`}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}

        {/* Add group button / inline form */}
        {showAddGroup ? (
          <form onSubmit={handleAddGroup} className="inline-flex items-center gap-1.5">
            <div className="flex gap-1">
              {SUBNET_COLORS.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className="w-4 h-4 rounded-full transition-transform hover:scale-125"
                  style={{
                    backgroundColor: c,
                    outline: newColor === c ? '2px solid white' : 'none',
                    outlineOffset: '1px',
                  }}
                />
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Group name"
              autoFocus
              className="w-28 px-2 py-1 rounded-lg text-xs bg-[var(--color-surface-alt)] border border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newName.trim()}
              className="px-2 py-1 rounded-lg text-xs font-medium bg-ahead-blue text-white hover:bg-ahead-blue-light disabled:opacity-40 transition-all"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setShowAddGroup(false); setNewName(''); }}
              className="px-1.5 py-1 rounded-lg text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setShowAddGroup(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-ahead-cyan hover:bg-ahead-cyan/10 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Group
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Export / Import */}
        <button
          onClick={handleExport}
          aria-label="Export configuration as JSON"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-all"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </button>
        <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-all cursor-pointer">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Import
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>

      {importError && (
        <p className="text-xs text-red-400 animate-fade-in">Invalid file format. Please use a valid subnet config JSON.</p>
      )}
    </div>
  );
}
