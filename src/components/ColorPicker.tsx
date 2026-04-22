import { useState, useRef, useEffect } from 'react';
import { SUBNET_COLORS } from '../constants';

interface ColorPickerProps {
  value: string | null;
  onChange: (color: string | null) => void;
}

export default function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
        className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] hover:border-[var(--color-text-muted)] transition-colors hover:scale-110"
        style={{ backgroundColor: value || 'transparent' }}
        aria-label="Pick color"
      />

      {open && (
        <div className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-2 animate-fade-in">
          <div className="grid grid-cols-5 gap-1.5">
            {SUBNET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => { onChange(value === color ? null : color); setOpen(false); }}
                className="w-6 h-6 rounded-full transition-all hover:scale-110 border-2"
                style={{
                  backgroundColor: color,
                  borderColor: value === color ? 'white' : 'transparent',
                  boxShadow: value === color ? `0 0 0 2px ${color}` : 'none',
                }}
              />
            ))}
          </div>
          {value && (
            <button
              onClick={() => { onChange(null); setOpen(false); }}
              className="w-full mt-1.5 text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] py-1 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
