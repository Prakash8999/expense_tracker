import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addBudget } from '@/db/queries';

const PERIODS = [
  { key: 'daily', label: 'Daily', icon: 'today' as const },
  { key: 'weekly', label: 'Weekly', icon: 'calendar-clear' as const },
  { key: 'monthly', label: 'Monthly', icon: 'calendar' as const },
  { key: 'yearly', label: 'Yearly', icon: 'calendar-number' as const },
];

export default function AddBudgetScreen() {
  const { currency, expenseCategories, loadBudgets } = useStore();
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  const [categoryId, setCategoryId] = useState('');

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    await addBudget({ categoryId: categoryId || undefined, amount: parsedAmount, period, startDate: Date.now() });
    await loadBudgets();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>New Budget</Text>
          <TouchableOpacity onPress={handleSave}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TextInput style={styles.input} placeholder={`Budget Amount (${currency.symbol})`} placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} autoFocus />

          <Text style={styles.label}>Period</Text>
          <View style={styles.periodRow}>
            {PERIODS.map(p => (
              <TouchableOpacity key={p.key} style={[styles.periodChip, period === p.key && styles.periodChipActive]} onPress={() => setPeriod(p.key)}>
                <Ionicons name={p.icon} size={18} color={period === p.key ? '#FFF' : '#94A3B8'} />
                <Text style={[styles.periodText, period === p.key && { color: '#FFF' }]}>{p.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Category (optional — leave empty for total budget)</Text>
          <View style={styles.catGrid}>
            <TouchableOpacity style={[styles.catChip, !categoryId && styles.catChipActive]} onPress={() => setCategoryId('')}>
              <Ionicons name="pie-chart" size={18} color={!categoryId ? '#FFF' : '#94A3B8'} />
              <Text style={[styles.catChipText, !categoryId && { color: '#FFF' }]}>All Spending</Text>
            </TouchableOpacity>
            {expenseCategories.map((c: any) => (
              <TouchableOpacity key={c.id} style={[styles.catChip, categoryId === c.id && { backgroundColor: c.color, borderColor: c.color }]} onPress={() => setCategoryId(c.id)}>
                <Ionicons name={c.icon as any} size={18} color={categoryId === c.id ? '#FFF' : c.color} />
                <Text style={[styles.catChipText, categoryId === c.id && { color: '#FFF' }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.light.tint },
  content: { flex: 1, paddingHorizontal: 20 },
  input: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12 },
  periodRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  periodChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  periodChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  periodText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  catChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  catChipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
});
