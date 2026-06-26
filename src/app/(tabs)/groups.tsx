import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function GroupsScreen() {
  const colors = Colors.light;
  
  // Dummy data for MVP UI demo
  const [groups, setGroups] = useState([
    { id: '1', name: 'Miami Trip', balance: 150 }, // Positive means you are owed
    { id: '2', name: 'Apartment', balance: -45 }, // Negative means you owe
  ]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Groups</Text>
        <TouchableOpacity>
          <Ionicons name="person-add" size={24} color={colors.tint} />
        </TouchableOpacity>
      </View>

      <View style={styles.list}>
        {groups.map(group => (
          <TouchableOpacity key={group.id} style={[styles.groupCard, { backgroundColor: colors.card }]}>
            <View style={styles.groupLeft}>
              <View style={[styles.groupIcon, { backgroundColor: colors.background }]}>
                <Ionicons name="people" size={24} color={colors.text} />
              </View>
              <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
            </View>
            <View style={styles.groupRight}>
              <Text style={{ color: colors.text, fontSize: 12, marginBottom: 4 }}>
                {group.balance > 0 ? 'You are owed' : 'You owe'}
              </Text>
              <Text style={[
                styles.groupBalance, 
                { color: group.balance > 0 ? '#4ECDC4' : '#FF6B6B' }
              ]}>
                ${Math.abs(group.balance).toFixed(2)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.emptyState}>
        <Text style={{ color: colors.tabIconDefault, textAlign: 'center', marginBottom: 16 }}>
          Split bills seamlessly with friends. 
          Your portion hits your personal budget, the rest goes here.
        </Text>
        <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.tint }]}>
          <Text style={styles.createBtnText}>Create New Group</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold' },
  list: { paddingHorizontal: 16 },
  groupCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  groupLeft: { flexDirection: 'row', alignItems: 'center' },
  groupIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  groupName: { fontSize: 18, fontWeight: 'bold' },
  groupRight: { alignItems: 'flex-end' },
  groupBalance: { fontSize: 18, fontWeight: 'bold' },
  emptyState: { padding: 24, marginTop: 32 },
  createBtn: { padding: 16, borderRadius: 8, alignItems: 'center' },
  createBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
