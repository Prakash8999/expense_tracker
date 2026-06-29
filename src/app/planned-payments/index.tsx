import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';
import { markPlannedPaymentAsPaid } from '@/db/queries';

export default function PlannedPaymentsHubScreen() {
  const { plannedPayments, currency, loadPlannedPayments, loadAccounts, loadTransactions } = useStore();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();

  // Categorize Payments
  const overdue = plannedPayments.filter(p => p.nextDueDate < now.getTime());
  const dueThisMonth = plannedPayments.filter(p => p.nextDueDate >= now.getTime() && p.nextDueDate <= endOfMonth);
  const future = plannedPayments.filter(p => p.nextDueDate > endOfMonth);

  const handleMarkAsPaid = async (paymentId: string) => {
    const res = await markPlannedPaymentAsPaid(paymentId);
    if (res.success) {
      await loadPlannedPayments();
      await loadAccounts();
      await loadTransactions();
      Alert.alert('Success', 'Payment marked as paid and deducted from your account.');
    } else {
      Alert.alert('Payment Failed', res.error || 'Failed to process payment.');
    }
  };

  const calculateTrueCost = (payment: any, years: number) => {
    let multiplier = 1;
    if (payment.frequency === 'daily') multiplier = 365;
    if (payment.frequency === 'weekly') multiplier = 52;
    if (payment.frequency === 'monthly') multiplier = 12;
    if (payment.frequency === 'yearly') multiplier = 1;
    return payment.amount * multiplier * years;
  };

  const renderPaymentList = (title: string, data: any[]) => {
    if (data.length === 0) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map(p => (
          <TouchableOpacity key={p.id} style={styles.paymentCard} onPress={() => setSelectedPayment(p)}>
            <View style={styles.paymentIcon}>
              <Ionicons name="receipt" size={24} color="#6366F1" />
            </View>
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentName}>{p.name}</Text>
              <Text style={styles.paymentDate}>
                Due: {new Date(p.nextDueDate).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.paymentRight}>
              <Text style={[styles.paymentAmount, p.type === 'income' ? { color: '#66BB6A' } : {}]}>
                {formatCurrency(p.amount, currency.code)}
              </Text>
              <TouchableOpacity 
                style={styles.payButton}
                onPress={() => handleMarkAsPaid(p.id)}
              >
                <Ionicons name="checkmark-circle" size={24} color="#6366F1" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planned Payments</Text>
        <TouchableOpacity onPress={() => router.push('/add-planned-payment')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {renderPaymentList('Overdue', overdue)}
        {renderPaymentList('Due This Month', dueThisMonth)}
        {renderPaymentList('Upcoming', future)}
        
        {plannedPayments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No planned payments</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* True Cost Modal */}
      {selectedPayment && (
        <Modal transparent animationType="slide" visible={!!selectedPayment} onRequestClose={() => setSelectedPayment(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>True Cost Visualizer</Text>
                <TouchableOpacity onPress={() => setSelectedPayment(null)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                See how much <Text style={{fontWeight: '700'}}>{selectedPayment.name}</Text> is really costing you over time.
              </Text>

              <View style={styles.trueCostGrid}>
                <View style={styles.trueCostBox}>
                  <Text style={styles.tcLabel}>1 Year</Text>
                  <Text style={styles.tcAmount}>{formatCurrency(calculateTrueCost(selectedPayment, 1), currency.code)}</Text>
                </View>
                <View style={styles.trueCostBox}>
                  <Text style={styles.tcLabel}>5 Years</Text>
                  <Text style={[styles.tcAmount, { color: '#F59E0B' }]}>{formatCurrency(calculateTrueCost(selectedPayment, 5), currency.code)}</Text>
                </View>
                <View style={styles.trueCostBox}>
                  <Text style={styles.tcLabel}>10 Years</Text>
                  <Text style={[styles.tcAmount, { color: '#EF5350' }]}>{formatCurrency(calculateTrueCost(selectedPayment, 10), currency.code)}</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  paymentIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  paymentInfo: { flex: 1 },
  paymentName: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  paymentDate: { fontSize: 12, fontWeight: '500', color: '#94A3B8' },
  paymentRight: { alignItems: 'flex-end', flexDirection: 'row', gap: 10 },
  paymentAmount: { fontSize: 16, fontWeight: '700', color: '#EF5350', alignSelf: 'center' },
  payButton: { padding: 4 },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#94A3B8', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  modalSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 20 },
  
  trueCostGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  trueCostBox: { flex: 1, backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, alignItems: 'center' },
  tcLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 8 },
  tcAmount: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
});
