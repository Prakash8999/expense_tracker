import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addDebt } from '@/db/queries';

export default function AddDebtScreen() {
  const { currency, loadDebts } = useStore();
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'lent' | 'borrowed'>('lent');
  const [note, setNote] = useState('');

  const handleSave = async () => {
    if (!personName.trim()) { Alert.alert('Error', 'Enter a person name.'); return; }
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount.'); return; }
    await addDebt({ personName: personName.trim(), type, totalAmount: amt, date: Date.now(), note: note.trim() || undefined });
    await loadDebts();
    router.back();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
        <Text style={s.headerTitle}>Add Debt</Text>
        <TouchableOpacity onPress={handleSave}><Text style={s.saveText}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.content}>
        <View style={s.typeRow}>
          <TouchableOpacity style={[s.typeBtn, type === 'lent' && { backgroundColor: '#66BB6A' }]} onPress={() => setType('lent')}>
            <Ionicons name="arrow-up-circle" size={20} color={type === 'lent' ? '#FFF' : '#94A3B8'} />
            <Text style={[s.typeText, type === 'lent' && { color: '#FFF' }]}>I Lent</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.typeBtn, type === 'borrowed' && { backgroundColor: '#EF5350' }]} onPress={() => setType('borrowed')}>
            <Ionicons name="arrow-down-circle" size={20} color={type === 'borrowed' ? '#FFF' : '#94A3B8'} />
            <Text style={[s.typeText, type === 'borrowed' && { color: '#FFF' }]}>I Borrowed</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={s.input} placeholder="Person's Name" placeholderTextColor="#94A3B8" value={personName} onChangeText={setPersonName} />
        <TextInput style={s.input} placeholder={`Amount (${currency.symbol})`} placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
        <TextInput style={[s.input, { minHeight: 56 }]} placeholder="Note (optional)" placeholderTextColor="#94A3B8" value={note} onChangeText={setNote} multiline />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.light.tint },
  content: { flex: 1, paddingHorizontal: 20 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0' },
  typeText: { fontSize: 15, fontWeight: '700', color: '#94A3B8' },
  input: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 14 },
});
