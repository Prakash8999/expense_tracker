import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontFamily, Shadows, Radius, ScreenPadding } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { db } from '@/db';
import { groups } from '@/db/schema';
import { desc } from 'drizzle-orm';

const { width } = Dimensions.get('window');

export default function GroupsScreen() {
  const router = useRouter();
  const [allGroups, setAllGroups] = React.useState<any[]>([]);
  const [filterType, setFilterType] = React.useState<'active' | 'archived'>('active');

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
        <View style={styles.headerTopRow}>
          <Text style={styles.headerTitle}>Groups</Text>
          <View style={styles.filterToggle}>
            <TouchableOpacity 
              style={[styles.filterBtn, filterType === 'active' && styles.filterBtnActive]}
              onPress={() => setFilterType('active')}
            >
              <Text style={[styles.filterText, filterType === 'active' && styles.filterTextActive]}>Active</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.filterBtn, filterType === 'archived' && styles.filterBtnActive]}
              onPress={() => setFilterType('archived')}
            >
              <Text style={[styles.filterText, filterType === 'archived' && styles.filterTextActive]}>Archived</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSub}>
          Split expenses and settle up with friends.
        </Text>
      </View>

      <FlatList
        data={filterType === 'active' ? allGroups.filter(g => !g.isArchived) : allGroups.filter(g => g.isArchived)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.groupCard, item.isArchived && { opacity: 0.7 }]} 
            activeOpacity={0.7}
            onPress={() => router.push(`/groups/${item.id}` as any)}
          >
            <View style={[styles.groupIcon, item.isArchived && { backgroundColor: '#F1F5F9' }]}>
              <Ionicons name="people" size={24} color={item.isArchived ? "#94A3B8" : "#6366F1"} />
            </View>
            <View style={styles.groupInfo}>
              <Text style={[styles.groupName, item.isArchived && { color: '#64748B' }]}>{item.name}</Text>
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
  header: { paddingHorizontal: ScreenPadding + 4, paddingTop: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 32, fontFamily: FontFamily.extraBold, color: Colors.light.text, lineHeight: 38, letterSpacing: -0.5 },
  headerSub: { fontSize: 15, fontFamily: FontFamily.medium, color: Colors.light.textSecondary, marginTop: 4 },
  
  listContent: { paddingHorizontal: ScreenPadding, paddingBottom: 100, flexGrow: 1 },
  
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 18,
    borderRadius: Radius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  groupIcon: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.tintMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 17, fontFamily: FontFamily.bold, color: Colors.light.text, marginBottom: 4, letterSpacing: -0.2 },
  groupDesc: { fontSize: 13, fontFamily: FontFamily.medium, color: Colors.light.textSecondary },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyTitle: { fontSize: 20, fontFamily: FontFamily.bold, color: Colors.light.text, marginTop: 24 },
  emptySub: { fontSize: 14, fontFamily: FontFamily.medium, color: Colors.light.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 32, lineHeight: 22 },

  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterToggle: { flexDirection: 'row', backgroundColor: Colors.light.backgroundSubtle, borderRadius: Radius.xs, padding: 2 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.xs },
  filterBtnActive: { backgroundColor: Colors.light.card, ...Shadows.sm },
  filterText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.light.textSecondary },
  filterTextActive: { color: Colors.light.text },

  heroArea: {
    alignItems: 'center', justifyContent: 'center',
    height: 130, width: '100%', position: 'relative',
  },
  heroCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.light.tintMuted, justifyContent: 'center', alignItems: 'center',
    ...Shadows.tint,
  },
  orbSmall: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.light.successLight, justifyContent: 'center', alignItems: 'center',
    ...Shadows.md,
  },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 22,
    ...Shadows.tint,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
