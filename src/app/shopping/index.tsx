import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';
import { getShoppingItems } from '@/db/queries';
import { useIsFocused } from '@react-navigation/native';

export default function ShoppingHubScreen() {
  const { shoppingLists, currency, loadShoppingLists } = useStore();
  const [listStats, setListStats] = useState<Record<string, { total: number; spent: number; items: number }>>({});
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadShoppingLists();
    }
  }, [isFocused]);

  useEffect(() => {
    const fetchStats = async () => {
      const stats: any = {};
      for (const list of shoppingLists) {
        const items = await getShoppingItems(list.id);
        const total = items.reduce((sum, item) => sum + (item.expectedPrice || 0), 0);
        const spent = items.filter(i => i.isChecked).reduce((sum, item) => sum + (item.expectedPrice || 0), 0);
        stats[list.id] = { total, spent, items: items.length };
      }
      setListStats(stats);
    };
    if (shoppingLists.length > 0) {
      fetchStats();
    }
  }, [shoppingLists]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Lists</Text>
        <TouchableOpacity onPress={() => router.push('/add-shopping-list')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {shoppingLists.map(list => {
          const stats = listStats[list.id] || { total: 0, spent: 0, items: 0 };
          const hasBudget = list.budget && list.budget > 0;
          const budgetPercentage = hasBudget ? Math.min(100, (stats.spent / list.budget!) * 100) : 0;
          const isOverBudget = hasBudget && stats.spent > list.budget!;

          return (
            <TouchableOpacity 
              key={list.id} 
              style={[styles.listCard, list.isCompleted && styles.listCardCompleted]}
              onPress={() => router.push(`/shopping/${list.id}` as any)}
            >
              <View style={styles.listHeader}>
                <View style={[styles.listIcon, { backgroundColor: list.isCompleted ? '#E2E8F0' : '#DCFCE7' }]}>
                  <Ionicons name="cart" size={24} color={list.isCompleted ? '#94A3B8' : '#22C55E'} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={[styles.listName, list.isCompleted && styles.listNameCompleted]}>{list.name}</Text>
                  <Text style={styles.listMeta}>{stats.items} Items</Text>
                </View>
                {hasBudget && (
                  <View style={styles.budgetBadge}>
                    <Text style={styles.budgetBadgeText}>Budget: {formatCurrency(list.budget, currency.code)}</Text>
                  </View>
                )}
              </View>

              {hasBudget ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Spent: {formatCurrency(stats.spent, currency.code)}</Text>
                    <Text style={[styles.progressLabel, isOverBudget && { color: '#EF5350' }]}>
                      {Math.round(budgetPercentage)}%
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${budgetPercentage}%`, backgroundColor: isOverBudget ? '#EF5350' : '#22C55E' }]} />
                  </View>
                </View>
              ) : (
                <View style={styles.progressContainer}>
                  <Text style={styles.noBudgetText}>Estimated Total: {formatCurrency(stats.total, currency.code)}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {shoppingLists.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No shopping lists yet.</Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  listCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  listCardCompleted: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  
  listHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  listIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  listInfo: { flex: 1 },
  listName: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  listNameCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  listMeta: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  
  budgetBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  budgetBadgeText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  
  progressContainer: { marginTop: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  
  noBudgetText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#94A3B8', fontWeight: '500' },
});
