import { create } from 'zustand';
import type { AppState, SubnetNode, CloudMode, ColumnVisibility, SavedProject } from './types';
import { DEFAULT_COLUMNS } from './types';
import { parseCidr, networkAddress } from './lib/subnet-math';
import { exportToJson, importFromJson } from './lib/export';
import { loadProjects, saveProjects, setActiveProjectId } from './lib/projects';

function createNode(netAddr: number, cidr: number, id: string): SubnetNode {
  return {
    id,
    networkAddress: netAddr,
    cidr,
    children: null,
    label: '',
    notes: '',
    color: null,
    groupId: null,
  };
}

function findNode(node: SubnetNode, targetId: string): SubnetNode | null {
  if (node.id === targetId) return node;
  if (!node.children) return null;
  return findNode(node.children[0], targetId) || findNode(node.children[1], targetId);
}

function cloneTree(node: SubnetNode, mutator?: (n: SubnetNode) => SubnetNode): SubnetNode {
  const mutated = mutator ? mutator({ ...node }) : { ...node };
  if (mutated.children) {
    mutated.children = [
      cloneTree(mutated.children[0], mutator),
      cloneTree(mutated.children[1], mutator),
    ];
  }
  return mutated;
}

function splitNode(node: SubnetNode): SubnetNode {
  if (node.cidr >= 32 || node.children) return node;
  const newCidr = node.cidr + 1;
  const halfSize = Math.pow(2, 32 - newCidr);
  return {
    ...node,
    label: '',
    notes: '',
    color: null,
    groupId: null,
    children: [
      createNode(node.networkAddress, newCidr, `${node.id}-0`),
      createNode((node.networkAddress + halfSize) >>> 0, newCidr, `${node.id}-1`),
    ],
  };
}

// --- URL state encoding ---

function encodeStateToUrl(state: Pick<AppState, 'rootNode' | 'groups' | 'cloudMode' | 'columns'>): void {
  try {
    const data = {
      v: 1,
      r: state.rootNode,
      g: state.groups,
      c: state.cloudMode,
      cols: state.columns,
    };
    const json = JSON.stringify(data);
    const encoded = btoa(encodeURIComponent(json));
    window.history.replaceState(null, '', `#${encoded}`);
  } catch {
    // Silently fail
  }
}

function decodeStateFromUrl(): { rootNode: SubnetNode; groups: any[]; cloudMode: CloudMode; columns?: ColumnVisibility } | null {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    const json = decodeURIComponent(atob(hash));
    const data = JSON.parse(json);
    if (data.v !== 1 || !data.r) return null;
    return {
      rootNode: data.r,
      groups: data.g || [],
      cloudMode: data.c || 'none',
      columns: data.cols,
    };
  } catch {
    return null;
  }
}

// --- Sync URL for sharing ---

function syncUrl(state: Pick<AppState, 'rootNode' | 'groups' | 'cloudMode' | 'columns'>): void {
  encodeStateToUrl(state);
}

// Load initial state from URL only (for shared links)
let urlState: ReturnType<typeof decodeStateFromUrl> = null;
let initialProjects: SavedProject[] = [];

try {
  urlState = decodeStateFromUrl();
  initialProjects = loadProjects();
} catch {
  // Start fresh on any error
}

