import { useRef, useState } from 'react';
import { useStore } from '../store';
import { importFromJson } from '../lib/export';

export default function ExportImportBar() {
  const exportState = useStore((s) => s.exportState);
  const importState = useStore((s) => s.importState);
  const rootNode = useStore((s) => s.rootNode);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState(false);

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
      <div className="flex items-center gap-2">
        <button
          onClick={handleExport}
          disabled={!rootNode}
          aria-label="Export configuration as JSON"
          className="
            flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium
            border border-[var(--color-border)]
            hover:bg-[var(--color-surface-hover)]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all
          "
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </button>
        <label className="
          flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer
          border border-[var(--color-border)]
          hover:bg-[var(--color-surface-hover)]
          transition-all
        ">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Import
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" aria-label="Import JSON configuration file" />
        </label>
      </div>
      {importError && (
        <p className="text-xs text-red-400 animate-fade-in">Invalid file format. Please use a valid subnet config JSON.</p>
      )}
    </div>
  );
}
