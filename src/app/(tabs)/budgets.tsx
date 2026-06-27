import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';

export default function BudgetsScreen() {
  const { budgets, goals, transactions, categories, currency } = useStore();
  const [tab, setTab] = useState<'budgets' | 'goals'>('budgets');

  // Calculate budget spending
  const budgetData = useMemo(() => {
    const now = new Date();
    return budgets.map((b: any) => {
      const cat = categories.find((c: any) => c.id === b.categoryId);
      let startDate: number;
      if (b.period === 'monthly') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      } else if (b.period === 'weekly') {
        const d = new Date(); d.setDate(d.getDate() - d.getDay());
        startDate = d.getTime();
      } else if (b.period === 'daily') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      } else if (b.period === 'yearly') {
        startDate = new Date(now.getFullYear(), 0, 1).getTime();
      } else {
        startDate = b.startDate;
      }
      const spent = transactions
        .filter((t: any) => t.type === 'expense' && t.date >= startDate && (!b.categoryId || t.categoryId === b.categoryId))
        .reduce((s: number, t: any) => s + t.amount, 0);
      const pct = Math.min((spent / b.amount) * 100, 100);
      return { ...b, cat, spent, pct };
    });
  }, [budgets, transactions, categories]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Budgets & Goals</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'budgets' && styles.tabActive]} onPress={() => setTab('budgets')}>
          <Text style={[styles.tabText, tab === 'budgets' && styles.tabTextActive]}>Budgets</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'goals' && styles.tabActive]} onPress={() => setTab('goals')}>
          <Text style={[styles.tabText, tab === 'goals' && styles.tabTextActive]}>Savings Goals</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'budgets' ? (
          <>
            {budgetData.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="pie-chart-outline" size={52} color="#CBD5E1" />
                <Text style={styles.emptyText}>No budgets set</Text>
                <Text style={styles.emptySubtext}>Create a budget to track your spending limits</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-budget')}>
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addBtnText}>Create Budget</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {budgetData.map((b: any) => (
                  <View key={b.id} style={styles.budgetCard}>
                    <View style={styles.budgetHeader}>
                      <View style={styles.budgetLeft}>
                        <View style={[styles.budgetIcon, { backgroundColor: (b.cat?.color || Colors.light.tint) + '20' }]}>
                          <Ionicons name={(b.cat?.icon || 'pie-chart') as any} size={20} color={b.cat?.color || Colors.light.tint} />
                        </View>
                        <View>
                          <Text style={styles.budgetName}>{b.cat?.name || 'Total Budget'}</Text>
                          <Text style={styles.budgetPeriod}>{b.period.charAt(0).toUpperCase() + b.period.slice(1)}</Text>
                        </View>
                      </View>
                      <View style={styles.budgetRight}>
                        <Text style={styles.budgetSpent}>{formatCurrency(b.spent, currency.code)}</Text>
                        <Text style={styles.budgetLimit}>of {formatCurrency(b.amount, currency.code)}</Text>
                      </View>
                    </View>
                    <View style={styles.barBg}>
                      <View
                        style={[styles.barFill, {
                          width: `${b.pct}%`,
                          backgroundColor: b.pct >= 90 ? '#EF5350' : b.pct >= 70 ? '#FFA726' : '#66BB6A',
                        }]}
                      />
                    </View>
                    <Text style={[styles.budgetRemaining, { color: b.pct >= 90 ? '#EF5350' : '#66BB6A' }]}>
                      {b.pct >= 100 ? 'Over budget!' : `${formatCurrency(b.amount - b.spent, currency.code)} remaining`}
                    </Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/add-budget')}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.light.tint} />
                  <Text style={styles.addMoreText}>Add Budget</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <>
            {goals.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="flag-outline" size={52} color="#CBD5E1" />
                <Text style={styles.emptyText}>No savings goals</Text>
                <Text style={styles.emptySubtext}>Set a target and track your progress</Text>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-goal')}>
                  <Ionicons name="add" size={20} color="#FFF" />
                  <Text style={styles.addBtnText}>Create Goal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {goals.map((g: any) => {
                  const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                  const daysLeft = g.targetDate ? Math.max(0, Math.ceil((g.targetDate - Date.now()) / 86400000)) : null;
                  return (
                    <View key={g.id} style={styles.goalCard}>
                      <View style={styles.goalHeader}>
                        <View style={[styles.goalIcon, { backgroundColor: g.color + '20' }]}>
                          <Ionicons name={g.icon as any} size={24} color={g.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.goalName}>{g.name}</Text>
                          {daysLeft !== null && (
                            <Text style={styles.goalDays}>{daysLeft} days left</Text>
                          )}
                        </View>
                        <Text style={[styles.goalPct, { color: g.color }]}>{pct.toFixed(0)}%</Text>
                      </View>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: g.color }]} />
                      </View>
                      <View style={styles.goalAmounts}>
                        <Text style={styles.goalSaved}>{formatCurrency(g.currentAmount, currency.code)} saved</Text>
                        <Text style={styles.goalTarget}>Target: {formatCurrency(g.targetAmount, currency.code)}</Text>
                      </View>
                      {g.note && <Text style={styles.goalNote}>{g.note}</Text>}
                    </View>
                  );
                })}
                <TouchableOpacity style={styles.addMoreBtn} onPress={() => router.push('/add-goal')}>
                  <Ionicons name="add-circle-outline" size={20} color={Colors.light.tint} />
                  <Text style={styles.addMoreText}>Add Goal</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.light.text },

  tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: Colors.light.text },

  content: { flex: 1, paddingHorizontal: 20 },

  budgetCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  budgetLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  budgetIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  budgetName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  budgetPeriod: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  budgetRight: { alignItems: 'flex-end' },
  budgetSpent: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  budgetLimit: { fontSize: 12, color: '#94A3B8' },
  barBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, marginBottom: 8 },
  barFill: { height: 8, borderRadius: 4 },
  budgetRemaining: { fontSize: 13, fontWeight: '600' },

  goalCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  goalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  goalIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  goalName: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  goalDays: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  goalPct: { fontSize: 20, fontWeight: '800' },
  goalAmounts: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  goalSaved: { fontSize: 13, fontWeight: '600', color: '#66BB6A' },
  goalTarget: { fontSize: 13, color: '#94A3B8' },
  goalNote: { fontSize: 13, color: '#64748B', marginTop: 8, fontStyle: 'italic' },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#94A3B8', marginTop: 14 },
  emptySubtext: { fontSize: 14, color: '#CBD5E1', marginTop: 4, textAlign: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.light.tint, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 20 },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  addMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.light.tint, borderStyle: 'dashed' },
  addMoreText: { fontSize: 15, fontWeight: '600', color: Colors.light.tint },
});
