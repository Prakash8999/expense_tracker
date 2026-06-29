import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';
import { PieChart } from 'react-native-gifted-charts';
import { updateAccount } from '@/db/queries';

export default function AccountsHubScreen() {
  const { accounts, currency, plannedPayments, loadAccounts } = useStore();
  const [showHidden, setShowHidden] = useState(false);

  // Total Balance
  const totalBalance = useMemo(() => {
    return accounts.filter(a => !a.isHidden).reduce((sum, a) => sum + a.balance, 0);
  }, [accounts]);

  // Chart Data
  const pieData = useMemo(() => {
    const visibleAccounts = accounts.filter(a => !a.isHidden && a.balance > 0);
    if (visibleAccounts.length === 0) return [{ value: 1, color: '#E2E8F0', text: '' }];
    
    // Premium color palette for the pie chart so it doesn't look like good/bad (red/green)
    const premiumColors = ['#6366F1', '#8B5CF6', '#3B82F6', '#0EA5E9', '#06B6D4'];
    
    return visibleAccounts.map((a, index) => ({
      value: a.balance,
      color: premiumColors[index % premiumColors.length],
      text: a.name.substring(0, 3)
    }));
  }, [accounts]);

  const displayedAccounts = showHidden ? accounts : accounts.filter(a => !a.isHidden);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounts Hub</Text>
        <TouchableOpacity onPress={() => router.push('/add-account')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Net Worth Chart & Summary */}
        <View style={styles.chartCard}>
          <View style={styles.chartContainer}>
            <PieChart
              donut
              radius={60}
              innerRadius={45}
              data={pieData}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, color: '#94A3B8' }}>Net Worth</Text>
                </View>
              )}
            />
          </View>
          <View style={styles.chartSummary}>
            <Text style={styles.totalBalanceLabel}>Total Available</Text>
            <Text style={styles.totalBalanceAmount}>{formatCurrency(totalBalance, currency.code)}</Text>
          </View>
        </View>

        {/* Toggle Hidden Accounts (Commented out per request)
        {accounts.some(a => a.isHidden) && (
          <View style={styles.toggleHiddenRow}>
            <Text style={styles.toggleHiddenText}>Show Hidden Accounts</Text>
            <Switch
              value={showHidden}
              onValueChange={setShowHidden}
              trackColor={{ false: '#E2E8F0', true: '#6366F1' }}
              thumbColor="#FFF"
            />
          </View>
        )}
        */}

        {/* Account List */}
        <Text style={styles.sectionTitle}>Your Accounts</Text>
        {displayedAccounts.map((account) => (
          <View key={account.id} style={[styles.accountCard, account.isHidden && styles.accountCardHidden]}>
            <View style={[styles.accountIcon, { backgroundColor: account.color + '15' }]}>
              <Ionicons name={account.icon as any} size={24} color={account.color} />
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{account.name}</Text>
              <Text style={styles.accountType}>{account.type.toUpperCase()}</Text>
            </View>
            <View style={styles.accountRight}>
              <Text style={styles.accountBalance}>{formatCurrency(account.balance, currency.code)}</Text>
              {/* <TouchableOpacity onPress={() => toggleHidden(account)} style={styles.hideButton}>
                <Ionicons name={account.isHidden ? "eye-off" : "eye"} size={20} color="#94A3B8" />
              </TouchableOpacity> */}
            </View>
          </View>
        ))}

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
  
  chartCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  chartContainer: { marginRight: 20 },
  chartSummary: { flex: 1 },
  totalBalanceLabel: { fontSize: 13, color: '#64748B', fontWeight: '600', marginBottom: 4 },
  totalBalanceAmount: { fontSize: 24, fontWeight: '800', color: Colors.light.text, marginBottom: 12 },
  
  forecastBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 6, alignSelf: 'flex-start' },
  forecastBoxWarning: { backgroundColor: '#FFEBEE' },
  forecastText: { fontSize: 12, fontWeight: '600', color: '#6366F1' },
  forecastTextWarning: { color: '#EF5350' },

  toggleHiddenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  toggleHiddenText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  accountCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  accountCardHidden: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  accountIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  accountType: { fontSize: 11, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  accountRight: { alignItems: 'flex-end', gap: 6 },
  accountBalance: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  hideButton: { padding: 4 },
});
