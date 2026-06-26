import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useStore } from '@/store/useStore';
import { addAccount } from '@/db/queries';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';

export default function SettingsScreen() {
  const { loadData } = useStore();
  const colors = Colors.light;

  const [accName, setAccName] = useState('');
  const [accBalance, setAccBalance] = useState('');
  const [accType, setAccType] = useState('bank'); // bank | cash | credit

  const handleAddAccount = async () => {
    if (!accName) {
      Alert.alert('Validation Error', 'Please enter an account name.');
      return;
    }
    const balance = Number(accBalance);
    if (isNaN(balance)) {
      Alert.alert('Validation Error', 'Please enter a valid initial balance.');
      return;
    }

    try {
      await addAccount(accName, accType, balance);
      setAccName('');
      setAccBalance('');
      await loadData();
      Alert.alert('Success', 'Account added successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Add New Account</Text>
        
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Account Name (e.g. Chase Checkings)"
          placeholderTextColor={colors.tabIconDefault}
          value={accName}
          onChangeText={setAccName}
        />
        
        <TextInput
          style={[styles.input, { color: colors.text, borderColor: colors.border }]}
          placeholder="Initial Balance (e.g. 1500.00)"
          placeholderTextColor={colors.tabIconDefault}
          keyboardType="numeric"
          value={accBalance}
          onChangeText={setAccBalance}
        />

        <View style={styles.typeSelector}>
          {['bank', 'cash', 'credit'].map((type) => (
            <TouchableOpacity 
              key={type}
              style={[
                styles.typeBtn, 
                accType === type && { backgroundColor: colors.tint, borderColor: colors.tint }
              ]}
              onPress={() => setAccType(type)}
            >
              <Text style={[
                styles.typeBtnText, 
                { color: accType === type ? '#FFF' : colors.text }
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.saveBtn, { backgroundColor: colors.tint }]} 
          onPress={handleAddAccount}
        >
          <Text style={styles.saveBtnText}>Add Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  section: { padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 8, padding: 16, fontSize: 16, marginBottom: 16 },
  typeSelector: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  typeBtnText: { fontSize: 14, fontWeight: 'bold' },
  saveBtn: { padding: 16, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
