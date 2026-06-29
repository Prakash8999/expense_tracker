import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';
import { consolidateDebts, addDebtPayment, getDebtPayments } from '@/db/queries';

export default function DebtTrackerHubScreen() {
  const { debts, currency, loadDebts } = useStore();
  const [activeTab, setActiveTab] = useState<'lent' | 'borrowed'>('lent');
  
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);
  const [debtPaymentsCache, setDebtPaymentsCache] = useState<Record<string, any[]>>({});

  // Filter debts
  const lentDebts = debts.filter(d => d.type === 'lent' && !d.isSettled);
  const borrowedDebts = debts.filter(d => d.type === 'borrowed' && !d.isSettled);

  const displayedDebts = activeTab === 'lent' ? lentDebts : borrowedDebts;

  // Smart Settle-Up Engine logic
  const consolidationOpportunities = useMemo(() => {
    const opps: any[] = [];
    const lentMap = new Map();
    lentDebts.forEach(d => {
      const existing = lentMap.get(d.personName.toLowerCase());
      if (!existing || existing.remainingAmount < d.remainingAmount) {
        lentMap.set(d.personName.toLowerCase(), d);
      }
    });

    borrowedDebts.forEach(borrowed => {
      const lent = lentMap.get(borrowed.personName.toLowerCase());
      if (lent) {
        const settleAmount = Math.min(lent.remainingAmount, borrowed.remainingAmount);
        opps.push({
          personName: borrowed.personName,
          settleAmount,
          lentId: lent.id,
          borrowedId: borrowed.id,
        });
      }
    });
    return opps;
  }, [lentDebts, borrowedDebts]);

  const handleConsolidate = (opp: any) => {
    Alert.alert(
      'Smart Settle-Up',
      `You owe ${opp.personName} and they owe you.\n\nDo you want to consolidate this debt and automatically settle ${formatCurrency(opp.settleAmount, currency.code)} from both balances?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Consolidate', 
          onPress: async () => {
            await consolidateDebts(opp.lentId, opp.borrowedId, opp.settleAmount);
            await loadDebts();
            Alert.alert('Success', 'Debts consolidated successfully!');
          }
        }
      ]
    );
  };

  const handleLogPaymentSubmit = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || !selectedDebtId) return;
    await addDebtPayment(selectedDebtId, amt);
    setPaymentModalVisible(false);
    setPaymentAmount('');
    
    // Refresh cache for this debt
    const payments = await getDebtPayments(selectedDebtId);
    setDebtPaymentsCache(prev => ({...prev, [selectedDebtId]: payments}));
    
    setSelectedDebtId(null);
    await loadDebts();
  };

  const toggleExpand = async (id: string) => {
    if (expandedDebtId === id) {
      setExpandedDebtId(null);
    } else {
      setExpandedDebtId(id);
      const payments = await getDebtPayments(id);
      setDebtPaymentsCache(prev => ({...prev, [id]: payments}));
    }
  };

  const renderProgressBar = (total: number, remaining: number) => {
    const paid = total - remaining;
    const percentage = Math.min(100, Math.max(0, (paid / total) * 100));
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressText}>{Math.round(percentage)}% Paid</Text>
          <Text style={styles.progressText}>{formatCurrency(remaining, currency.code)} left</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debt Tracker</Text>
        <TouchableOpacity onPress={() => router.push('/add-debt')} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'lent' && styles.activeTab]} 
          onPress={() => setActiveTab('lent')}
        >
          <Text style={[styles.tabText, activeTab === 'lent' && styles.activeTabText]}>Lent (Owed to Me)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'borrowed' && styles.activeTab]} 
          onPress={() => setActiveTab('borrowed')}
        >
          <Text style={[styles.tabText, activeTab === 'borrowed' && styles.activeTabText]}>Borrowed (I Owe)</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Smart Settle-Up Banner */}
        {consolidationOpportunities.map((opp, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.consolidationBanner}
            onPress={() => handleConsolidate(opp)}
          >
            <View style={styles.bannerIcon}>
              <Ionicons name="flash" size={20} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bannerTitle}>Smart Settle-Up Available</Text>
              <Text style={styles.bannerText}>
                You and {opp.personName} owe each other. Tap to auto-settle {formatCurrency(opp.settleAmount, currency.code)}.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#F59E0B" />
          </TouchableOpacity>
        ))}

        {/* Debts List */}
        {displayedDebts.map(debt => (
          <View key={debt.id} style={styles.debtCard}>
            <View style={styles.debtHeader}>
              <View style={[styles.debtIcon, { backgroundColor: debt.type === 'lent' ? '#EEFBF4' : '#FFEBEE' }]}>
                <Ionicons name="person" size={20} color={debt.type === 'lent' ? '#66BB6A' : '#EF5350'} />
              </View>
              <View style={styles.debtInfo}>
                <Text style={styles.debtPerson}>{debt.personName}</Text>
                <Text style={styles.debtDate}>{new Date(debt.date).toLocaleDateString()}</Text>
              </View>
              <View style={styles.debtAmountContainer}>
                <Text style={styles.debtTotal}>{formatCurrency(debt.totalAmount, currency.code)}</Text>
              </View>
            </View>
            
            {renderProgressBar(debt.totalAmount, debt.remainingAmount)}
            
            {expandedDebtId === debt.id && (
              <View style={styles.historyContainer}>
                <Text style={styles.historyTitle}>Payment History</Text>
                {(!debtPaymentsCache[debt.id] || debtPaymentsCache[debt.id].length === 0) && (
                  <Text style={styles.historyEmpty}>No payments logged yet.</Text>
                )}
                {debtPaymentsCache[debt.id]?.map((payment: any) => (
                  <View key={payment.id} style={styles.historyRow}>
                    <Text style={styles.historyDate}>{new Date(payment.date).toLocaleString()}</Text>
                    <Text style={styles.historyAmount}>{formatCurrency(payment.amount, currency.code)}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.debtActions}>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => {
                  setSelectedDebtId(debt.id);
                  setPaymentModalVisible(true);
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#6366F1" />
                <Text style={styles.actionBtnText}>Log Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn}
                onPress={() => toggleExpand(debt.id)}
              >
                <Ionicons name={expandedDebtId === debt.id ? "chevron-up" : "time-outline"} size={18} color="#64748B" />
                <Text style={[styles.actionBtnText, { color: '#64748B' }]}>{expandedDebtId === debt.id ? 'Hide' : 'History'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {displayedDebts.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No active debts here.</Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Log Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Log Repayment</Text>
                <TouchableOpacity onPress={() => { setPaymentModalVisible(false); setPaymentAmount(''); }}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <TextInput 
                style={styles.input} 
                placeholder="Amount" 
                keyboardType="decimal-pad"
                value={paymentAmount} 
                onChangeText={setPaymentAmount} 
                autoFocus
              />

              <TouchableOpacity style={styles.saveBtn} onPress={handleLogPaymentSubmit}>
                <Text style={styles.saveBtnText}>Save Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  
  tabsContainer: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F8FAFC', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  activeTabText: { color: Colors.light.text, fontWeight: '700' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  consolidationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFBEB', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#FEF3C7' },
  bannerIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  bannerTitle: { fontSize: 14, fontWeight: '700', color: '#D97706', marginBottom: 2 },
  bannerText: { fontSize: 12, color: '#92400E', lineHeight: 18 },

  debtCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  debtHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  debtIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  debtInfo: { flex: 1 },
  debtPerson: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 2 },
  debtDate: { fontSize: 12, color: '#94A3B8', fontWeight: '500' },
  debtAmountContainer: { alignItems: 'flex-end' },
  debtTotal: { fontSize: 16, fontWeight: '800', color: Colors.light.text },

  progressContainer: { marginBottom: 16 },
  progressTrack: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#6366F1', borderRadius: 4 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  historyContainer: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginBottom: 16 },
  historyTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8, textTransform: 'uppercase' },
  historyEmpty: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyDate: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  historyAmount: { fontSize: 14, fontWeight: '700', color: Colors.light.text },

  debtActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F8FAFC', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', paddingVertical: 6 },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
  
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#94A3B8', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 16 },
  saveBtn: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
