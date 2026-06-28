import React, { useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';


const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

export default function DashboardScreen() {
  const { accounts, transactions, currency, isLoading, loadData, categories } = useStore();

  useEffect(() => { loadData(); }, []);

  const totalBalance = useMemo(
    () => accounts.reduce((sum: number, a: any) => sum + a.balance, 0),
    [accounts]
  );

  // Current month stats
  const monthStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthTxns = transactions.filter((t: any) => t.date >= startOfMonth);
    const income = monthTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = monthTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    return { income, expense };
  }, [transactions]);

  // Category spending breakdown for current month
  const categorySpending = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const monthExpenses = transactions.filter((t: any) => t.type === 'expense' && t.date >= startOfMonth);
    const map: Record<string, number> = {};
    monthExpenses.forEach((t: any) => {
      if (t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c: any) => c.id === catId);
        return { catId, amount, name: cat?.name || 'Other', icon: cat?.icon || 'help', color: cat?.color || '#94A3B8' };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, categories]);

  const recentTxns = transactions.slice(0, 8);

  const getCategoryForTxn = (txn: any) => {
    if (!txn.categoryId) return null;
    return categories.find((c: any) => c.id === txn.categoryId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good {getTimeGreeting()} 👋</Text>
            <Text style={styles.headerSubtitle}>Your financial overview</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons name="notifications-outline" size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceCardInner}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(totalBalance, currency.code)}
            </Text>

            <View style={styles.incExpRow}>
              <View style={styles.incExpItem}>
                <View style={[styles.incExpIcon, { backgroundColor: 'rgba(102,187,106,0.2)' }]}>
                  <Ionicons name="arrow-down" size={16} color="#66BB6A" />
                </View>
                <View>
                  <Text style={styles.incExpLabel}>Income</Text>
                  <Text style={[styles.incExpAmount, { color: '#66BB6A' }]}>
                    {formatCurrency(monthStats.income, currency.code)}
                  </Text>
                </View>
              </View>
              <View style={styles.incExpDivider} />
              <View style={styles.incExpItem}>
                <View style={[styles.incExpIcon, { backgroundColor: 'rgba(239,83,80,0.2)' }]}>
                  <Ionicons name="arrow-up" size={16} color="#EF5350" />
                </View>
                <View>
                  <Text style={styles.incExpLabel}>Expense</Text>
                  <Text style={[styles.incExpAmount, { color: '#EF5350' }]}>
                    {formatCurrency(monthStats.expense, currency.code)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-transaction?type=expense')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#FFF0F0' }]}>
              <Ionicons name="remove-circle" size={24} color="#EF5350" />
            </View>
            <Text style={styles.quickActionText}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-transaction?type=income')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F0FFF4' }]}>
              <Ionicons name="add-circle" size={24} color="#66BB6A" />
            </View>
            <Text style={styles.quickActionText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-transaction?type=transfer')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F0F4FF' }]}>
              <Ionicons name="swap-horizontal" size={24} color="#42A5F5" />
            </View>
            <Text style={styles.quickActionText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/add-account')}>
            <View style={[styles.quickActionIcon, { backgroundColor: '#F5F0FF' }]}>
              <Ionicons name="wallet" size={24} color="#7E57C2" />
            </View>
            <Text style={styles.quickActionText}>Account</Text>
          </TouchableOpacity>
        </View>

        {/* Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Accounts</Text>
              <TouchableOpacity onPress={() => router.push('/add-account')}>
                <Ionicons name="add" size={22} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
              {accounts.map((acc: any) => (
                <View key={acc.id} style={[styles.accountCard, { borderLeftColor: acc.color }]}>
                  <View style={styles.accountCardTop}>
                    <Ionicons name={acc.icon as any} size={20} color={acc.color} />
                    <Text style={styles.accountType}>{acc.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(acc.balance, currency.code)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Spending by Category */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Spending This Month</Text>
            {categorySpending.map((cs, i) => {
              const maxAmount = categorySpending[0]?.amount || 1;
              const barWidth = (cs.amount / maxAmount) * 100;
              return (
                <View key={cs.catId} style={styles.catSpendRow}>
                  <View style={[styles.catSpendIcon, { backgroundColor: cs.color + '20' }]}>
                    <Ionicons name={cs.icon as any} size={18} color={cs.color} />
                  </View>
                  <View style={styles.catSpendInfo}>
                    <View style={styles.catSpendTextRow}>
                      <Text style={styles.catSpendName}>{cs.name}</Text>
                      <Text style={styles.catSpendAmount}>{formatCurrency(cs.amount, currency.code)}</Text>
                    </View>
                    <View style={styles.catSpendBarBg}>
                      <View style={[styles.catSpendBar, { width: `${barWidth}%`, backgroundColor: cs.color }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/ledger')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentTxns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first transaction</Text>
            </View>
          ) : (
            recentTxns.slice(0, 10).map((txn: any) => {
              const cat = getCategoryForTxn(txn);
              return (
                <View key={txn.id} style={styles.txnRow}>
                  <View style={[styles.txnIcon, { backgroundColor: (cat?.color || '#94A3B8') + '18' }]}>
                    <Ionicons name={(cat?.icon || 'help-circle') as any} size={20} color={cat?.color || '#94A3B8'} />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnName}>{txn.note || cat?.name || (txn.type === 'transfer' ? 'Transfer' : txn.type === 'income' ? 'Income' : 'Expense')}</Text>
                    <Text style={styles.txnDate}>{new Date(txn.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</Text>
                  </View>
                  <Text style={[styles.txnAmount, { color: txn.type === 'income' ? '#66BB6A' : txn.type === 'transfer' ? '#42A5F5' : '#EF5350' }]}>
                    {txn.type === 'income' ? '+' : txn.type === 'transfer' ? '' : '-'}{formatCurrency(txn.amount, currency.code)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 26, fontWeight: '800', color: Colors.light.text },
  headerSubtitle: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },

  balanceCard: { marginHorizontal: 20, borderRadius: 24, overflow: 'hidden', marginBottom: 20, backgroundColor: Colors.light.tint, elevation: 6, shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
  balanceCardInner: { padding: 24 },
  balanceLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },
  balanceAmount: { color: '#FFF', fontSize: 36, fontWeight: '800', marginTop: 4, marginBottom: 20 },
  incExpRow: { flexDirection: 'row', alignItems: 'center' },
  incExpItem: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  incExpIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  incExpLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '500' },
  incExpAmount: { fontSize: 16, fontWeight: '700' },
  incExpDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 12 },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 24 },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionIcon: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  quickActionText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary },

  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  seeAll: { fontSize: 14, fontWeight: '600', color: Colors.light.tint },

  accountScroll: { marginBottom: 4 },
  accountCard: { width: 160, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginRight: 12, borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6 },
  accountCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  accountType: { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  accountName: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  accountBalance: { fontSize: 18, fontWeight: '800', color: Colors.light.text },

  catSpendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  catSpendIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  catSpendInfo: { flex: 1 },
  catSpendTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  catSpendName: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  catSpendAmount: { fontSize: 14, fontWeight: '700', color: Colors.light.text },
  catSpendBarBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3 },
  catSpendBar: { height: 6, borderRadius: 3 },

  txnRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  txnIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  txnDate: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: 16, fontWeight: '700' },

  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94A3B8', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#CBD5E1', marginTop: 4 },

  fab: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 18, backgroundColor: Colors.light.tint, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: Colors.light.tint, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
});
