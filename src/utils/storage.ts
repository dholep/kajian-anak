import { EventConfig, Participant } from '../types';
import { initialEventConfig, initialParticipants } from '../data/initialData';

const STORAGE_PARTICIPANTS_KEY = 'kajian_anak_participants_v1';
const STORAGE_CONFIG_KEY = 'kajian_anak_config_v1';

export function loadParticipants(): Participant[] {
  try {
    const data = localStorage.getItem(STORAGE_PARTICIPANTS_KEY);
    if (!data) {
      saveParticipants(initialParticipants);
      return initialParticipants;
    }
    return JSON.parse(data);
  } catch {
    return initialParticipants;
  }
}

export function saveParticipants(participants: Participant[]): void {
  try {
    localStorage.setItem(STORAGE_PARTICIPANTS_KEY, JSON.stringify(participants));
  } catch (err) {
    console.error('Failed to save participants to localStorage:', err);
  }
}

export function loadEventConfig(): EventConfig {
  try {
    const data = localStorage.getItem(STORAGE_CONFIG_KEY);
    if (!data) {
      saveEventConfig(initialEventConfig);
      return initialEventConfig;
    }
    return JSON.parse(data);
  } catch {
    return initialEventConfig;
  }
}

export function saveEventConfig(config: EventConfig): void {
  try {
    localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config to localStorage:', err);
  }
}

export function resetToDefaults(): { participants: Participant[]; config: EventConfig } {
  saveParticipants(initialParticipants);
  saveEventConfig(initialEventConfig);
  return { participants: initialParticipants, config: initialEventConfig };
}
