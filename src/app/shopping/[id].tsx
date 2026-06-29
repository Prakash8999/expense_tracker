import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';
import { getShoppingItems, toggleShoppingItem, addShoppingItem } from '@/db/queries';

export default function ShoppingListDetailScreen() {
  const { id } = useLocalSearchParams();
  const { shoppingLists, currency } = useStore();
  
  const list = shoppingLists.find(l => l.id === id);
  const [items, setItems] = useState<any[]>([]);
  
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');

  useEffect(() => {
    if (id) loadItems();
  }, [id]);

  const loadItems = async () => {
    const data = await getShoppingItems(id as string);
    setItems(data);
  };

  const handleToggle = async (itemId: string, currentVal: boolean) => {
    await toggleShoppingItem(itemId, !currentVal);
    await loadItems();
  };

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;
    await addShoppingItem(
      id as string, 
      newItemName.trim(), 
      parseFloat(newItemPrice) || undefined, 
      undefined, // category removed
      parseFloat(newItemQuantity) || undefined,
      newItemUnit.trim() || undefined
    );
    setNewItemName('');
    setNewItemPrice('');
    setNewItemQuantity('');
    setNewItemUnit('');
    await loadItems();
  };

  if (!list) return null;

  const totalSpent = items.filter(i => i.isChecked).reduce((s, i) => s + (i.expectedPrice || 0), 0);
  const totalEst = items.reduce((s, i) => s + (i.expectedPrice || 0), 0);
  
  const hasBudget = list.budget && list.budget > 0;
  const budgetPercentage = hasBudget ? Math.min(100, (totalSpent / list.budget!) * 100) : 0;
  const isOverBudget = hasBudget && totalSpent > list.budget!;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{list.name}</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Budget Bar */}
        {hasBudget && (
          <View style={styles.budgetCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Spent: {formatCurrency(totalSpent, currency.code)}</Text>
              <Text style={styles.progressLabel}>Budget: {formatCurrency(list.budget, currency.code)}</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${budgetPercentage}%`, backgroundColor: isOverBudget ? '#EF5350' : '#22C55E' }]} />
            </View>
            {isOverBudget && <Text style={styles.overBudgetText}>You are over budget!</Text>}
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {items.map(item => (
            <TouchableOpacity key={item.id} style={styles.itemRow} onPress={() => handleToggle(item.id, item.isChecked)}>
              <View style={[styles.checkbox, item.isChecked && styles.checkboxChecked]}>
                {item.isChecked && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, item.isChecked && styles.itemNameChecked]}>{item.name}</Text>
                {(item.quantity || item.unit) && (
                  <Text style={styles.itemQuantity}>
                    {item.quantity || ''} {item.unit || ''}
                  </Text>
                )}
              </View>
              {item.expectedPrice && (
                <Text style={styles.itemPrice}>{formatCurrency(item.expectedPrice, currency.code)}</Text>
              )}
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Add Item Inline */}
        <View style={styles.addInlineContainer}>
          <View style={styles.inlineInputs}>
            <TextInput
              style={[styles.input, { flex: 2 }]}
              placeholder="Item name"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Qty"
              keyboardType="decimal-pad"
              value={newItemQuantity}
              onChangeText={setNewItemQuantity}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Unit (kg)"
              value={newItemUnit}
              onChangeText={setNewItemUnit}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Price"
              keyboardType="decimal-pad"
              value={newItemPrice}
              onChangeText={setNewItemPrice}
            />
          </View>
          <TouchableOpacity style={styles.addInlineBtn} onPress={handleAddItem}>
            <Ionicons name="send" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  
  budgetCard: { marginHorizontal: 20, backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  progressTrack: { height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  overBudgetText: { fontSize: 12, color: '#EF5350', fontWeight: '600', marginTop: 8, textAlign: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  categorySection: { marginBottom: 20 },
  categoryHeader: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 12 },
  categoryTitle: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase' },
  
  itemRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', marginRight: 12, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  itemName: { fontSize: 16, fontWeight: '500', color: Colors.light.text },
  itemNameChecked: { textDecorationLine: 'line-through', color: '#94A3B8' },
  itemQuantity: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '600', color: Colors.light.text },

  addInlineContainer: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 10 : 16, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', gap: 10 },
  inlineInputs: { flex: 1, flexDirection: 'row', gap: 8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 8, paddingHorizontal: 10, height: 44, fontSize: 14 },
  addInlineBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
});
