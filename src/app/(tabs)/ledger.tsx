import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useStore } from '@/store/useStore';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function LedgerScreen() {
  const { transactions } = useStore();
  const colors = Colors.light;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Passbook / Ledger</Text>
      </View>
      
      <View style={styles.list}>
        {transactions.length === 0 ? (
          <Text style={{ color: colors.tabIconDefault, textAlign: 'center', marginTop: 40 }}>
            No transactions found.
          </Text>
        ) : (
          transactions.map(txn => (
            <View key={txn.id} style={[styles.txnCard, { borderBottomColor: colors.border }]}>
              <View style={styles.txnLeft}>
                <View style={[styles.txnIcon, { backgroundColor: colors.card }]}>
                  <Ionicons name="receipt-outline" size={24} color={colors.text} />
                </View>
                <View>
                  <Text style={[styles.txnNote, { color: colors.text }]}>
                    {txn.note || (txn.type === 'income' ? 'Income' : 'Expense')}
                  </Text>
                  <Text style={{ color: colors.tabIconDefault, fontSize: 14 }}>
                    {new Date(txn.date).toLocaleDateString()} • {new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  txnLeft: { flexDirection: 'row', alignItems: 'center' },
  txnIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  txnNote: { fontSize: 18, fontWeight: '500', marginBottom: 4 },
  txnAmount: { fontSize: 18, fontWeight: 'bold' },
});
