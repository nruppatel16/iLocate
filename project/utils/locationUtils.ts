import * as Location from 'expo-location';

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371000; // Earth's radius in meters

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const getLocationStatus = (
  currentLat: number,
  currentLon: number,
  workplaceLat: number,
  workplaceLon: number
): { status: 'inside' | 'near' | 'outside', distance: number } => {
  const distance = calculateDistance(currentLat, currentLon, workplaceLat, workplaceLon);
  
  if (distance <= 200) {
    return { status: 'inside', distance };
  } else if (distance <= 500) {
    return { status: 'near', distance };
  } else {
    return { status: 'outside', distance };
  }
};

export const requestLocationPermissions = async (): Promise<boolean> => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    
    if (foregroundStatus !== 'granted') {
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    
    return backgroundStatus === 'granted';
  } catch (error) {
    console.error('Error requesting location permissions:', error);
    return false;
  }
};