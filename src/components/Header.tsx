import NetworkInput from './NetworkInput';
import CloudModeSelector from './CloudModeSelector';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="glass sticky top-0 z-50 border-b border-[var(--color-border)]">
      <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ahead-blue flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">Subnet Calculator</h1>
            <p className="text-xs text-[var(--color-text-muted)]">
              <span className="font-serif italic">by</span> AHEAD
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <NetworkInput />
          <CloudModeSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
