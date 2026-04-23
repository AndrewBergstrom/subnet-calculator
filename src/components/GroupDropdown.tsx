import { useState, useRef, useEffect } from 'react';
import type { Group } from '../types';

interface GroupDropdownProps {
  value: string | null;
  groups: Group[];
  onChange: (groupId: string | null) => void;
}

export default function GroupDropdown({ value, groups, onChange }: GroupDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = groups.find((g) => g.id === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-text-muted)] focus:border-ahead-cyan focus:outline-none transition-all min-w-[100px]"
      >
        {selected ? (
          <>
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: selected.color }} />
            <span className="truncate">{selected.name}</span>
          </>
        ) : (
          <span className="text-[var(--color-text-muted)]">None</span>
        )}
        <svg className={`w-3 h-3 ml-auto text-[var(--color-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 min-w-[140px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden animate-fade-in">
          {/* None option */}
          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[var(--color-surface-hover)] transition-colors ${!value ? 'text-ahead-cyan' : ''}`}
          >
            {!value && (
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
            {value && <span className="w-3" />}
            <span>None</span>
          </button>

          {groups.length > 0 && <div className="border-t border-[var(--color-border)]" />}

          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => { onChange(g.id); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-[var(--color-surface-hover)] transition-colors ${value === g.id ? 'text-ahead-cyan' : ''}`}
            >
              {value === g.id ? (
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
              )}
              <span className="truncate">{g.name}</span>
            </button>
          ))}

          {groups.length === 0 && (
            <div className="px-3 py-2 text-[10px] text-[var(--color-text-muted)]">
              Create groups in the toolbar above
            </div>
          )}
        </div>
      )}
    </div>
  );
}
