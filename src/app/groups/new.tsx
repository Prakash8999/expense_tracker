import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { db } from '@/db';
import { groups, groupMembers } from '@/db/schema';
import * as Crypto from 'expo-crypto';

export default function NewGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<{ id: string, name: string }[]>([]);
  const [friendName, setFriendName] = useState('');

  const handleAddFriend = () => {
    const trimmed = friendName.trim();
    if (!trimmed) return;
    if (friends.some(f => f.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate Name', 'This person is already in the list.');
      return;
    }
    setFriends([...friends, { id: Crypto.randomUUID(), name: trimmed }]);
    setFriendName('');
  };

  const handleRemoveFriend = (id: string) => {
    setFriends(friends.filter(f => f.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a name for the group.');
      return;
    }

    try {
      const groupId = Crypto.randomUUID();
      const now = Date.now();

      // 1. Create the Group
      await db.insert(groups).values({
        id: groupId,
        name: name.trim(),
        description: description.trim() || null,
        currency: 'USD',
        createdAt: now,
      });

      // 2. Add the current user
      const membersToInsert = [
        {
          id: Crypto.randomUUID(),
          groupId,
          name: 'Me',
          isUser: true,
        },
        ...friends.map(f => ({
          id: f.id,
          groupId,
          name: f.name,
          isUser: false,
        }))
      ];

      await db.insert(groupMembers).values(membersToInsert);

      router.replace(`/groups/${groupId}` as any);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Could not save the group.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Group</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Group Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Summer Trip 2026"
              value={name}
              onChangeText={setName}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="What is this group for?"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Group Members</Text>
            <Text style={styles.subLabel}>You are automatically included.</Text>
          </View>

          {/* Add Friend Input */}
          <View style={styles.addFriendRow}>
            <TextInput
              style={styles.addFriendInput}
              placeholder="Friend's Name"
              value={friendName}
              onChangeText={setFriendName}
              onSubmitEditing={handleAddFriend}
              returnKeyType="done"
            />
            <TouchableOpacity style={styles.addFriendBtn} onPress={handleAddFriend}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addFriendBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Members List */}
          <View style={styles.membersList}>
            <View style={styles.memberTag}>
              <Ionicons name="person" size={16} color="#6366F1" />
              <Text style={styles.memberTagName}>Me</Text>
            </View>
            
            {friends.map(f => (
              <View key={f.id} style={styles.memberTag}>
                <Ionicons name="person-outline" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.memberTagName}>{f.name}</Text>
                <TouchableOpacity onPress={() => handleRemoveFriend(f.id)} style={styles.removeTagBtn}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  saveBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#EEF2FF', borderRadius: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#6366F1' },

  content: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 },
  subLabel: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 12 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  
  sectionHeader: { marginBottom: 12 },
  
  addFriendRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  addFriendInput: {
    flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, paddingHorizontal: 14, fontSize: 16, color: Colors.light.text,
  },
  addFriendBtn: {
    backgroundColor: '#10B981', borderRadius: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  addFriendBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },

  membersList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  memberTag: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2,
  },
  memberTagName: { fontSize: 15, fontWeight: '500', color: Colors.light.text },
  removeTagBtn: { marginLeft: 4 },
});
