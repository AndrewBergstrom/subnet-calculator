import { useState } from 'react';
import { isValidCidr } from '../lib/subnet-math';
import { useStore } from '../store';

export default function NetworkInput() {
  const [value, setValue] = useState('10.0.0.0/16');
  const setNetwork = useStore((s) => s.setNetwork);
  const valid = value === '' || isValidCidr(value);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidCidr(value)) {
      setNetwork(value);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. 10.0.0.0/16"
          className={`
            w-40 md:w-52 px-3 md:px-4 py-2 rounded-xl font-mono text-sm
            bg-[var(--color-surface-alt)] border
            outline-none transition-all duration-200
            focus:ring-2 focus:ring-ahead-cyan/40
            ${valid
              ? 'border-[var(--color-border)] focus:border-ahead-cyan'
              : 'border-red-400 focus:border-red-400 ring-2 ring-red-400/30'
            }
          `}
        />
      </div>
      <button
        type="submit"
        disabled={!isValidCidr(value)}
        className="
          px-5 py-2 rounded-xl text-sm font-medium
          bg-ahead-blue text-white
          hover:bg-ahead-blue-light active:scale-95
          disabled:opacity-40 disabled:cursor-not-allowed
          transition-all duration-200
        "
      >
        Calculate
      </button>
    </form>
  );
}
