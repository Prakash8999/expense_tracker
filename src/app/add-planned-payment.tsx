import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addPlannedPayment } from '@/db/queries';

const FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'];

export default function AddPlannedPaymentScreen() {
  const { currency, accounts, expenseCategories, incomeCategories, loadPlannedPayments } = useStore();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState('monthly');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');

  const cats = type === 'income' ? incomeCategories : expenseCategories;

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a name.'); return; }
    const amt = parseFloat(amount);
    if (!amt) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    if (!accountId) { Alert.alert('Error', 'Select an account.'); return; }
    await addPlannedPayment({ name: name.trim(), amount: amt, type, categoryId: categoryId || undefined, accountId, frequency, startDate: Date.now(), note: '' });
    await loadPlannedPayments();
    router.back();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
        <Text style={s.title}>Planned Payment</Text>
        <TouchableOpacity onPress={handleSave}><Text style={s.save}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.content}>
        <TextInput style={s.input} placeholder="Payment Name (e.g. Netflix)" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder={`Amount (${currency.symbol})`} placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <View style={s.row}>
          {(['expense', 'income'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.chip, type === t && { backgroundColor: t === 'expense' ? '#EF5350' : '#66BB6A', borderColor: t === 'expense' ? '#EF5350' : '#66BB6A' }]} onPress={() => setType(t)}>
              <Text style={[s.chipText, type === t && { color: '#FFF' }]}>{t.charAt(0).toUpperCase() + t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.label}>Frequency</Text>
        <View style={s.row}>
          {FREQUENCIES.map(f => (
            <TouchableOpacity key={f} style={[s.chip, frequency === f && s.chipActive]} onPress={() => setFrequency(f)}>
              <Text style={[s.chipText, frequency === f && { color: '#FFF' }]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.label}>Account</Text>
        <View style={s.row}>
          {accounts.map((a: any) => (
            <TouchableOpacity key={a.id} style={[s.chip, accountId === a.id && { backgroundColor: a.color, borderColor: a.color }]} onPress={() => setAccountId(a.id)}>
              <Text style={[s.chipText, accountId === a.id && { color: '#FFF' }]}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  save: { fontSize: 16, fontWeight: '700', color: Colors.light.tint },
  content: { flex: 1, paddingHorizontal: 20 },
  input: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 14 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 10, marginTop: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  chipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  chipText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
});
