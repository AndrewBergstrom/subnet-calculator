import { useState } from 'react';
import { useStore } from '../store';
import { intToIp } from '../lib/subnet-math';

function collectLeafCount(node: any): number {
  if (!node?.children) return 1;
  return collectLeafCount(node.children[0]) + collectLeafCount(node.children[1]);
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ProjectsPanel() {
  const projects = useStore((s) => s.projects);
  const activeProjectId = useStore((s) => s.activeProjectId);
  const rootNode = useStore((s) => s.rootNode);
  const saveProject = useStore((s) => s.saveProject);
  const loadProject = useStore((s) => s.loadProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const renameProject = useStore((s) => s.renameProject);

  const updateActiveProject = useStore((s) => s.updateActiveProject);

  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    saveProject(saveName.trim());
    setSaveName('');
    setShowSave(false);
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      renameProject(id, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">Projects</span>
          {rootNode && !showSave && (
            <div className="flex items-center gap-3">
              {activeProjectId && (
                <button
                  onClick={updateActiveProject}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  title="Save changes to current project"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Save
                </button>
              )}
              <button
                onClick={() => setShowSave(true)}
                className="inline-flex items-center gap-1 text-[10px] font-medium text-ahead-cyan hover:text-ahead-cyan-light transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Save As
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline save form */}
      {showSave && (
        <form onSubmit={handleSave} className="mt-2.5 px-1 animate-fade-in">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Project name..."
              autoFocus
              className="flex-1 px-2 py-1 rounded-md text-xs bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-ahead-cyan focus:outline-none"
            />
            <button
              type="submit"
              disabled={!saveName.trim()}
              className="text-xs font-medium text-ahead-cyan hover:text-ahead-cyan-light disabled:opacity-30 transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => { setShowSave(false); setSaveName(''); }}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Project list */}
      <div className="divide-y divide-[var(--color-border)]">
        {projects.length === 0 && (
          <div className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
            No saved projects yet. Create a subnet layout and click "Save As" to keep it.
          </div>
        )}

        {projects
          .sort((a, b) => b.savedAt - a.savedAt)
          .map((project) => {
            const isActive = project.id === activeProjectId;
            const leafCount = project.rootNode ? collectLeafCount(project.rootNode) : 0;
            const networkStr = project.rootNode
              ? `${intToIp(project.rootNode.networkAddress)}/${project.rootNode.cidr}`
              : 'Empty';

            return (
              <div
                key={project.id}
                className={`px-4 py-3 group transition-colors ${isActive ? 'bg-ahead-blue/5 border-l-2 border-l-ahead-blue' : 'hover:bg-[var(--color-surface-hover)]'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === project.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleRename(project.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(project.id); if (e.key === 'Escape') setEditingId(null); }}
                        autoFocus
                        className="w-full px-1.5 py-0.5 rounded text-xs font-medium bg-[var(--color-surface)] border border-ahead-cyan outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => loadProject(project.id)}
                        className="text-left w-full"
                      >
                        <div className="text-xs font-medium truncate flex items-center gap-1.5">
                          {project.name}
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-ahead-blue/20 text-ahead-cyan font-semibold">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{networkStr}</span>
                          <span>{leafCount} subnets</span>
                          <span>{project.cloudMode !== 'none' ? project.cloudMode.toUpperCase() : ''}</span>
                        </div>
                        <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {timeAgo(project.savedAt)}
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => { setEditingId(project.id); setEditName(project.name); }}
                      className="p-1 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                      title="Rename"
                      aria-label={`Rename ${project.name}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-1 rounded hover:bg-red-500/10 text-[var(--color-text-muted)] hover:text-red-400 transition-colors"
                      title="Delete"
                      aria-label={`Delete ${project.name}`}
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
