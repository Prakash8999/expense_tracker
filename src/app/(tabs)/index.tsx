import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen() {
  const { accounts, transactions, isLoading, loadData } = useStore();
  const colors = Colors.light; // Forced light mode

  useEffect(() => {
    loadData();
  }, []);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <Text style={{ color: colors.text }}>Loading data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Card */}
      <View style={[styles.headerCard, { backgroundColor: colors.tint }]}>
        <Text style={styles.headerTitle}>Total Balance</Text>
        <Text style={styles.headerAmount}>${totalBalance.toFixed(2)}</Text>
      </View>

      {/* Accounts List */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Accounts</Text>
        {accounts.length === 0 ? (
          <Text style={{ color: colors.tabIconDefault }}>No accounts yet. Add one in Settings.</Text>
        ) : (
          accounts.map(acc => (
            <View key={acc.id} style={[styles.accountCard, { backgroundColor: colors.card }]}>
              <Text style={[styles.accountName, { color: colors.text }]}>{acc.name}</Text>
              <Text style={[styles.accountBalance, { color: colors.text }]}>
                ${acc.balance.toFixed(2)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Activity</Text>
        {transactions.slice(0, 5).map(txn => (
          <View key={txn.id} style={[styles.txnCard, { borderBottomColor: colors.border }]}>
            <View style={styles.txnLeft}>
              <View style={[styles.txnIcon, { backgroundColor: colors.card }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.text} />
              </View>
              <View>
                <Text style={[styles.txnNote, { color: colors.text }]}>{txn.note || 'Expense'}</Text>
                <Text style={{ color: colors.tabIconDefault, fontSize: 12 }}>
                  {new Date(txn.date).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Text style={[
              styles.txnAmount, 
              { color: txn.type === 'income' ? '#4ECDC4' : '#FF6B6B' }
            ]}>
              {txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}
            </Text>
          </View>
        ))}
        {transactions.length === 0 && (
          <Text style={{ color: colors.tabIconDefault }}>No recent activity.</Text>
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.tint }]}
        onPress={() => router.push('/add-transaction')}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerCard: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 8 },
  headerAmount: { color: '#FFF', fontSize: 36, fontWeight: 'bold' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  accountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  accountName: { fontSize: 16, fontWeight: '500' },
  accountBalance: { fontSize: 16, fontWeight: 'bold' },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txnLeft: { flexDirection: 'row', alignItems: 'center' },
  txnIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txnNote: { fontSize: 16, fontWeight: '500' },
  txnAmount: { fontSize: 16, fontWeight: 'bold' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
});
