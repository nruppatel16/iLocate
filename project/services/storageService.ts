import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shift, Settings, ShiftState } from '../types';

const KEYS = {
  SHIFTS: 'shifts',
  SETTINGS: 'settings',
  SHIFT_STATE: 'shiftState'
};

const DEFAULT_SETTINGS: Settings = {
  hourlyRate: 15.00,
  roundingMode: 'hour',
  workplaceLocation: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'Default Workplace'
  },
  developerMode: false,
  notifications: true
};

const DEFAULT_SHIFT_STATE: ShiftState = {
  isActive: false,
  startTime: null,
  entryTime: null,
  currentLocation: null
};

export const storageService = {
  // Shifts
  async getShifts(): Promise<Shift[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SHIFTS);
      if (!data) return [];
      
      const shifts = JSON.parse(data);
      return shifts.map((shift: any) => ({
        ...shift,
        startTime: new Date(shift.startTime),
        endTime: new Date(shift.endTime),
        roundedStartTime: new Date(shift.roundedStartTime),
        roundedEndTime: new Date(shift.roundedEndTime)
      }));
    } catch (error) {
      console.error('Error getting shifts:', error);
      return [];
    }
  },

  async saveShift(shift: Shift): Promise<void> {
    try {
      const shifts = await this.getShifts();
      const existingIndex = shifts.findIndex(s => s.id === shift.id);
      
      if (existingIndex >= 0) {
        shifts[existingIndex] = shift;
      } else {
        shifts.push(shift);
      }
      
      await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(shifts));
    } catch (error) {
      console.error('Error saving shift:', error);
      throw error;
    }
  },

  async deleteShift(shiftId: string): Promise<void> {
    try {
      const shifts = await this.getShifts();
      const updatedShifts = shifts.filter(s => s.id !== shiftId);
      await AsyncStorage.setItem(KEYS.SHIFTS, JSON.stringify(updatedShifts));
    } catch (error) {
      console.error('Error deleting shift:', error);
      throw error;
    }
  },

  // Settings
  async getSettings(): Promise<Settings> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (error) {
      console.error('Error getting settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updatedSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  // Shift State
  async getShiftState(): Promise<ShiftState> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SHIFT_STATE);
      if (!data) return DEFAULT_SHIFT_STATE;
      
      const state = JSON.parse(data);
      return {
        ...state,
        startTime: state.startTime ? new Date(state.startTime) : null,
        entryTime: state.entryTime ? new Date(state.entryTime) : null
      };
    } catch (error) {
      console.error('Error getting shift state:', error);
      return DEFAULT_SHIFT_STATE;
    }
  },

  async saveShiftState(state: ShiftState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SHIFT_STATE, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving shift state:', error);
      throw error;
    }
  },

  async clearShiftState(): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SHIFT_STATE, JSON.stringify(DEFAULT_SHIFT_STATE));
    } catch (error) {
      console.error('Error clearing shift state:', error);
      throw error;
    }
  }
};