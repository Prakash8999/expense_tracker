import { Colors } from "@/constants/theme";
import { db } from "@/db";
import { addTransaction as addTxn } from "@/db/queries";
import { accounts, groupMembers, groups, groupSettlements } from "@/db/schema";
import { Ionicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import { useRouter } from "expo-router";
import { useStore } from "@/store/useStore";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [friends, setFriends] = useState<{ id: string; name: string }[]>([]);
  const [friendName, setFriendName] = useState("");
  const [enableFund, setEnableFund] = useState(false);

  const [contributions, setContributions] = useState<Record<string, string>>(
    {},
  );
  const [fundManagerId, setFundManagerId] = useState<string | null>(null);
  const [userAccounts, setUserAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  React.useEffect(() => {
    const fetchAccounts = async () => {
      const aData = await db.select().from(accounts);
      setUserAccounts(aData);
      if (aData.length > 0) setSelectedAccountId(aData[0].id);
    };
    fetchAccounts();
  }, []);

  const handleAddFriend = () => {
    const trimmed = friendName.trim();
    if (!trimmed) return;
    if (friends.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Duplicate Name", "This person is already in the list.");
      return;
    }
    setFriends([...friends, { id: Crypto.randomUUID(), name: trimmed }]);
    setFriendName("");
  };

  const handleRemoveFriend = (id: string) => {
    setFriends(friends.filter((f) => f.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a name for the group.");
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
        currency: "USD",
        createdAt: now,
      });

      // 2. Add the current user
      const meId = Crypto.randomUUID();
      const membersToInsert = [
        {
          id: meId,
          groupId,
          name: "Me",
          isUser: true,
          isFund: false,
        },
        ...friends.map((f) => ({
          id: f.id,
          groupId,
          name: f.name,
          isUser: false,
          isFund: false,
        })),
      ];

      let fundMemberId: string | null = null;
      if (enableFund) {
        fundMemberId = Crypto.randomUUID();
        const managerName =
          fundManagerId === "me"
            ? "Me"
            : friends.find((f) => f.id === fundManagerId)?.name || "Unknown";

        membersToInsert.push({
          id: fundMemberId,
          groupId,
          name: fundManagerId
            ? `Group Fund (held by ${managerName})`
            : "Group Fund",
          isUser: false,
          isFund: true,
        });
      }

      await db.insert(groupMembers).values(membersToInsert);

      // 3. Process Initial Contributions
      if (enableFund && fundMemberId) {
        const settlementsToInsert = [];
        let meContrib = 0;

        for (const m of membersToInsert) {
          if (m.isFund) continue;
          const key = m.isUser ? "me" : m.id;
          const amt = parseFloat(contributions[key] || "0");
          if (amt > 0) {
            settlementsToInsert.push({
              id: Crypto.randomUUID(),
              groupId,
              fromMemberId: m.id,
              toMemberId: fundMemberId,
              amount: amt,
              date: now,
            });
            if (m.isUser) meContrib = amt;
          }
        }

        if (settlementsToInsert.length > 0) {
          await db.insert(groupSettlements).values(settlementsToInsert);
        }

        if (meContrib > 0 && selectedAccountId) {
          const tripCat = useStore.getState().expenseCategories.find(c => c.name === 'Group Contribution') || 
                          useStore.getState().expenseCategories.find(c => c.name === 'Entertainment');
          
          await addTxn({
            amount: meContrib,
            type: "expense",
            categoryId: tripCat?.id || "system",
            accountId: selectedAccountId,
            date: now,
            note: `Initial contribution to Group Fund (${name})`,
            groupId,
          });
        }
      }

      await useStore.getState().loadData();
      router.replace(`/groups/${groupId}` as any);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save the group.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
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

          <View style={styles.inputGroup}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text style={styles.label}>Enable Group Fund</Text>
                <Text style={styles.subLabel}>
                  Collect money upfront in a collective bank.
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, enableFund && styles.toggleBtnActive]}
                onPress={() => setEnableFund(!enableFund)}
              >
                <View
                  style={[
                    styles.toggleKnob,
                    enableFund && styles.toggleKnobActive,
                  ]}
                />
              </TouchableOpacity>
            </View>
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
            <TouchableOpacity
              style={styles.addFriendBtn}
              onPress={handleAddFriend}
            >
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

            {friends.map((f) => (
              <View key={f.id} style={styles.memberTag}>
                <Ionicons
                  name="person-outline"
                  size={16}
                  color={Colors.light.textSecondary}
                />
                <Text style={styles.memberTagName}>{f.name}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveFriend(f.id)}
                  style={styles.removeTagBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {enableFund && (
            <View
              style={{
                marginTop: 24,
                marginBottom: 20,
                padding: 16,
                backgroundColor: "#F8FAFC",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              <Text
                style={[styles.label, { marginBottom: 16, color: "#10B981" }]}
              >
                Initial Contributions
              </Text>

              {/* Me Contribution */}
              <View style={styles.contributionRow}>
                <Text style={styles.contributionName}>Me</Text>
                <TextInput
                  style={styles.contributionInput}
                  placeholder="$0.00"
                  keyboardType="numeric"
                  value={contributions["me"] || ""}
                  onChangeText={(val) =>
                    setContributions((prev) => ({ ...prev, me: val }))
                  }
                />
              </View>

              {/* Me Personal Account Selector (Only if contributing > 0) */}
              {parseFloat(contributions["me"] || "0") > 0 &&
                userAccounts.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.subLabel, { marginBottom: 8 }]}>
                      Deduct from account:
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {userAccounts.map((acc) => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.accountChip,
                            selectedAccountId === acc.id &&
                              styles.accountChipActive,
                          ]}
                          onPress={() => setSelectedAccountId(acc.id)}
                        >
                          <Ionicons
                            name={acc.icon as any}
                            size={14}
                            color={
                              selectedAccountId === acc.id ? "#FFF" : acc.color
                            }
                          />
                          <Text
                            style={[
                              styles.accountChipText,
                              selectedAccountId === acc.id && { color: "#FFF" },
                            ]}
                          >
                            {acc.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

              {/* Friends Contributions */}
              {friends.map((f) => (
                <View key={f.id} style={styles.contributionRow}>
                  <Text style={styles.contributionName}>{f.name}</Text>
                  <TextInput
                    style={styles.contributionInput}
                    placeholder="$0.00"
                    keyboardType="numeric"
                    value={contributions[f.id] || ""}
                    onChangeText={(val) =>
                      setContributions((prev) => ({ ...prev, [f.id]: val }))
                    }
                  />
                </View>
              ))}

              {/* Fund Manager Selector */}
              <Text style={[styles.label, { marginTop: 16, marginBottom: 12 }]}>
                Who holds the fund?
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.managerChip,
                    fundManagerId === "me" && styles.managerChipActive,
                  ]}
                  onPress={() => setFundManagerId("me")}
                >
                  <Text
                    style={[
                      styles.managerChipText,
                      fundManagerId === "me" && { color: "#FFF" },
                    ]}
                  >
                    Me
                  </Text>
                </TouchableOpacity>
                {friends.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[
                      styles.managerChip,
                      fundManagerId === f.id && styles.managerChipActive,
                    ]}
                    onPress={() => setFundManagerId(f.id)}
                  >
                    <Text
                      style={[
                        styles.managerChipText,
                        fundManagerId === f.id && { color: "#FFF" },
                      ]}
                    >
                      {f.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  saveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: "#6366F1" },

  content: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  toggleBtn: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#E2E8F0",
    padding: 2,
    justifyContent: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#10B981",
  },
  toggleKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleKnobActive: {
    transform: [{ translateX: 20 }],
  },

  sectionHeader: { marginBottom: 12 },

  addFriendRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  addFriendInput: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.light.text,
  },
  addFriendBtn: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addFriendBtnText: { color: "#FFF", fontWeight: "600", fontSize: 15 },

  membersList: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  memberTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  memberTagName: { fontSize: 15, fontWeight: "500", color: Colors.light.text },
  removeTagBtn: { marginLeft: 4 },

  contributionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  contributionName: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.text,
  },
  contributionInput: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 100,
    textAlign: "right",
  },
  accountChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    gap: 4,
  },
  accountChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  accountChipText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  managerChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginRight: 8,
    backgroundColor: "#FFF",
  },
  managerChipActive: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  managerChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
});
