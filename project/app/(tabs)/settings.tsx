import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, Clock, MapPin, TestTube, Bell, Save } from 'lucide-react-native';
import { Settings } from '../../types';
import { storageService } from '../../services/storageService';
import { locationService } from '../../services/locationService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hourlyRateText, setHourlyRateText] = useState('');
  const [workplaceAddress, setWorkplaceAddress] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settingsData = await storageService.getSettings();
      setSettings(settingsData);
      setHourlyRateText(settingsData.hourlyRate.toString());
      setWorkplaceAddress(settingsData.workplaceLocation.address);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    if (!settings) return;
    
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const updateWorkplaceLocation = (address: string) => {
    setWorkplaceAddress(address);
    updateSetting('workplaceLocation', {
      ...settings!.workplaceLocation,
      address
    });
  };

  const updateHourlyRate = (text: string) => {
    setHourlyRateText(text);
    const rate = parseFloat(text);
    if (!isNaN(rate) && rate > 0) {
      updateSetting('hourlyRate', rate);
    }
  };

  const saveSettings = async () => {
    try {
      if (!settings) return;
      
      // Validate hourly rate
      const rate = parseFloat(hourlyRateText);
      if (isNaN(rate) || rate <= 0) {
        Alert.alert('Error', 'Please enter a valid hourly rate');
        return;
      }

      const updatedSettings = { ...settings, hourlyRate: rate };
      await storageService.saveSettings(updatedSettings);
      setHasChanges(false);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const resetLocationTracking = async () => {
    Alert.alert(
      'Reset Location Tracking',
      'This will restart location tracking with current settings. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await locationService.stopTracking();
              await locationService.startTracking();
              Alert.alert('Success', 'Location tracking reset successfully');
            } catch (error) {
              console.error('Error resetting location tracking:', error);
              Alert.alert('Error', 'Failed to reset location tracking');
            }
          }
        }
      ]
    );
  };

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          {hasChanges && (
            <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
              <Save size={18} color="white" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color="#2563EB" />
              <Text style={styles.sectionTitle}>Pay Settings</Text>
            </View>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Hourly Rate</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.textInput}
                  value={hourlyRateText}
                  onChangeText={updateHourlyRate}
                  placeholder="15.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Time Rounding</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    settings.roundingMode === 'hour' && styles.segmentButtonActive
                  ]}
                  onPress={() => updateSetting('roundingMode', 'hour')}
                >
                  <Text style={[
                    styles.segmentButtonText,
                    settings.roundingMode === 'hour' && styles.segmentButtonTextActive
                  ]}>
                    Hour
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.segmentButton,
                    settings.roundingMode === 'half-hour' && styles.segmentButtonActive
                  ]}
                  onPress={() => updateSetting('roundingMode', 'half-hour')}
                >
                  <Text style={[
                    styles.segmentButtonText,
                    settings.roundingMode === 'half-hour' && styles.segmentButtonTextActive
                  ]}>
                    Half Hour
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.settingDescription}>
                {settings.roundingMode === 'hour' 
                  ? 'Times will be rounded to the nearest hour (e.g., 16:14 → 16:00)'
                  : 'Times will be rounded to the nearest half hour (e.g., 16:14 → 16:00, 16:44 → 16:30)'
                }
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MapPin size={20} color="#2563EB" />
              <Text style={styles.sectionTitle}>Workplace Location</Text>
            </View>
            
            <View style={styles.settingCard}>
              <Text style={styles.settingLabel}>Address</Text>
              <TextInput
                style={styles.textInput}
                value={workplaceAddress}
                onChangeText={updateWorkplaceLocation}
                placeholder="Enter workplace address"
                multiline
              />
              <Text style={styles.settingDescription}>
                200m geofence radius • Lat: {settings.workplaceLocation.latitude.toFixed(6)}, 
                Lng: {settings.workplaceLocation.longitude.toFixed(6)}
              </Text>
            </View>

            <TouchableOpacity style={styles.actionButton} onPress={resetLocationTracking}>
              <Text style={styles.actionButtonText}>Reset Location Tracking</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={20} color="#2563EB" />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            
            <View style={styles.settingCard}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.settingLabel}>Shift Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Get notified when shifts end
                  </Text>
                </View>
                <Switch
                  value={settings.notifications}
                  onValueChange={(value) => updateSetting('notifications', value)}
                  trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
                  thumbColor={settings.notifications ? '#2563EB' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <TestTube size={20} color="#EA580C" />
              <Text style={styles.sectionTitle}>Developer Mode</Text>
            </View>
            
            <View style={styles.settingCard}>
              <View style={styles.switchRow}>
                <View>
                  <Text style={styles.settingLabel}>Testing Mode</Text>
                  <Text style={styles.settingDescription}>
                    Start shifts after 30 seconds instead of 1 hour (for testing)
                  </Text>
                </View>
                <Switch
                  value={settings.developerMode}
                  onValueChange={(value) => updateSetting('developerMode', value)}
                  trackColor={{ false: '#E5E7EB', true: '#FEF3C7' }}
                  thumbColor={settings.developerMode ? '#EA580C' : '#9CA3AF'}
                />
              </View>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    padding: 0,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  segmentButtonTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2563EB',
  },
});