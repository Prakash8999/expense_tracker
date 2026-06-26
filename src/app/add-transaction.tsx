import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '@/store/useStore';
import { addTransaction } from '@/db/queries';
import { router } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AddTransactionScreen() {
  const { accounts, categories, loadData } = useStore();
  const colors = Colors.light;

  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  
  // Quick defaults
  const [accountId, setAccountId] = useState(accounts.length > 0 ? accounts[0].id : '');
  const [categoryId, setCategoryId] = useState(categories.length > 0 ? categories[0].id : '');

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount))) {
      Alert.alert('Invalid Amount', 'Please enter a valid number.');
      return;
    }
    if (!accountId) {
      Alert.alert('No Account', 'Please select an account or create one first.');
      return;
    }

    try {
      await addTransaction(accountId, categoryId, Number(amount), type, note);
      await loadData(); // refresh store
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.typeSelector}>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'expense' && { backgroundColor: '#FF6B6B' }]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.typeBtnText, type === 'expense' && { color: '#FFF' }]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, type === 'income' && { backgroundColor: '#4ECDC4' }]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.typeBtnText, type === 'income' && { color: '#FFF' }]}>Income</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Amount (e.g. 50.00)"
        placeholderTextColor={colors.tabIconDefault}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        placeholder="Note (optional)"
        placeholderTextColor={colors.tabIconDefault}
        value={note}
        onChangeText={setNote}
      />

      <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.tint }]} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  typeSelector: { flexDirection: 'row', marginBottom: 24, gap: 12 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  typeBtnText: { fontSize: 16, fontWeight: 'bold', color: '#888' },
  input: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 16, marginBottom: 16 },
  saveBtn: { padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