export const useStore = create<AppState>((set, get) => ({
  rootNode: urlState?.rootNode || null,
  groups: urlState?.groups || [],
  cloudMode: urlState?.cloudMode || 'none',
  darkMode: true,
  columns: urlState?.columns || { ...DEFAULT_COLUMNS },
  projects: initialProjects,
  activeProjectId: null,

  setNetwork: (cidrStr: string) => {
    const parsed = parseCidr(cidrStr);
    if (!parsed) return;
    const netAddr = networkAddress(parsed.ip, parsed.prefix);
    const rootNode = createNode(netAddr, parsed.prefix, 'root');
    set({ rootNode, groups: [], activeProjectId: null });
    syncUrl(get());
  },

  splitSubnet: (nodeId: string) => {
    const { rootNode } = get();
    if (!rootNode) return;
    const newRoot = cloneTree(rootNode);
    const target = findNode(newRoot, nodeId);
    if (!target || target.children || target.cidr >= 32) return;
    const split = splitNode(target);
    Object.assign(target, split);
    set({ rootNode: newRoot });
    syncUrl(get());
  },

  joinSubnet: (nodeId: string) => {
    const { rootNode } = get();
    if (!rootNode) return;
    const newRoot = cloneTree(rootNode);
    const target = findNode(newRoot, nodeId);
    if (!target || !target.children) return;
    target.children = null;
    target.label = '';
    target.notes = '';
    target.color = null;
    target.groupId = null;
    set({ rootNode: newRoot });
    syncUrl(get());
  },

  updateSubnet: (nodeId, updates) => {
    const { rootNode } = get();
    if (!rootNode) return;
    const newRoot = cloneTree(rootNode);
    const target = findNode(newRoot, nodeId);
    if (!target) return;
    Object.assign(target, updates);
    set({ rootNode: newRoot });
    syncUrl(get());
  },

  addGroup: (name, color) => {
    set((state) => ({
      groups: [...state.groups, { id: crypto.randomUUID(), name, color }],
    }));
    syncUrl(get());
  },

  removeGroup: (groupId) => {
    const { rootNode } = get();
    const newRoot = rootNode
      ? cloneTree(rootNode, (n) => {
          if (n.groupId === groupId) return { ...n, groupId: null };
          return n;
        })
      : null;
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
      rootNode: newRoot,
    }));
    syncUrl(get());
  },

  updateGroup: (groupId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
    }));
    syncUrl(get());
  },

  setCloudMode: (mode: CloudMode) => {
    set({ cloudMode: mode });
    syncUrl(get());
  },

  toggleDarkMode: () => {
    set((state) => {
      const newDark = !state.darkMode;
      document.documentElement.classList.toggle('dark', newDark);
      return { darkMode: newDark };
    });
  },

  toggleColumn: (col: keyof ColumnVisibility) => {
    set((state) => ({
      columns: { ...state.columns, [col]: !state.columns[col] },
    }));
    syncUrl(get());
  },

  reset: () => {
    set({
      rootNode: null,
      groups: [],
      cloudMode: 'none',
      columns: { ...DEFAULT_COLUMNS },
      activeProjectId: null,
    });
    window.history.replaceState(null, '', window.location.pathname);
  },

  exportState: () => {
    const { rootNode, groups, cloudMode } = get();
    return exportToJson(rootNode, groups, cloudMode);
  },

  importState: (json: string) => {
    const data = importFromJson(json);
    if (!data) return;
    // Auto-save imported config as a project
    const project: SavedProject = {
      id: crypto.randomUUID(),
      name: `Import ${new Date().toLocaleDateString()}`,
      savedAt: Date.now(),
      rootNode: data.rootNode,
      groups: data.groups,
      cloudMode: data.cloudMode,
      columns: get().columns,
    };
    const projects = [...get().projects, project];
    saveProjects(projects);
    setActiveProjectId(project.id);
    set({
      rootNode: data.rootNode,
      groups: data.groups,
      cloudMode: data.cloudMode,
      projects,
      activeProjectId: project.id,
    });
    syncUrl(get());
  },

  // --- Project management ---

  saveProject: (name: string) => {
    const { rootNode, groups, cloudMode, columns } = get();
    const project: SavedProject = {
      id: crypto.randomUUID(),
      name,
      savedAt: Date.now(),
      rootNode,
      groups,
      cloudMode,
      columns,
    };
    const projects = [...get().projects, project];
    saveProjects(projects);
    setActiveProjectId(project.id);
    set({ projects, activeProjectId: project.id });
  },

  loadProject: (id: string) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    setActiveProjectId(id);
    set({
      rootNode: project.rootNode,
      groups: project.groups,
      cloudMode: project.cloudMode,
      columns: project.columns || { ...DEFAULT_COLUMNS },
      activeProjectId: id,
    });
    syncUrl(get());
  },

  deleteProject: (id: string) => {
    const projects = get().projects.filter((p) => p.id !== id);
    saveProjects(projects);
    const activeProjectId = get().activeProjectId === id ? null : get().activeProjectId;
    if (get().activeProjectId === id) setActiveProjectId(null);
    set({ projects, activeProjectId });
  },

  renameProject: (id: string, name: string) => {
    const projects = get().projects.map((p) =>
      p.id === id ? { ...p, name } : p
    );
    saveProjects(projects);
    set({ projects });
  },

  updateActiveProject: () => {
    const { activeProjectId, rootNode, groups, cloudMode, columns } = get();
    if (!activeProjectId) return;
    const projects = get().projects.map((p) =>
      p.id === activeProjectId
        ? { ...p, rootNode, groups, cloudMode, columns, savedAt: Date.now() }
        : p
    );
    saveProjects(projects);
    set({ projects });
  },
}));
