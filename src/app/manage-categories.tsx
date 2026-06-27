import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addCategory } from '@/db/queries';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/constants/categories';

const { width } = Dimensions.get('window');
const ITEM_W = (width - 40 - 32 - 16) / 4; // screen width - content padding - parentGroup padding - gap margin

export default function ManageCategoriesScreen() {
  const params = useLocalSearchParams<{ type?: 'expense' | 'income' }>();
  const { expenseCategories, incomeCategories, loadData } = useStore();
  const scrollRef = useRef<ScrollView>(null);
  
  const [tab, setTab] = useState<'expense' | 'income'>(params.type || 'expense');
  const [showForm, setShowForm] = useState(false);
  const [parentName, setParentName] = useState('');
  const [subName, setSubName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const cats = tab === 'expense' ? expenseCategories : incomeCategories;
  const parentCategories = cats.filter((c: any) => !c.parentId);
  
  // Auto-suggestions logic for Parent Category
  const suggestions = parentName.trim().length > 1 
    ? parentCategories.filter((c: any) => c.name.toLowerCase().includes(parentName.trim().toLowerCase()))
    : [];
  const exactParentMatch = parentCategories.find((c: any) => c.name.toLowerCase() === parentName.trim().toLowerCase());

  // Check if subcategory already exists under the selected/matched parent
  const existingChildren = exactParentMatch 
    ? cats.filter((c: any) => c.parentId === exactParentMatch.id) 
    : [];
  const exactSubMatch = existingChildren.find((c: any) => c.name.toLowerCase() === subName.trim().toLowerCase());

  const handleAdd = async () => {
    if (!parentName.trim()) { Alert.alert('Error', 'Enter a Category name.'); return; }
    if (!subName.trim()) { Alert.alert('Error', 'Enter a Subcategory name.'); return; }
    if (exactSubMatch) { Alert.alert('Error', 'This subcategory already exists under this category.'); return; }
    
    let pId = exactParentMatch?.id;

    // Create parent if it doesn't exist
    if (!pId) {
      pId = await addCategory({
        name: parentName.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: tab,
        parentId: undefined
      });
    }

    // Create subcategory
    await addCategory({ 
      name: subName.trim(), 
      icon: selectedIcon, 
      color: exactParentMatch ? exactParentMatch.color : selectedColor, 
      type: tab,
      parentId: pId
    });
    
    await loadData();
    setParentName(''); 
    setSubName('');
    setShowForm(false);
  };

  const handleSuggestionSelect = (p: any) => {
    setParentName(p.name);
  };
  
  const handleInlineAdd = (p: any) => {
    setParentName(p.name);
    setShowForm(true);
    // Auto-scroll to top so the user sees the form
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
        <Text style={s.title}>Categories</Text>
        <TouchableOpacity onPress={() => {
          setShowForm(!showForm);
          if (!showForm) scrollRef.current?.scrollTo({ y: 0, animated: true });
        }}>
          <Ionicons name={showForm ? 'close-circle' : 'add-circle'} size={28} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'expense' && s.tabActive]} onPress={() => setTab('expense')}>
          <Text style={[s.tabText, tab === 'expense' && s.tabTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'income' && s.tabActive]} onPress={() => setTab('income')}>
          <Text style={[s.tabText, tab === 'income' && s.tabTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} style={s.content}>
        {showForm && (
          <View style={s.formCard}>
            
            <Text style={s.label}>Main Category</Text>
            <TextInput 
              style={s.input} 
              placeholder="e.g. Food & Dining" 
              placeholderTextColor="#94A3B8" 
              value={parentName} 
              onChangeText={setParentName} 
            />
            {suggestions.length > 0 && !exactParentMatch && (
              <View style={s.suggestionsContainer}>
                <Text style={s.suggestionsTitle}>Did you mean?</Text>
                <View style={s.suggestionsList}>
                  {suggestions.slice(0, 5).map((c: any) => (
                    <TouchableOpacity key={c.id} style={s.suggestionChip} onPress={() => handleSuggestionSelect(c)}>
                      <Ionicons name={c.icon as any} size={16} color={c.color} />
                      <Text style={s.suggestionText}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={[s.label, { marginTop: 8 }]}>Subcategory</Text>
            <TextInput 
              style={[s.input, exactSubMatch && s.inputError]} 
              placeholder="e.g. Groceries" 
              placeholderTextColor="#94A3B8" 
              value={subName} 
              onChangeText={setSubName} 
            />
            {exactSubMatch && (
              <Text style={s.errorText}>This subcategory already exists!</Text>
            )}

            <Text style={s.label}>Icon for Subcategory</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {AVAILABLE_ICONS.slice(0, 30).map(icon => (
                <TouchableOpacity key={icon} style={[s.iconItem, selectedIcon === icon && { backgroundColor: selectedColor + '20', borderColor: selectedColor }]} onPress={() => setSelectedIcon(icon)}>
                  <Ionicons name={icon as any} size={20} color={selectedIcon === icon ? selectedColor : '#94A3B8'} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            {!exactParentMatch && (
              <>
                <Text style={s.label}>Color for New Category</Text>
                <View style={s.colorRow}>
                  {AVAILABLE_COLORS.slice(0, 12).map(c => (
                    <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, selectedColor === c && s.colorSelected]} onPress={() => setSelectedColor(c)} />
                  ))}
                </View>
              </>
            )}
            
            <TouchableOpacity style={[s.addBtn, exactSubMatch && { opacity: 0.5 }]} onPress={handleAdd} disabled={!!exactSubMatch}>
              <Text style={s.addBtnText}>Add Subcategory</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Existing Categories Tree */}
        {parentCategories.map((parent: any) => {
          const children = cats.filter((c: any) => c.parentId === parent.id);
          return (
            <View key={parent.id} style={s.parentGroup}>
              <View style={s.parentHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name={parent.icon as any} size={20} color={parent.color} />
                  <Text style={s.parentGroupName}>{parent.name}</Text>
                </View>
                <TouchableOpacity onPress={() => handleInlineAdd(parent)}>
                  <Ionicons name="add-circle" size={24} color={Colors.light.tint} />
                </TouchableOpacity>
              </View>
              <View style={s.grid}>
                {children.map((cat: any) => (
                  <View key={cat.id} style={s.catItem}>
                    <View style={[s.catIcon, { backgroundColor: cat.color + '20' }]}>
                      <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                    </View>
                    <Text style={s.catName} numberOfLines={2}>{cat.name}</Text>
                  </View>
                ))}
                {children.length === 0 && (
                  <Text style={s.emptySub}>No sub-categories.</Text>
                )}
              </View>
            </View>
          );
        })}
        
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: Colors.light.text },
  content: { flex: 1, paddingHorizontal: 20 },
  
  formCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 20 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, fontSize: 16, color: Colors.light.text, marginBottom: 14 },
  inputError: { borderWidth: 1, borderColor: '#EF5350' },
  errorText: { color: '#EF5350', fontSize: 12, marginTop: -10, marginBottom: 14, marginLeft: 4 },
  
  suggestionsContainer: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 12, marginBottom: 14, marginTop: -6 },
  suggestionsTitle: { fontSize: 13, color: '#64748B', marginBottom: 8, fontWeight: '600' },
  suggestionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  suggestionText: { fontSize: 14, color: Colors.light.text, fontWeight: '500' },
  
  label: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },

  iconItem: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 2, borderColor: '#F1F5F9' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: '#0F172A' },
  addBtn: { backgroundColor: Colors.light.tint, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  
  parentGroup: { marginBottom: 20, backgroundColor: '#FFF', borderRadius: 16, padding: 16 },
  parentHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  parentGroupName: { fontSize: 16, fontWeight: '700', color: Colors.light.text },
  emptySub: { fontSize: 12, color: '#94A3B8', fontStyle: 'italic' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  catItem: { width: ITEM_W, alignItems: 'center', marginBottom: 16 },
  catIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 11, color: Colors.light.textSecondary, textAlign: 'center', fontWeight: '500' },
});
