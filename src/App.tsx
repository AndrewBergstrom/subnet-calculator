import { useStore } from './store';
import Header from './components/Header';
import SubnetTable from './components/SubnetTable';
import GroupPanel from './components/GroupPanel';
import SummaryStats from './components/SummaryStats';
import ExportImportBar from './components/ExportImportBar';
import EmptyState from './components/EmptyState';

export default function App() {
  const rootNode = useStore((s) => s.rootNode);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-6 py-6">
        {!rootNode ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Summary stats */}
            <SummaryStats />

            {/* Main content area */}
            <div className="flex gap-6 items-start">
              {/* Subnet table */}
              <div className="flex-1 min-w-0">
                <SubnetTable />
              </div>

              {/* Sidebar */}
              <div className="w-64 shrink-0 space-y-4 sticky top-20">
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
