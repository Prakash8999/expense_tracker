import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addAccount } from '@/db/queries';
import { searchCurrencies, CurrencyInfo } from '@/utils/currency';

const TYPES = [
  { key: 'cash', label: 'Cash', icon: 'cash' as const, color: '#66BB6A' },
  { key: 'bank', label: 'Bank', icon: 'business' as const, color: '#42A5F5' },
  { key: 'credit', label: 'Credit Card', icon: 'card' as const, color: '#EF5350' },
  { key: 'savings', label: 'Savings', icon: 'lock-closed' as const, color: '#AB47BC' },
  { key: 'ewallet', label: 'E-Wallet', icon: 'phone-portrait' as const, color: '#FF7043' },
];

export function SetupModal() {
  const { isOnboarded, setOnboarded, currency, setCurrency, loadData } = useStore();
  const [step, setStep] = useState<'currency' | 'account'>('currency');

  // Currency State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo>(currency);
  const filteredCurrencies = searchCurrencies(searchQuery).slice(0, 50);

  // Account State
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('bank');

  if (isOnboarded) return null;

  const handleSkip = async () => {
    setOnboarded(true);
    await loadData();
  };

  const handleCurrencyNext = () => {
    setCurrency(selectedCurrency);
    setStep('account');
  };

  const handleSaveAccount = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name.');
      return;
    }
    const selectedType = TYPES.find(t => t.key === type)!;
    await addAccount({ 
      name: name.trim(), 
      type, 
      balance: parseFloat(balance) || 0, 
      currency: currency.code, 
      icon: selectedType.icon, 
      color: selectedType.color 
    });
    setOnboarded(true);
    await loadData();
  };

  return (
    <Modal visible={!isOnboarded} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          
          <View style={styles.modalContent}>
            {step === 'currency' ? (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>Welcome! 👋</Text>
                  <Text style={styles.subtitle}>Select your primary currency</Text>
                </View>

                <View style={styles.searchBox}>
                  <Ionicons name="search" size={20} color="#94A3B8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search currencies..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>

                <FlatList
                  data={filteredCurrencies}
                  keyExtractor={item => item.code}
                  style={styles.currencyList}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.currencyItem, item.code === selectedCurrency.code && styles.currencySelected]}
                      onPress={() => setSelectedCurrency(item)}
                    >
                      <View style={styles.currencyLeft}>
                        <Text style={styles.currencySymbol}>{item.symbol}</Text>
                        <View>
                          <Text style={styles.currencyCode}>{item.code}</Text>
                          <Text style={styles.currencyName}>{item.name}</Text>
                        </View>
                      </View>
                      {item.code === selectedCurrency.code && (
                        <Ionicons name="checkmark-circle" size={24} color={Colors.light.tint} />
                      )}
                    </TouchableOpacity>
                  )}
                />

                <View style={[styles.footer, { justifyContent: 'flex-end' }]}>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleCurrencyNext}>
                    <Text style={styles.primaryBtnText}>Continue</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.header}>
                  <Text style={styles.title}>First Account</Text>
                  <Text style={styles.subtitle}>Let's set up your first account</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, width: '100%' }}>
                  <TextInput style={styles.input} placeholder="Account Name (e.g. Chase Bank)" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
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

                <View style={styles.footer}>
                  <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
                    <Text style={styles.skipText}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveAccount}>
                    <Text style={styles.primaryBtnText}>Start Tracking</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: Colors.light.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.light.text },
  subtitle: { fontSize: 15, color: Colors.light.textSecondary, marginTop: 4 },
  
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 16, color: Colors.light.text },
  
  currencyList: { flex: 1, marginBottom: 16 },
  currencyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  currencySelected: { backgroundColor: Colors.light.tint + '15' },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: Colors.light.text, width: 36, textAlign: 'center' },
  currencyCode: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  currencyName: { fontSize: 13, color: Colors.light.textSecondary },

  input: { backgroundColor: '#F1F5F9', borderRadius: 14, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 14 },
  label: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12, marginTop: 4 },
  
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  typeCard: { width: '47%' as any, backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 2, borderColor: '#E2E8F0' },
  typeLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTopWidth: 1, borderColor: '#F1F5F9' },
  skipBtn: { paddingVertical: 14, paddingHorizontal: 24 },
  skipText: { fontSize: 16, fontWeight: '600', color: Colors.light.textSecondary },
  primaryBtn: { backgroundColor: Colors.light.tint, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
