import { useState } from 'react';
import { useStore } from './store';
import Header from './components/Header';
import SubnetTable from './components/SubnetTable';
import Toolbar from './components/Toolbar';
import SummaryStats from './components/SummaryStats';
import EmptyState from './components/EmptyState';
import ProjectsPanel from './components/ProjectsPanel';

export default function App() {
  const rootNode = useStore((s) => s.rootNode);
  const projects = useStore((s) => s.projects);
  const [showProjects, setShowProjects] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)]">
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="flex gap-6 items-start">
          {/* Projects sidebar */}
          <div className="hidden lg:block w-72 shrink-0 sticky top-20">
            <ProjectsPanel />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Mobile projects toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setShowProjects(!showProjects)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                Projects {projects.length > 0 && `(${projects.length})`}
              </button>
              {showProjects && (
                <div className="mt-3 animate-slide-down">
                  <ProjectsPanel />
                </div>
              )}
            </div>

            {!rootNode ? (
              <EmptyState />
            ) : (
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                <SummaryStats />
                <Toolbar />
                <SubnetTable />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
