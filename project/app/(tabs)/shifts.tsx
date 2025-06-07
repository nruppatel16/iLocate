import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, Download, Calendar } from 'lucide-react-native';
import { ShiftCard } from '../../components/ShiftCard';
import { Shift } from '../../types';
import { storageService } from '../../services/storageService';
import { exportShiftsToCSV } from '../../utils/csvUtils';

export default function ShiftsScreen() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      setIsLoading(true);
      const shiftsData = await storageService.getShifts();
      // Sort by start time (most recent first)
      const sortedShifts = shiftsData.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      setShifts(sortedShifts);
    } catch (error) {
      console.error('Error loading shifts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditShift = (shift: Shift) => {
    router.push({
      pathname: '/edit-shift',
      params: { shiftId: shift.id }
    });
  };

  const handleAddShift = () => {
    router.push({
      pathname: '/edit-shift',
      params: { isNew: 'true' }
    });
  };

  const handleExportCSV = async () => {
    try {
      if (shifts.length === 0) {
        Alert.alert('No Data', 'No shifts to export');
        return;
      }

      await exportShiftsToCSV(shifts);
      Alert.alert('Success', 'Shifts exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      Alert.alert('Error', 'Failed to export shifts');
    }
  };

  const renderShift = ({ item }: { item: Shift }) => (
    <ShiftCard shift={item} onEdit={handleEditShift} />
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={48} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>No shifts yet</Text>
      <Text style={styles.emptySubtitle}>
        Your automatic and manual shifts will appear here
      </Text>
      <TouchableOpacity style={styles.addButton} onPress={handleAddShift}>
        <Plus size={20} color="white" />
        <Text style={styles.addButtonText}>Add Manual Shift</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Shifts</Text>
          <Text style={styles.subtitle}>{shifts.length} total shifts</Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={handleExportCSV}>
            <Download size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleAddShift}>
            <Plus size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading shifts...</Text>
        </View>
      ) : (
        <FlatList
          data={shifts}
          renderItem={renderShift}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyState}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
  },
  addButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});