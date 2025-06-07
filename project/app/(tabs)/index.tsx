import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, MapPin } from 'lucide-react-native';
import { LocationStatusCard } from '../../components/LocationStatusCard';
import { ShiftTimerCard } from '../../components/ShiftTimerCard';
import { LocationStatus, ShiftState, Settings } from '../../types';
import { locationService } from '../../services/locationService';
import { storageService } from '../../services/storageService';

export default function HomeScreen() {
  const [locationStatus, setLocationStatus] = useState<LocationStatus | null>(null);
  const [shiftState, setShiftState] = useState<ShiftState | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const interval = setInterval(() => {
      updateLocationStatus();
      loadShiftState();
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statusData, stateData, settingsData] = await Promise.all([
        locationService.getLocationStatus(),
        storageService.getShiftState(),
        storageService.getSettings()
      ]);
      
      setLocationStatus(statusData);
      setShiftState(stateData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocationStatus = async () => {
    try {
      const status = await locationService.getLocationStatus();
      setLocationStatus(status);
    } catch (error) {
      console.error('Error updating location status:', error);
    }
  };

  const loadShiftState = async () => {
    try {
      const state = await storageService.getShiftState();
      setShiftState(state);
    } catch (error) {
      console.error('Error loading shift state:', error);
    }
  };

  const handleToggleTracking = async () => {
    try {
      const isTracking = await locationService.initialize();
      
      if (isTracking) {
        await locationService.startTracking();
        Alert.alert('Success', 'Location tracking started successfully');
      } else {
        await locationService.stopTracking();
        Alert.alert('Success', 'Location tracking stopped');
      }
      
      await loadData();
    } catch (error) {
      console.error('Error toggling tracking:', error);
      Alert.alert('Error', 'Failed to toggle location tracking');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>iLocate</Text>
          <Text style={styles.subtitle}>Automatic shift tracking</Text>
        </View>

        <View style={styles.content}>
          <LocationStatusCard 
            locationStatus={locationStatus} 
            isLoading={isLoading} 
          />

          {shiftState && settings && (
            <ShiftTimerCard 
              shiftState={shiftState} 
              settings={settings} 
            />
          )}

          <TouchableOpacity 
            style={styles.trackingButton} 
            onPress={handleToggleTracking}
          >
            <MapPin size={20} color="white" />
            <Text style={styles.trackingButtonText}>
              Refresh Location
            </Text>
          </TouchableOpacity>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              • Stay within 200m of your workplace for {settings?.developerMode ? '30 seconds' : '1 hour'} to start a shift
              {'\n'}• Leaving the area automatically ends your shift
              {'\n'}• You'll get a notification to confirm or edit the shift
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 32,
  },
  trackingButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});