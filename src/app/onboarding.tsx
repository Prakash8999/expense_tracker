import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addAccount } from '@/db/queries';
import { CURRENCIES, searchCurrencies, type CurrencyInfo } from '@/utils/currency';
import { router } from 'expo-router';

const ACCOUNT_TYPES = [
  { key: 'cash', label: 'Cash', icon: 'cash' as const, color: '#66BB6A' },
  { key: 'bank', label: 'Bank', icon: 'business' as const, color: '#42A5F5' },
  { key: 'credit', label: 'Credit Card', icon: 'card' as const, color: '#EF5350' },
  { key: 'savings', label: 'Savings', icon: 'lock-closed' as const, color: '#AB47BC' },
  { key: 'ewallet', label: 'E-Wallet', icon: 'phone-portrait' as const, color: '#FF7043' },
];

type Step = 'currency' | 'accounts' | 'done';

export default function OnboardingScreen() {
  const { currency, setCurrency, setOnboarded, loadData, isOnboarded } = useStore();
  const [step, setStep] = useState<Step>('currency');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo>(currency);

  useEffect(() => {
    if (isOnboarded) {
      router.replace('/(tabs)');
    }
  }, [isOnboarded]);

  // Account creation
  const [accountName, setAccountName] = useState('');
  const [accountBalance, setAccountBalance] = useState('');
  const [accountType, setAccountType] = useState('cash');
  const [createdAccounts, setCreatedAccounts] = useState<{ name: string; type: string; balance: number }[]>([]);

  const filteredCurrencies = searchCurrencies(searchQuery);

  const handleCurrencySelect = (c: CurrencyInfo) => {
    setSelectedCurrency(c);
  };

  const handleCurrencyConfirm = () => {
    setCurrency(selectedCurrency);
    setStep('accounts');
  };

  const handleAddAccount = async () => {
    if (!accountName.trim()) return;
    const balance = parseFloat(accountBalance) || 0;
    await addAccount({
      name: accountName.trim(),
      type: accountType,
      balance,
      currency: selectedCurrency.code,
      icon: ACCOUNT_TYPES.find(t => t.key === accountType)?.icon || 'wallet',
      color: ACCOUNT_TYPES.find(t => t.key === accountType)?.color || '#6366F1',
    });
    setCreatedAccounts([...createdAccounts, { name: accountName.trim(), type: accountType, balance }]);
    setAccountName('');
    setAccountBalance('');
  };

  const handleFinish = async () => {
    setOnboarded(true);
    await loadData();
    router.replace('/(tabs)');
  };

  if (step === 'currency') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome! 👋</Text>
          <Text style={styles.subtitle}>Let's set up your personal finance tracker</Text>
        </View>

        <View style={styles.stepCard}>
          <Text style={styles.stepTitle}>Select Your Currency</Text>
          <Text style={styles.stepDesc}>
            We detected <Text style={styles.highlight}>{currency.name} ({currency.symbol})</Text> based on your device settings
          </Text>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
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
            keyExtractor={(item) => item.code}
            style={styles.currencyList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.currencyItem,
                  item.code === selectedCurrency.code && styles.currencyItemSelected,
                ]}
                onPress={() => handleCurrencySelect(item)}
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
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleCurrencyConfirm}>
          <Text style={styles.primaryBtnText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 'accounts') {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.title}>Add Your Accounts 💳</Text>
              <Text style={styles.subtitle}>Add your financial accounts to start tracking</Text>
            </View>

            <View style={styles.stepCard}>
              <TextInput
                style={styles.input}
                placeholder="Account name (e.g. Chase Bank)"
                placeholderTextColor="#94A3B8"
                value={accountName}
                onChangeText={setAccountName}
              />

              <TextInput
                style={styles.input}
                placeholder={`Initial balance (${selectedCurrency.symbol})`}
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={accountBalance}
                onChangeText={setAccountBalance}
              />

              <View style={styles.typeRow}>
                {ACCOUNT_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeChip, accountType === t.key && { backgroundColor: t.color + '20', borderColor: t.color }]}
                    onPress={() => setAccountType(t.key)}
                  >
                    <Ionicons name={t.icon} size={18} color={accountType === t.key ? t.color : '#94A3B8'} />
                    <Text style={[styles.typeChipText, accountType === t.key && { color: t.color }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.addAccountBtn} onPress={handleAddAccount}>
                <Ionicons name="add-circle" size={20} color={Colors.light.tint} />
                <Text style={styles.addAccountBtnText}>Add Account</Text>
              </TouchableOpacity>
            </View>

            {createdAccounts.length > 0 && (
              <View style={styles.createdList}>
                <Text style={styles.createdTitle}>Added Accounts</Text>
                {createdAccounts.map((acc, i) => (
                  <View key={i} style={styles.createdItem}>
                    <Ionicons
                      name={ACCOUNT_TYPES.find(t => t.key === acc.type)?.icon || 'wallet'}
                      size={22}
                      color={ACCOUNT_TYPES.find(t => t.key === acc.type)?.color || '#6366F1'}
                    />
                    <Text style={styles.createdItemText}>{acc.name}</Text>
                    <Text style={styles.createdItemBalance}>
                      {selectedCurrency.symbol}{acc.balance.toFixed(selectedCurrency.decimalDigits)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleFinish}>
            <Text style={styles.primaryBtnText}>
              {createdAccounts.length > 0 ? 'Start Tracking' : 'Skip for Now'}
            </Text>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background, padding: 20 },
  header: { marginTop: 20, marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', color: Colors.light.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.light.textSecondary, lineHeight: 22 },
  stepCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 },
  stepTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  stepDesc: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20, marginBottom: 16 },
  highlight: { color: Colors.light.tint, fontWeight: '700' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, marginBottom: 12 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: Colors.light.text },
  currencyList: { flex: 1 },
  currencyItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, marginBottom: 4 },
  currencyItemSelected: { backgroundColor: Colors.light.tint + '10' },
  currencyLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  currencySymbol: { fontSize: 22, fontWeight: '700', color: Colors.light.text, width: 36, textAlign: 'center' },
  currencyCode: { fontSize: 16, fontWeight: '600', color: Colors.light.text },
  currencyName: { fontSize: 13, color: Colors.light.textSecondary },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.tint, borderRadius: 16, paddingVertical: 16, gap: 8, marginBottom: 12 },
  primaryBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 12 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E2E8F0' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  addAccountBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.light.tint, borderStyle: 'dashed' },
  addAccountBtnText: { fontSize: 16, fontWeight: '600', color: Colors.light.tint },
  createdList: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16 },
  createdTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  createdItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  createdItemText: { flex: 1, fontSize: 16, fontWeight: '500', color: Colors.light.text },
  createdItemBalance: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
});
