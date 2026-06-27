import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';

const MENU_SECTIONS = [
  {
    title: 'Finance Tools',
    items: [
      { key: 'accounts', icon: 'wallet', color: '#6366F1', label: 'Accounts', route: '/add-account' },
      { key: 'categories', icon: 'grid', color: '#42A5F5', label: 'Categories', route: '/manage-categories' },
      { key: 'planned', icon: 'calendar', color: '#FF7043', label: 'Planned Payments', route: '/add-planned-payment' },
      { key: 'debts', icon: 'people-circle', color: '#EF5350', label: 'Debt Tracker', route: '/add-debt' },
    ],
  },
  {
    title: 'Utilities',
    items: [
      { key: 'shopping', icon: 'cart', color: '#66BB6A', label: 'Shopping Lists', route: '/add-shopping-list' },
      { key: 'documents', icon: 'document-text', color: '#FFA726', label: 'Document Vault', route: '/add-shopping-list' },
      { key: 'investments', icon: 'trending-up', color: '#26A69A', label: 'Investments', route: '/add-shopping-list' },
    ],
  },
  {
    title: 'Data',
    items: [
      { key: 'export', icon: 'download', color: '#7E57C2', label: 'Export CSV', route: '' },
      { key: 'import', icon: 'cloud-upload', color: '#42A5F5', label: 'Import CSV', route: '' },
    ],
  },
];

export default function MoreScreen() {
  const { debts, shoppingLists, investments, currency, accounts, plannedPayments } = useStore();

  const totalDebtOwed = debts.filter((d: any) => d.type === 'lent').reduce((s: number, d: any) => s + d.remainingAmount, 0);
  const totalDebtBorrowed = debts.filter((d: any) => d.type === 'borrowed').reduce((s: number, d: any) => s + d.remainingAmount, 0);
  const totalInvestmentValue = investments.reduce((s: number, i: any) => s + i.currentValue * i.quantity, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="wallet" size={22} color="#6366F1" />
            <Text style={styles.statLabel}>{accounts.length} Accounts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={22} color="#FF7043" />
            <Text style={styles.statLabel}>{plannedPayments.length} Upcoming</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-circle" size={22} color="#EF5350" />
            <Text style={styles.statLabel}>{debts.length} Debts</Text>
          </View>
        </View>

        {/* Debt Summary */}
        {(totalDebtOwed > 0 || totalDebtBorrowed > 0) && (
          <View style={styles.debtSummary}>
            {totalDebtOwed > 0 && (
              <View style={styles.debtItem}>
                <View style={[styles.debtDot, { backgroundColor: '#66BB6A' }]} />
                <Text style={styles.debtLabel}>Others owe you</Text>
                <Text style={[styles.debtAmount, { color: '#66BB6A' }]}>{formatCurrency(totalDebtOwed, currency.code)}</Text>
              </View>
            )}
            {totalDebtBorrowed > 0 && (
              <View style={styles.debtItem}>
                <View style={[styles.debtDot, { backgroundColor: '#EF5350' }]} />
                <Text style={styles.debtLabel}>You owe</Text>
                <Text style={[styles.debtAmount, { color: '#EF5350' }]}>{formatCurrency(totalDebtBorrowed, currency.code)}</Text>
              </View>
            )}
          </View>
        )}

        {/* Menu Sections */}
        {MENU_SECTIONS.map(section => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.menuItem, i < section.items.length - 1 && styles.menuItemBorder]}
                  onPress={() => item.route ? router.push(item.route as any) : null}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>💰 FinTrack</Text>
          <Text style={styles.appVersion}>Version 1.0.0 • Offline First</Text>
          <Text style={styles.appCurrency}>Currency: {currency.name} ({currency.symbol})</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.light.text },

  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  statLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', textAlign: 'center' },

  debtSummary: { marginHorizontal: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  debtItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  debtDot: { width: 10, height: 10, borderRadius: 5 },
  debtLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: Colors.light.text },
  debtAmount: { fontSize: 16, fontWeight: '700' },

  menuSection: { paddingHorizontal: 20, marginBottom: 20 },
  menuSectionTitle: { fontSize: 13, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  menuCard: { backgroundColor: '#FFF', borderRadius: 16, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  menuItemIcon: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuItemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },

  appInfo: { alignItems: 'center', paddingVertical: 32 },
  appName: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  appVersion: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  appCurrency: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
});
