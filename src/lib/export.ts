import type { SubnetNode, Group, CloudMode } from '../types';

interface ExportData {
  version: 1;
  rootNode: SubnetNode | null;
  groups: Group[];
  cloudMode: CloudMode;
}

export function exportToJson(rootNode: SubnetNode | null, groups: Group[], cloudMode: CloudMode): string {
  const data: ExportData = { version: 1, rootNode, groups, cloudMode };
  return JSON.stringify(data, null, 2);
}

export function importFromJson(json: string): ExportData | null {
  try {
    const data = JSON.parse(json);
    if (data.version !== 1 || !('rootNode' in data)) return null;
    return data as ExportData;
  } catch {
    return null;
  }
}
