import type { SavedProject } from '../types';

const STORAGE_KEY = 'subnet-calc-projects';
const ACTIVE_KEY = 'subnet-calc-active-project';
const AUTOSAVE_KEY = 'subnet-calc-autosave';

export function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: SavedProject[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function getActiveProjectId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

export function saveAutosave(data: object): void {
  localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
}

export function loadAutosave(): any | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
