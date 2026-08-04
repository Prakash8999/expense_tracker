import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/db';
import { groupMembers, groupSettlements, accounts, groups, groupExpenseParticipants } from '@/db/schema';
import { addTransaction as addTxn } from '@/db/queries';
import { eq } from 'drizzle-orm';
import * as Crypto from 'expo-crypto';
import { useStore } from '@/store/useStore';
import { simplifyDebts } from '@/utils/debtSimplification';

export default function SettleUpScreen() {
  const router = useRouter();
  const { id: groupId, defaultPayer, defaultPayee } = useLocalSearchParams<{ id: string, defaultPayer?: string, defaultPayee?: string }>();

  const [amountStr, setAmountStr] = useState('');
  const [payerId, setPayerId] = useState<string | null>(defaultPayer || null); // fromMemberId
  const [payeeId, setPayeeId] = useState<string | null>(defaultPayee || null); // toMemberId
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const { incomeCategories, expenseCategories } = useStore();

  const [members, setMembers] = React.useState<any[]>([]);
  const [userAccounts, setUserAccounts] = React.useState<any[]>([]);
  const [groupName, setGroupName] = React.useState<string>('Group');
  const [suggestedRepayments, setSuggestedRepayments] = React.useState<any[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchInitialData = async () => {
        const gData = await db.select().from(groups).where(eq(groups.id, groupId));
        if (gData.length > 0) setGroupName(gData[0].name);

        const mData = await db.select().from(groupMembers).where(eq(groupMembers.groupId, groupId));
        setMembers(mData);

        const aData = await db.select().from(accounts);
        setUserAccounts(aData);
        
        // Calculate suggested repayments for autofill
        const pData = await db.select().from(groupExpenseParticipants);
        const sData = await db.select().from(groupSettlements).where(eq(groupSettlements.groupId, groupId));
        
        const bals: Record<string, number> = {};
        mData.forEach(m => bals[m.id] = 0);
        
        pData.forEach(p => {
          if (bals[p.memberId] !== undefined) {
            bals[p.memberId] += (p.paidShare - p.owedShare);
          }
        });

        sData.forEach(s => {
          if (bals[s.fromMemberId] !== undefined) bals[s.fromMemberId] += s.amount;
          if (bals[s.toMemberId] !== undefined) bals[s.toMemberId] -= s.amount;
        });
        
        setSuggestedRepayments(simplifyDebts(bals));
      };
      fetchInitialData();
    }, [groupId])
  );

  React.useEffect(() => {
    if (payerId && payeeId) {
      const suggestion = suggestedRepayments.find(r => r.from === payerId && r.to === payeeId);
      if (suggestion && suggestion.amount > 0) {
        setAmountStr(suggestion.amount.toFixed(2));
      }
    }
  }, [payerId, payeeId, suggestedRepayments]);

  React.useEffect(() => {
    if (userAccounts && userAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(userAccounts[0].id);
    }
  }, [userAccounts, selectedAccountId]);

  const totalAmount = parseFloat(amountStr) || 0;

  const payerIsUser = useMemo(() => {
    if (!members || !payerId) return false;
    return members.find(m => m.id === payerId)?.isUser ?? false;
  }, [members, payerId]);

  const payeeIsUser = useMemo(() => {
    if (!members || !payeeId) return false;
    return members.find(m => m.id === payeeId)?.isUser ?? false;
  }, [members, payeeId]);

  const userIsInvolved = payerIsUser || payeeIsUser;

  const handleSave = async () => {
    if (totalAmount <= 0) return Alert.alert('Error', 'Please enter a valid amount.');
    if (!payerId) return Alert.alert('Error', 'Please select who is paying.');
    if (!payeeId) return Alert.alert('Error', 'Please select who is receiving.');
    if (payerId === payeeId) return Alert.alert('Error', 'Payer and payee cannot be the same person.');
    
    if (userIsInvolved && !selectedAccountId) {
      return Alert.alert('Error', 'Please select a personal account to log this transaction.');
    }

    try {
      const settlementId = Crypto.randomUUID();
      const now = Date.now();

      // 1. Create Group Settlement
      await db.insert(groupSettlements).values({
        id: settlementId,
        groupId,
        fromMemberId: payerId,
        toMemberId: payeeId,
        amount: totalAmount,
        date: now,
      });

      // 2. Personal Tracker Sync
      if (userIsInvolved && selectedAccountId) {
        const payerName = members.find(m => m.id === payerId)?.name || 'Someone';
        const payeeName = members.find(m => m.id === payeeId)?.name || 'Someone';

        if (payeeIsUser) {
          // If you are receiving money -> Income (Reimbursement)
          // Default to 'Refunds / Returns' category if it exists
          const refundCat = incomeCategories.find(c => c.name === 'Refunds / Returns');
          
          await addTxn({
            accountId: selectedAccountId,
            categoryId: refundCat?.id || undefined,
            amount: totalAmount,
            type: 'income',
            date: now,
            note: `Reimbursement from ${payerName} (${groupName})`,
            groupId
          });
        } else if (payerIsUser) {
          // If you are paying someone back -> Expense (Previous bill)
          const tripCat = expenseCategories.find(c => c.name === 'Group Contribution') ||
                          expenseCategories.find(c => c.name === 'Entertainment');
          await addTxn({
            accountId: selectedAccountId,
            categoryId: tripCat?.id || undefined,
            amount: totalAmount,
            type: 'expense',
            date: now,
            note: `Paid back ${payeeName} (${groupName})`,
            groupId
          });
        }
      }

      // Refresh global store so dashboard updates instantly
      await useStore.getState().loadData();

      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to save settlement.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settle Up</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              keyboardType="decimal-pad"
              value={amountStr}
              onChangeText={setAmountStr}
              autoFocus
            />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Who is paying?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {members?.filter(m => !m.isFund).map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberChip, payerId === m.id && styles.memberChipActive]}
                onPress={() => setPayerId(m.id)}
              >
                <Ionicons name="arrow-up-circle-outline" size={16} color={payerId === m.id ? '#FFF' : Colors.light.textSecondary} />
                <Text style={[styles.memberChipText, payerId === m.id && styles.memberChipTextActive]}>
                  {m.isUser ? 'Me' : m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Who is receiving?</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {members?.filter(m => !m.isFund).map(m => (
              <TouchableOpacity
                key={m.id}
                style={[styles.memberChip, payeeId === m.id && styles.memberChipActive]}
                onPress={() => setPayeeId(m.id)}
              >
                <Ionicons name="arrow-down-circle-outline" size={16} color={payeeId === m.id ? '#FFF' : Colors.light.textSecondary} />
                <Text style={[styles.memberChipText, payeeId === m.id && styles.memberChipTextActive]}>
                  {m.isUser ? 'Me' : m.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {userIsInvolved && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Personal Account</Text>
              <Text style={styles.subLabel}>
                {payerIsUser 
                  ? 'Money will be deducted from this account.' 
                  : 'Money will be added to this account.'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                {userAccounts?.map(acc => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[styles.memberChip, selectedAccountId === acc.id && styles.memberChipActive]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Ionicons name={acc.icon as any} size={16} color={selectedAccountId === acc.id ? '#FFF' : acc.color} />
                    <Text style={[styles.memberChipText, selectedAccountId === acc.id && styles.memberChipTextActive]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <View style={{ height: 100 }} />
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
  saveBtn: { paddingVertical: 6, paddingHorizontal: 16, backgroundColor: '#6366F1', borderRadius: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },

  content: { flex: 1, padding: 20 },
  
  amountContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  currencySymbol: { fontSize: 40, fontWeight: '600', color: Colors.light.textSecondary, marginRight: 8 },
  amountInput: { fontSize: 48, fontWeight: '700', color: Colors.light.text, minWidth: 100 },

  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 8 },
  subLabel: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 8 },

  sectionHeader: { marginBottom: 12 },

  memberChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0',
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20,
    marginRight: 10,
  },
  memberChipActive: {
    backgroundColor: '#10B981', // Distinct green color for settling up
    borderColor: '#10B981',
  },
  memberChipText: { fontSize: 15, fontWeight: '500', color: Colors.light.text },
  memberChipTextActive: { color: '#FFF' },
});
