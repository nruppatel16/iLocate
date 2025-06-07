import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { LocationStatus, Settings, ShiftState } from '../types';
import { getLocationStatus, calculateDistance } from '../utils/locationUtils';
import { floorTime, formatTime, calculateShiftDuration, calculatePay } from '../utils/timeUtils';
import { storageService } from './storageService';

const LOCATION_TASK_NAME = 'background-location-task';
const GEOFENCE_TASK_NAME = 'geofence-task';

let locationSubscription: Location.LocationSubscription | null = null;

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Define background tasks
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as any;
    const location = locations[0];
    
    if (location) {
      await handleLocationUpdate(location);
    }
  }
});

TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Geofence task error:', error);
    return;
  }

  if (data) {
    const { eventType, region } = data as any;
    await handleGeofenceEvent(eventType, region);
  }
});

const handleLocationUpdate = async (location: Location.LocationObject) => {
  try {
    const settings = await storageService.getSettings();
    const shiftState = await storageService.getShiftState();
    
    const { status, distance } = getLocationStatus(
      location.coords.latitude,
      location.coords.longitude,
      settings.workplaceLocation.latitude,
      settings.workplaceLocation.longitude
    );

    const now = new Date();
    const minDuration = settings.developerMode ? 30 * 1000 : 60 * 60 * 1000; // 30s vs 1 hour

    // Handle entry into geofence
    if (status === 'inside' && !shiftState.isActive && !shiftState.entryTime) {
      await storageService.saveShiftState({
        ...shiftState,
        entryTime: now,
        currentLocation: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        }
      });
    }

    // Check if we should start the shift
    if (status === 'inside' && shiftState.entryTime && !shiftState.isActive) {
      const timeInside = now.getTime() - shiftState.entryTime.getTime();
      
      if (timeInside >= minDuration) {
        await storageService.saveShiftState({
          ...shiftState,
          isActive: true,
          startTime: shiftState.entryTime,
          currentLocation: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
          }
        });
      }
    }

    // Handle exit from geofence
    if (status !== 'inside' && shiftState.isActive && shiftState.startTime) {
      await handleShiftEnd(shiftState.startTime, now, settings);
    }

    // Reset entry time if moved outside before shift started
    if (status !== 'inside' && shiftState.entryTime && !shiftState.isActive) {
      await storageService.saveShiftState({
        ...shiftState,
        entryTime: null,
        currentLocation: null
      });
    }

  } catch (error) {
    console.error('Error handling location update:', error);
  }
};

const handleGeofenceEvent = async (eventType: string, region: any) => {
  const settings = await storageService.getSettings();
  const shiftState = await storageService.getShiftState();
  const now = new Date();

  if (eventType === 'enter') {
    if (!shiftState.entryTime && !shiftState.isActive) {
      await storageService.saveShiftState({
        ...shiftState,
        entryTime: now
      });
    }
  } else if (eventType === 'exit' && shiftState.isActive && shiftState.startTime) {
    await handleShiftEnd(shiftState.startTime, now, settings);
  }
};

const handleShiftEnd = async (startTime: Date, endTime: Date, settings: Settings) => {
  try {
    const roundedStart = floorTime(startTime, settings.roundingMode);
    const roundedEnd = floorTime(endTime, settings.roundingMode);
    
    const duration = calculateShiftDuration(roundedStart, roundedEnd);
    const pay = calculatePay(duration, settings.hourlyRate);

    const startTimeStr = formatTime(roundedStart);
    const endTimeStr = formatTime(roundedEnd);

    // Clear shift state
    await storageService.clearShiftState();

    // Send notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Shift Ended',
        body: `Shift from ${startTimeStr} to ${endTimeStr}. Log it?`,
        data: {
          type: 'shift_ended',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          roundedStartTime: roundedStart.toISOString(),
          roundedEndTime: roundedEnd.toISOString(),
          duration,
          pay
        }
      },
      trigger: null,
    });

  } catch (error) {
    console.error('Error handling shift end:', error);
  }
};

export const locationService = {
  async initialize(): Promise<boolean> {
    try {
      // Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      if (notificationStatus !== 'granted') {
        console.warn('Notification permission not granted');
      }

      // Request location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted');
      }

      return true;
    } catch (error) {
      console.error('Error initializing location service:', error);
      return false;
    }
  },

  async startTracking(): Promise<void> {
    try {
      const settings = await storageService.getSettings();

      // Start background location updates
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 30000, // 30 seconds
        distanceInterval: 50, // 50 meters
        deferredUpdatesInterval: 60000, // 1 minute
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'iLocate is tracking your location',
          notificationBody: 'Tracking your work shifts automatically'
        }
      });

      // Start geofencing
      await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, [
        {
          identifier: 'workplace',
          latitude: settings.workplaceLocation.latitude,
          longitude: settings.workplaceLocation.longitude,
          radius: 200,
          notifyOnEnter: true,
          notifyOnExit: true
        }
      ]);

    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  },

  async stopTracking(): Promise<void> {
    try {
      const isLocationTaskRunning = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (isLocationTaskRunning) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      const isGeofenceTaskRunning = await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK_NAME);
      if (isGeofenceTaskRunning) {
        await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
      }

      if (locationSubscription) {
        locationSubscription.remove();
        locationSubscription = null;
      }
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  },

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  },

  async getLocationStatus(): Promise<LocationStatus | null> {
    try {
      const location = await this.getCurrentLocation();
      const settings = await storageService.getSettings();
      
      if (!location) return null;

      const { status, distance } = getLocationStatus(
        location.coords.latitude,
        location.coords.longitude,
        settings.workplaceLocation.latitude,
        settings.workplaceLocation.longitude
      );

      return {
        status,
        distance,
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error('Error getting location status:', error);
      return null;
    }
  }
};