import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Modal, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { getGoalById, getGoalContributions, addGoalContribution, addTransaction, getCategories } from '@/db/queries';
import { formatCurrency } from '@/utils/currency';

export default function GoalDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currency, accounts, loadGoals, loadTransactions, loadAccounts } = useStore();
  
  const [goal, setGoal] = useState<any>(null);
  const [contributions, setContributions] = useState<any[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const fetchGoalData = useCallback(async () => {
    if (!id) return;
    const g = await getGoalById(id);
    if (g) setGoal(g);
    const c = await getGoalContributions(id);
    setContributions(c);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      fetchGoalData();
    }, [fetchGoalData])
  );

  const handleAddSavings = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount.');
      return;
    }
    
    await addGoalContribution(id, amt, note.trim() || undefined);
    
    // If account selected, deduct as expense
    if (selectedAccountId) {
      const cats = await getCategories('expense');
      // Look for the "Goals" subcategory
      const goalCat = cats.find(c => c.name === 'Goals');
      
      await addTransaction({
        accountId: selectedAccountId,
        categoryId: goalCat?.id,
        amount: amt,
        type: 'expense',
        note: `Saved for: ${goal?.name}${note ? ` - ${note}` : ''}`
      });
      await loadTransactions();
      await loadAccounts();
    }
    
    await loadGoals();
    await fetchGoalData();
    
    setAmount('');
    setNote('');
    setSelectedAccountId(null);
    setShowModal(false);
  };

  if (!goal) return <SafeAreaView style={styles.safe} />;

  const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const daysLeft = goal.targetDate ? Math.max(0, Math.ceil((goal.targetDate - Date.now()) / 86400000)) : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Goal Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={[styles.mainCard, { backgroundColor: goal.color + '10' }]}>
          <View style={[styles.goalIcon, { backgroundColor: goal.color }]}>
            <Ionicons name={goal.icon} size={32} color="#FFF" />
          </View>
          <Text style={styles.goalName}>{goal.name}</Text>
          {daysLeft !== null && (
            <View style={styles.daysBadge}>
              <Ionicons name="time-outline" size={14} color={goal.color} />
              <Text style={[styles.daysText, { color: goal.color }]}>
                {daysLeft === 0 ? 'Target is today!' : `${daysLeft} days left`}
              </Text>
            </View>
          )}

          {/* Progress Section */}
          <Text style={styles.pctLarge}>{pct.toFixed(0)}%</Text>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: goal.color }]} />
          </View>
          
          <View style={styles.amountsRow}>
            <View>
              <Text style={styles.amountLabel}>Saved</Text>
              <Text style={styles.amountValue}>{formatCurrency(goal.currentAmount, currency.code)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.amountLabel}>Target</Text>
              <Text style={styles.amountValue}>{formatCurrency(goal.targetAmount, currency.code)}</Text>
            </View>
          </View>
        </View>

        {/* Add Savings Button */}
        {goal.currentAmount < goal.targetAmount && (
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: goal.color }]} onPress={() => setShowModal(true)}>
            <Ionicons name="add-circle" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>Add Savings</Text>
          </TouchableOpacity>
        )}

        {/* Goal Note */}
        {goal.note && (
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={20} color="#94A3B8" />
            <Text style={styles.noteText}>{goal.note}</Text>
          </View>
        )}

        {/* History List */}
        <Text style={styles.sectionTitle}>Contribution History</Text>
        {contributions.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Ionicons name="leaf-outline" size={32} color="#CBD5E1" />
            <Text style={styles.emptyHistoryText}>No savings added yet.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {contributions.map((c: any, index: number) => {
              const d = new Date(c.date);
              const isLast = index === contributions.length - 1;
              return (
                <View key={c.id} style={[styles.historyItem, isLast && { borderBottomWidth: 0 }]}>
                  <View style={[styles.historyIcon, { backgroundColor: goal.color + '20' }]}>
                    <Ionicons name="arrow-up" size={16} color={goal.color} />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDate}>{d.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                    {c.note && <Text style={styles.historyNote}>{c.note}</Text>}
                  </View>
                  <Text style={[styles.historyAmt, { color: goal.color }]}>+{formatCurrency(c.amount, currency.code)}</Text>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Savings Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Savings</Text>
                    <TouchableOpacity onPress={() => setShowModal(false)}>
                      <Ionicons name="close-circle" size={24} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.modalInput}
                    placeholder={`Amount (${currency.symbol})`}
                    placeholderTextColor="#94A3B8"
                    keyboardType="decimal-pad"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Note (optional)"
                    placeholderTextColor="#94A3B8"
                    value={note}
                    onChangeText={setNote}
                  />

                  {/* Account Deduct Selector */}
                  <Text style={styles.deductLabel}>Deduct from account (Optional)</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                    {accounts.map((acc: any) => (
                      <TouchableOpacity
                        key={acc.id}
                        style={[
                          styles.accountChip,
                          selectedAccountId === acc.id && { backgroundColor: goal.color, borderColor: goal.color }
                        ]}
                        onPress={() => setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id)}
                      >
                        <Text style={[
                          styles.accountChipText,
                          selectedAccountId === acc.id && { color: '#FFF' }
                        ]}>{acc.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: goal.color }]} onPress={handleAddSavings}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 10 },
  
  mainCard: { borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 20 },
  goalIcon: { width: 64, height: 64, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  goalName: { fontSize: 22, fontWeight: '800', color: Colors.light.text, marginBottom: 8 },
  daysBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  daysText: { fontSize: 13, fontWeight: '600' },
  
  pctLarge: { fontSize: 42, fontWeight: '900', color: Colors.light.text, marginBottom: 16 },
  barBg: { width: '100%', height: 12, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 6, marginBottom: 16 },
  barFill: { height: 12, borderRadius: 6 },
  
  amountsRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  amountLabel: { fontSize: 13, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  amountValue: { fontSize: 16, fontWeight: '700', color: Colors.light.text },

  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 16, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  addBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },

  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 24 },
  noteText: { flex: 1, fontSize: 14, color: '#64748B', fontStyle: 'italic' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 16 },
  
  historyList: { backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  historyIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  historyInfo: { flex: 1 },
  historyDate: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  historyNote: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  historyAmt: { fontSize: 16, fontWeight: '700' },

  emptyHistory: { alignItems: 'center', paddingVertical: 30, backgroundColor: '#FFF', borderRadius: 20 },
  emptyHistoryText: { fontSize: 14, color: '#94A3B8', marginTop: 10 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  modalInput: { backgroundColor: '#F8FAFC', borderRadius: 14, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 12 },
  
  deductLabel: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary, marginTop: 10, marginBottom: 10 },
  accountScroll: { flexDirection: 'row', marginBottom: 24 },
  accountChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 10, backgroundColor: '#FFF' },
  accountChipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },

  saveBtn: { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
