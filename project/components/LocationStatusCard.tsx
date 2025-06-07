import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Clock, Users } from 'lucide-react-native';
import { LocationStatus } from '../types';

interface LocationStatusCardProps {
  locationStatus: LocationStatus | null;
  isLoading?: boolean;
}

export function LocationStatusCard({ locationStatus, isLoading }: LocationStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'inside': return '#16A34A';
      case 'near': return '#EA580C';
      case 'outside': return '#DC2626';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'inside': return 'Inside Workplace';
      case 'near': return 'Near Workplace';
      case 'outside': return 'Outside Workplace';
      default: return 'Unknown';
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m away`;
    }
    return `${(distance / 1000).toFixed(1)}km away`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <MapPin size={20} color="#2563EB" />
        <Text style={styles.title}>Location Status</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      ) : locationStatus ? (
        <View style={styles.content}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(locationStatus.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(locationStatus.status) }]}>
              {getStatusText(locationStatus.status)}
            </Text>
          </View>
          
          <Text style={styles.distanceText}>
            {formatDistance(locationStatus.distance)}
          </Text>
          
          <Text style={styles.lastUpdateText}>
            Last updated: {locationStatus.lastUpdate.toLocaleTimeString()}
          </Text>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to get location</Text>
          <Text style={styles.errorSubtext}>Please check location permissions</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  content: {
    gap: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  distanceText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 16,
  },
  lastUpdateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  loadingContainer: {
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
  },
});