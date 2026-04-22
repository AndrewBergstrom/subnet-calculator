import { create } from 'zustand';
import type { AppState, SubnetNode, CloudMode } from './types';
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

export const useStore = create<AppState>((set, get) => ({
  rootNode: null,
  groups: [],
  cloudMode: 'none',
  darkMode: true,

  setNetwork: (cidrStr: string) => {
    const parsed = parseCidr(cidrStr);
    if (!parsed) return;
    const netAddr = networkAddress(parsed.ip, parsed.prefix);
    set({ rootNode: createNode(netAddr, parsed.prefix, 'root') });
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
  },

  updateSubnet: (nodeId, updates) => {
    const { rootNode } = get();
    if (!rootNode) return;
    const newRoot = cloneTree(rootNode);
    const target = findNode(newRoot, nodeId);
    if (!target) return;
    Object.assign(target, updates);
    set({ rootNode: newRoot });
  },

  addGroup: (name, color) => {
    set((state) => ({
      groups: [...state.groups, { id: crypto.randomUUID(), name, color }],
    }));
  },

  removeGroup: (groupId) => {
    const { rootNode } = get();
    // Clear groupId from any subnet that references this group
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
  },

  updateGroup: (groupId, updates) => {
    set((state) => ({
      groups: state.groups.map((g) =>
        g.id === groupId ? { ...g, ...updates } : g
      ),
    }));
  },

  setCloudMode: (mode: CloudMode) => set({ cloudMode: mode }),

  toggleDarkMode: () => {
    set((state) => {
      const newDark = !state.darkMode;
      document.documentElement.classList.toggle('dark', newDark);
      return { darkMode: newDark };
    });
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
  },
}));
