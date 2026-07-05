import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { db } from '@/db';
import { groups } from '@/db/schema';
import { desc } from 'drizzle-orm';

const { width } = Dimensions.get('window');

export default function GroupsScreen() {
  const router = useRouter();
  const [allGroups, setAllGroups] = React.useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchGroups = async () => {
        const data = await db.select().from(groups).orderBy(desc(groups.createdAt));
        setAllGroups(data);
      };
      fetchGroups();
    }, [])
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.heroArea}>
        <View style={styles.heroCircle}>
          <Ionicons name="people" size={64} color="#6366F1" />
        </View>
        <View style={[styles.orbSmall, { top: 20, right: width * 0.15 }]}>
          <Ionicons name="wallet" size={20} color="#10B981" />
        </View>
        <View style={[styles.orbSmall, { bottom: 10, left: width * 0.15, backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="calculator" size={20} color="#F59E0B" />
        </View>
      </View>
      <Text style={styles.emptyTitle}>No Groups Yet</Text>
      <Text style={styles.emptySub}>
        Create a group for a trip, shared apartment, or dinner with friends to start splitting expenses.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#6366F115', '#EEF2FF30', Colors.light.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Groups</Text>
        <Text style={styles.headerSub}>
          Split expenses and settle up with friends.
        </Text>
      </View>

      <FlatList
        data={allGroups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.groupCard} 
            activeOpacity={0.7}
            onPress={() => router.push(`/groups/${item.id}` as any)}
          >
            <View style={styles.groupIcon}>
              <Ionicons name="people" size={24} color="#6366F1" />
            </View>
            <View style={styles.groupInfo}>
              <Text style={styles.groupName}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.groupDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => router.push('/groups/new' as any)}
      >
        <LinearGradient
          colors={['#6366F1', '#818CF8']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: Colors.light.text, lineHeight: 38 },
  headerSub: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4 },
  
  listContent: { paddingHorizontal: 20, paddingBottom: 100, flexGrow: 1 },
  
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  groupDesc: { fontSize: 13, color: Colors.light.textSecondary },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginTop: 24 },
  emptySub: { fontSize: 14, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32, lineHeight: 22 },

  heroArea: {
    alignItems: 'center', justifyContent: 'center',
    height: 130, width: '100%', position: 'relative',
  },
  heroCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12,
  },
  orbSmall: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
