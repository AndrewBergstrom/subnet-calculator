export interface SubnetNode {
  id: string;
  networkAddress: number;
  cidr: number;
  children: [SubnetNode, SubnetNode] | null;
  label: string;
  notes: string;
  color: string | null;
  groupId: string | null;
}

export interface Group {
  id: string;
  name: string;
  color: string;
}

export type CloudMode = 'none' | 'azure' | 'aws';

export interface ColumnVisibility {
  netmask: boolean;
  range: boolean;
  usableIps: boolean;
  hosts: boolean;
  label: boolean;
}

export const DEFAULT_COLUMNS: ColumnVisibility = {
  netmask: false,
  range: true,
  usableIps: true,
  hosts: true,
  label: true,
};

export interface SavedProject {
  id: string;
  name: string;
  savedAt: number; // timestamp
  rootNode: SubnetNode | null;
  groups: Group[];
  cloudMode: CloudMode;
  columns: ColumnVisibility;
}

export interface AppState {
  rootNode: SubnetNode | null;
  groups: Group[];
  cloudMode: CloudMode;
  darkMode: boolean;
  columns: ColumnVisibility;

  setNetwork: (cidr: string) => void;
  splitSubnet: (nodeId: string) => void;
  joinSubnet: (nodeId: string) => void;
  updateSubnet: (nodeId: string, updates: Partial<Pick<SubnetNode, 'label' | 'notes' | 'color' | 'groupId'>>) => void;
  addGroup: (name: string, color: string) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'color'>>) => void;
  setCloudMode: (mode: CloudMode) => void;
  toggleDarkMode: () => void;
  toggleColumn: (col: keyof ColumnVisibility) => void;
  reset: () => void;
  exportState: () => string;
  importState: (json: string) => void;

  // Projects
  projects: SavedProject[];
  activeProjectId: string | null;
  saveProject: (name: string) => void;
  loadProject: (id: string) => void;
  deleteProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  updateActiveProject: () => void;
}
