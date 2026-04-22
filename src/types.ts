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

export interface AppState {
  rootNode: SubnetNode | null;
  groups: Group[];
  cloudMode: CloudMode;
  darkMode: boolean;

  setNetwork: (cidr: string) => void;
  splitSubnet: (nodeId: string) => void;
  joinSubnet: (nodeId: string) => void;
  updateSubnet: (nodeId: string, updates: Partial<Pick<SubnetNode, 'label' | 'notes' | 'color' | 'groupId'>>) => void;
  addGroup: (name: string, color: string) => void;
  removeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, updates: Partial<Pick<Group, 'name' | 'color'>>) => void;
  setCloudMode: (mode: CloudMode) => void;
  toggleDarkMode: () => void;
  exportState: () => string;
  importState: (json: string) => void;
}
