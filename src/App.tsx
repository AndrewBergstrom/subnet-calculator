import { useStore } from './store';
import Header from './components/Header';
import SubnetTable from './components/SubnetTable';
import Toolbar from './components/Toolbar';
import SummaryStats from './components/SummaryStats';
import EmptyState from './components/EmptyState';

export default function App() {
  const rootNode = useStore((s) => s.rootNode);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header />

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
        {!rootNode ? (
          <EmptyState />
        ) : (
          <div className="space-y-4 md:space-y-6 animate-fade-in">
            <SummaryStats />
            <Toolbar />
            <SubnetTable />
          </div>
        )}
      </main>
    </div>
  );
}
