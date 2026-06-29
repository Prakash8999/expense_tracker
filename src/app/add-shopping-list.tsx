import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addShoppingList, addShoppingItem } from '@/db/queries';

export default function AddShoppingListScreen() {
  const { loadShoppingLists } = useStore();
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [items, setItems] = useState<{ name: string; price: string; quantity: string; unit: string; category: string }[]>([{ name: '', price: '', quantity: '', unit: '', category: '' }]);

  const addRow = () => setItems([...items, { name: '', price: '', quantity: '', unit: '', category: '' }]);
  const updateItem = (i: number, field: 'name' | 'price' | 'category' | 'quantity' | 'unit', value: string) => {
    const copy = [...items]; copy[i][field] = value; setItems(copy);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a list name.'); return; }
    const listId = await addShoppingList(name.trim(), parseFloat(budget) || undefined);
    for (const item of items) {
      if (item.name.trim()) {
        await addShoppingItem(
          listId, 
          item.name.trim(), 
          parseFloat(item.price) || undefined, 
          item.category.trim() || undefined,
          parseFloat(item.quantity) || undefined,
          item.unit.trim() || undefined
        );
      }
    }
    await loadShoppingLists();
    router.back();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
        <Text style={s.title}>Shopping List</Text>
        <TouchableOpacity onPress={handleSave}><Text style={s.save}>Save</Text></TouchableOpacity>
      </View>
      <ScrollView style={s.content}>
        <TextInput style={s.input} placeholder="List Name (e.g. Weekly Groceries)" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
        <TextInput style={s.input} placeholder="Max Budget (Optional)" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={budget} onChangeText={setBudget} />
        <Text style={s.label}>Items</Text>
        {items.map((item, i) => (
          <View key={i} style={s.itemContainer}>
            <TextInput style={[s.input, { marginBottom: 10 }]} placeholder="Item name" placeholderTextColor="#94A3B8" value={item.name} onChangeText={v => updateItem(i, 'name', v)} />
            <View style={s.itemRow}>
              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Qty" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={item.quantity} onChangeText={v => updateItem(i, 'quantity', v)} />
              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Unit (e.g. kg, L)" placeholderTextColor="#94A3B8" value={item.unit} onChangeText={v => updateItem(i, 'unit', v)} />
              <TextInput style={[s.input, { flex: 1, marginBottom: 0 }]} placeholder="Price" placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={item.price} onChangeText={v => updateItem(i, 'price', v)} />
            </View>
          </View>
        ))}
        <TouchableOpacity style={s.addRow} onPress={addRow}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.light.tint} />
          <Text style={s.addRowText}>Add Item</Text>
        </TouchableOpacity>
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
  label: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 10 },
  itemContainer: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 16, marginBottom: 10 },
  itemRow: { flexDirection: 'row', gap: 8 },
  addRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.light.tint, borderStyle: 'dashed', marginTop: 4 },
  addRowText: { fontSize: 15, fontWeight: '600', color: Colors.light.tint },
});
