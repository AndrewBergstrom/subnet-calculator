import type { CloudMode } from '../types';
import { useStore } from '../store';

const modes: { value: CloudMode; label: string; desc: string }[] = [
  { value: 'none', label: 'Standard', desc: '2 reserved' },
  { value: 'azure', label: 'Azure', desc: '5 reserved' },
  { value: 'aws', label: 'AWS', desc: '5 reserved' },
];

export default function CloudModeSelector() {
  const cloudMode = useStore((s) => s.cloudMode);
  const setCloudMode = useStore((s) => s.setCloudMode);

  return (
    <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-1">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setCloudMode(m.value)}
          title={`${m.label}: ${m.desc} IPs per subnet`}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1.5
            ${cloudMode === m.value
              ? 'bg-ahead-blue text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
            }
          `}
        >
          {m.label}
          {cloudMode === m.value && (
            <span className="text-[10px] opacity-80 font-normal">{m.desc}</span>
          )}
        </button>
      ))}
    </div>
  );
}
