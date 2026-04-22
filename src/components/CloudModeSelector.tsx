import type { CloudMode } from '../types';
import { useStore } from '../store';

const modes: { value: CloudMode; label: string }[] = [
  { value: 'none', label: 'Standard' },
  { value: 'azure', label: 'Azure' },
  { value: 'aws', label: 'AWS' },
];

export default function CloudModeSelector() {
  const cloudMode = useStore((s) => s.cloudMode);
  const setCloudMode = useStore((s) => s.setCloudMode);

  return (
    <div className="flex items-center rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-0.5">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setCloudMode(m.value)}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
            ${cloudMode === m.value
              ? 'bg-ahead-blue text-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }
          `}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
