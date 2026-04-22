import { create } from 'zustand';
import type { AppState, SubnetNode, CloudMode, ColumnVisibility } from './types';
import { DEFAULT_COLUMNS } from './types';
import { parseCidr, networkAddress } from './lib/subnet-math';
import { exportToJson, importFromJson } from './lib/export';

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
    // Silently fail — URL sharing is optional
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

// Try to load initial state from URL
const urlState = decodeStateFromUrl();

export const useStore = create<AppState>((set, get) => ({
  rootNode: urlState?.rootNode || null,
  groups: urlState?.groups || [],
  cloudMode: urlState?.cloudMode || 'none',
  darkMode: true,
  columns: urlState?.columns || { ...DEFAULT_COLUMNS },

  setNetwork: (cidrStr: string) => {
    const parsed = parseCidr(cidrStr);
    if (!parsed) return;
    const netAddr = networkAddress(parsed.ip, parsed.prefix);
    const rootNode = createNode(netAddr, parsed.prefix, 'root');
    set({ rootNode, groups: [] });
    const state = get();
    encodeStateToUrl(state);
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
    encodeStateToUrl(get());
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
    encodeStateToUrl(get());
  },

  updateSubnet: (nodeId, updates) => {
    const { rootNode } = get();
    if (!rootNode) return;
    const newRoot = cloneTree(rootNode);
    const target = findNode(newRoot, nodeId);
    if (!target) return;
    Object.assign(target, updates);
    set({ rootNode: newRoot });
    encodeStateToUrl(get());
  },

  addGroup: (name, color) => {
    set((state) => ({
      groups: [...state.groups, { id: crypto.randomUUID(), name, color }],
    }));
    encodeStateToUrl(get());
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
    encodeStateToUrl(get());
  },

  updateGroup: (groupId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
    }));
    encodeStateToUrl(get());
  },

  setCloudMode: (mode: CloudMode) => {
    set({ cloudMode: mode });
    encodeStateToUrl(get());
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
    encodeStateToUrl(get());
  },

  reset: () => {
    set({
      rootNode: null,
      groups: [],
      cloudMode: 'none',
      columns: { ...DEFAULT_COLUMNS },
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
    set({
      rootNode: data.rootNode,
      groups: data.groups,
      cloudMode: data.cloudMode,
    });
    encodeStateToUrl(get());
  },
}));
