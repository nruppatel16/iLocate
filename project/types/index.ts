export interface Shift {
  id: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  pay: number;
  notes?: string;
  isManual: boolean;
  roundedStartTime: Date;
  roundedEndTime: Date;
}

export interface Settings {
  hourlyRate: number;
  roundingMode: 'hour' | 'half-hour';
  workplaceLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  developerMode: boolean;
  notifications: boolean;
}

export interface LocationStatus {
  status: 'inside' | 'near' | 'outside';
  distance: number;
  lastUpdate: Date;
}

export interface ShiftState {
  isActive: boolean;
  startTime: Date | null;
  entryTime: Date | null;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

export type RootTabParamList = {
  index: undefined;
  shifts: undefined;
  weekly: undefined;
  settings: undefined;
};