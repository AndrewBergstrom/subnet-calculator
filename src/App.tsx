import { useState } from 'react';
import { useStore } from './store';
import Header from './components/Header';
import SubnetTable from './components/SubnetTable';
import GroupPanel from './components/GroupPanel';
import SummaryStats from './components/SummaryStats';
import ExportImportBar from './components/ExportImportBar';
import EmptyState from './components/EmptyState';

export default function App() {
  const rootNode = useStore((s) => s.rootNode);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
        {!rootNode ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 md:space-y-6 animate-fade-in">
            <SummaryStats />

            {/* Mobile sidebar toggle */}
            <div className="lg:hidden flex gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
                Groups & Export
              </button>
            </div>

            {/* Mobile sidebar drawer */}
            {sidebarOpen && (
              <div className="lg:hidden space-y-4 animate-slide-down">
                <GroupPanel />
                <ExportImportBar />
              </div>
            )}

            <div className="flex gap-6 items-start">
              {/* Subnet table */}
              <div className="flex-1 min-w-0 overflow-x-auto">
                <SubnetTable />
              </div>

              {/* Desktop sidebar */}
              <div className="hidden lg:block w-64 shrink-0 space-y-4 sticky top-20">
                <GroupPanel />
                <ExportImportBar />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
