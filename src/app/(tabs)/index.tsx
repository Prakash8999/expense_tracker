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
  const { accounts, transactions, currency, isLoading, loadData, categories, plannedPayments, debts, goals } = useStore();

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

  // 1. Safe to Spend
  const safeToSpend = useMemo(() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    
    const activeBills = plannedPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // If they have income logged this month, use strict budgeting
    let available = 0;
    if (monthStats.income > 0) {
      available = monthStats.income - monthStats.expense - activeBills;
    } else {
      // Fallback: use total bank balance
      available = totalBalance - activeBills;
    }
    
    return available > 0 ? available / daysLeft : 0;
  }, [monthStats, plannedPayments, totalBalance]);

  // 2. Financial Health Score
  const healthScore = useMemo(() => {
    if (monthStats.income === 0) return { msg: "Keep track of your spending!", color: "#42A5F5", icon: "information-circle" };
    const saved = monthStats.income - monthStats.expense;
    const rate = (saved / monthStats.income) * 100;
    if (rate >= 20) return { msg: `🔥 Amazing! Saving ${rate.toFixed(0)}% this month.`, color: "#66BB6A", icon: "flame" };
    if (rate >= 5) return { msg: `👍 Good job! Saving ${rate.toFixed(0)}% this month.`, color: "#42A5F5", icon: "thumbs-up" };
    if (rate >= 0) return { msg: `⚠️ You are breaking even. Watch your expenses.`, color: "#FFA726", icon: "warning" };
    return { msg: `🚨 You're overspending by ${Math.abs(rate).toFixed(0)}%!`, color: "#EF5350", icon: "alert-circle" };
  }, [monthStats]);

  // 3. Upcoming Bills
  const upcomingBills = useMemo(() => {
    const now = Date.now();
    return [...plannedPayments]
      .filter(p => p.nextDueDate >= now)
      .sort((a, b) => a.nextDueDate - b.nextDueDate)
      .slice(0, 5);
  }, [plannedPayments]);

  // 4. Active Goal Mini Tracker
  const activeGoal = useMemo(() => {
    if (goals.length === 0) return null;
    return [...goals].sort((a, b) => {
      const aDone = a.currentAmount >= a.targetAmount;
      const bDone = b.currentAmount >= b.targetAmount;
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return (a.targetDate || Infinity) - (b.targetDate || Infinity);
    })[0];
  }, [goals]);

  // 5. Debt Overview
  const debtStats = useMemo(() => {
    let toCollect = 0;
    let toPay = 0;
    debts.forEach(d => {
      if (!d.isSettled) {
        if (d.type === 'lent') toCollect += d.remainingAmount;
        else toPay += d.remainingAmount;
      }
    });
    return { toCollect, toPay };
  }, [debts]);

  const displayTxns = useMemo(() => {
    const grouped: any[] = [];
    const skipIds = new Set();
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (skipIds.has(t.id)) continue;
      if (t.groupId) {
        const match = transactions.find((x: any) => x.groupId === t.groupId && Math.abs(x.date - t.date) < 2000 && x.id !== t.id);
        if (match) {
          skipIds.add(match.id);
          grouped.push({
            ...t,
            id: `group-${t.groupId}-${t.date}`,
            amount: t.amount + match.amount,
            note: t.note?.replace('My Share: ', '')?.replace('Lent to Group: ', ''),
            type: 'expense',
            isGrouped: true,
          });
          continue;
        }
      }
      grouped.push(t);
    }
    return grouped.slice(0, 10);
  }, [transactions]);

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

        {/* 1. Safe To Spend (Simple Text) */}
        <View style={styles.safeToSpendSection}>
          <Text style={styles.safeToSpendText}>
            Daily Safe to Spend: <Text style={{fontWeight: '800', color: Colors.light.tint}}>{formatCurrency(safeToSpend, currency.code)}</Text>
          </Text>
        </View>

        {/* 3. Financial Health Streak */}
        <View style={[styles.healthCard, { backgroundColor: healthScore.color + '15' }]}>
          <Ionicons name={healthScore.icon as any} size={24} color={healthScore.color} />
          <Text style={[styles.healthMsg, { color: healthScore.color }]}>{healthScore.msg}</Text>
        </View>

        {/* 2. Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.billsScroll}>
              {upcomingBills.map(bill => (
                <View key={bill.id} style={styles.billCard}>
                  <View style={styles.billIcon}><Ionicons name="calendar-outline" size={20} color="#7E57C2" /></View>
                  <Text style={styles.billName} numberOfLines={1}>{bill.name}</Text>
                  <Text style={styles.billAmount}>{formatCurrency(bill.amount, currency.code)}</Text>
                  <Text style={styles.billDue}>Due in {Math.ceil((bill.nextDueDate - Date.now())/86400000)}d</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Active Goal */}
        {activeGoal && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Goal Progress</Text>
            <TouchableOpacity style={styles.activeGoalCard} onPress={() => router.push(`/goal-details/${activeGoal.id}` as any)} activeOpacity={0.8}>
              <View style={[styles.goalIconMini, { backgroundColor: activeGoal.color + '20' }]}>
                <Ionicons name={activeGoal.icon as any} size={20} color={activeGoal.color} />
              </View>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.activeGoalName}>{activeGoal.name}</Text>
                <View style={styles.goalMiniBarBg}>
                  <View style={[styles.goalMiniBarFill, { width: `${Math.min(100, (activeGoal.currentAmount/activeGoal.targetAmount)*100)}%`, backgroundColor: activeGoal.color }]} />
                </View>
              </View>
              <Text style={styles.activeGoalPct}>{Math.min(100, (activeGoal.currentAmount/activeGoal.targetAmount)*100).toFixed(0)}%</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Debt Overview */}
        {(debtStats.toCollect > 0 || debtStats.toPay > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debts & Loans</Text>
            <View style={styles.debtRow}>
              <View style={[styles.debtBox, { backgroundColor: '#F0FFF4' }]}>
                <Text style={styles.debtBoxLabel}>To Collect</Text>
                <Text style={[styles.debtBoxAmount, { color: '#66BB6A' }]}>{formatCurrency(debtStats.toCollect, currency.code)}</Text>
              </View>
              <View style={[styles.debtBox, { backgroundColor: '#FFF0F0' }]}>
                <Text style={styles.debtBoxLabel}>To Pay</Text>
                <Text style={[styles.debtBoxAmount, { color: '#EF5350' }]}>{formatCurrency(debtStats.toPay, currency.code)}</Text>
              </View>
            </View>
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
          {displayTxns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first transaction</Text>
            </View>
          ) : (
            displayTxns.map((txn: any) => {
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
                    {txn.type === 'income' ? '+' : (txn.type === 'expense' || (txn.type === 'transfer' && !txn.toAccountId)) ? '-' : ''}{formatCurrency(txn.amount, currency.code)}
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

  // New Widgets Styles
  safeToSpendSection: { paddingHorizontal: 20, marginBottom: 16 },
  safeToSpendText: { fontSize: 16, color: '#64748B', fontWeight: '500' },
  
  healthCard: { marginHorizontal: 20, marginBottom: 24, padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  healthMsg: { fontSize: 14, fontWeight: '600', flex: 1 },

  billsScroll: { paddingTop: 4, paddingBottom: 12 },
  billCard: { width: 140, backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  billIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F0FF', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  billName: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  billAmount: { fontSize: 16, fontWeight: '800', color: Colors.light.text, marginBottom: 4 },
  billDue: { fontSize: 12, color: '#EF5350', fontWeight: '500' },

  activeGoalCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  goalIconMini: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  activeGoalName: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  goalMiniBarBg: { width: '100%', height: 6, backgroundColor: '#F1F5F9', borderRadius: 3 },
  goalMiniBarFill: { height: 6, borderRadius: 3 },
  activeGoalPct: { fontSize: 16, fontWeight: '800', color: Colors.light.text },

  debtRow: { flexDirection: 'row', gap: 12 },
  debtBox: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  debtBoxLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  debtBoxAmount: { fontSize: 18, fontWeight: '800' },
});
