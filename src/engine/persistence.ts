import { AppSettings, IncidentRecord } from '../types';
import { DEFAULT_SETTINGS } from './riskEngine';

const STORAGE_KEYS = {
  INCIDENTS: 'faultlens_incident_history_v1',
  SETTINGS: 'faultlens_settings_v1',
};

export function loadSavedIncidents(): IncidentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INCIDENTS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load incidents from localStorage:', e);
    return [];
  }
}

export function saveIncident(incident: IncidentRecord): void {
  try {
    const current = loadSavedIncidents();
    // Prepend new incident so newest is first
    const updated = [incident, ...current.filter((item) => item.id !== incident.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.INCIDENTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save incident to localStorage:', e);
  }
}

export function clearIncidentHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
  } catch (e) {
    console.error('Failed to clear incident history:', e);
  }
}

export function loadSavedSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load settings from localStorage:', e);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to localStorage:', e);
  }
}
