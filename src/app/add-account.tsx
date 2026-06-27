import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addAccount } from '@/db/queries';

const TYPES = [
  { key: 'cash', label: 'Cash', icon: 'cash' as const, color: '#66BB6A' },
  { key: 'bank', label: 'Bank', icon: 'business' as const, color: '#42A5F5' },
  { key: 'credit', label: 'Credit Card', icon: 'card' as const, color: '#EF5350' },
  { key: 'savings', label: 'Savings', icon: 'lock-closed' as const, color: '#AB47BC' },
  { key: 'ewallet', label: 'E-Wallet', icon: 'phone-portrait' as const, color: '#FF7043' },
];

export default function AddAccountScreen() {
  const { currency, loadAccounts, loadData } = useStore();
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('bank');

  const selected = TYPES.find(t => t.key === type)!;

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter an account name.'); return; }
    await addAccount({ name: name.trim(), type, balance: parseFloat(balance) || 0, currency: currency.code, icon: selected.icon, color: selected.color });
    await loadData();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>New Account</Text>
          <TouchableOpacity onPress={handleSave}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <TextInput style={styles.input} placeholder="Account Name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder={`Initial Balance (${currency.symbol})`} placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={balance} onChangeText={setBalance} />
          <Text style={styles.label}>Account Type</Text>
          <View style={styles.typeGrid}>
            {TYPES.map(t => (
              <TouchableOpacity key={t.key} style={[styles.typeCard, type === t.key && { borderColor: t.color, backgroundColor: t.color + '10' }]} onPress={() => setType(t.key)}>
                <Ionicons name={t.icon} size={24} color={type === t.key ? t.color : '#94A3B8'} />
                <Text style={[styles.typeLabel, type === t.key && { color: t.color }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
  input: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12, marginTop: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: { width: '47%' as any, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#F1F5F9' },
  typeLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
});
