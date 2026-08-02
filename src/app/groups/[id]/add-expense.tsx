import { Colors } from "@/constants/theme";
import { db } from "@/db";
import { addTransaction as addTxn } from "@/db/queries";
import {
  accounts,
  groupExpenseParticipants,
  groupExpenses,
  groupMembers,
  groups,
  groupSettlements,
} from "@/db/schema";
import { useStore } from "@/store/useStore";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import * as Crypto from "expo-crypto";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SplitType = "equal" | "exact" | "percentage";

export default function AddGroupExpenseScreen() {
  const router = useRouter();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [payerId, setPayerId] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const { expenseCategories } = useStore();
  const selectedCategory = expenseCategories.find(
    (c) => c.id === selectedCategoryId,
  );

  // Exact/Percent states
  const [customShares, setCustomShares] = useState<Record<string, string>>({});

  const [members, setMembers] = React.useState<any[]>([]);
  const [userAccounts, setUserAccounts] = React.useState<any[]>([]);
  const [groupName, setGroupName] = React.useState<string>("Group");
  const [fundBalance, setFundBalance] = React.useState<number>(0);

  useFocusEffect(
    React.useCallback(() => {
      const fetchInitialData = async () => {
        const gData = await db
          .select()
          .from(groups)
          .where(eq(groups.id, groupId));
        if (gData.length > 0) setGroupName(gData[0].name);

        const mData = await db
          .select()
          .from(groupMembers)
          .where(eq(groupMembers.groupId, groupId));
        setMembers(mData);

        const fundMember = mData.find((m) => m.isFund);
        if (fundMember) {
          const pData = await db.select().from(groupExpenseParticipants);
          const sData = await db
            .select()
            .from(groupSettlements)
            .where(eq(groupSettlements.groupId, groupId));

          let bal = 0;
          pData.forEach((p) => {
            if (p.memberId === fundMember.id) {
              bal += p.paidShare - p.owedShare;
            }
          });
          sData.forEach((s) => {
            if (s.fromMemberId === fundMember.id) bal += s.amount;
            if (s.toMemberId === fundMember.id) bal -= s.amount;
          });
          setFundBalance(bal);
        }

        const aData = await db.select().from(accounts);
        setUserAccounts(aData);
      };
      fetchInitialData();
    }, [groupId]),
  );

  const totalAmount = parseFloat(amountStr) || 0;

  // Auto-select payer based on amount and fund balance
  React.useEffect(() => {
    if (members && members.length > 0) {
      const fund = members.find((m) => m.isFund);
      const user = members.find((m) => m.isUser);

      const availableFund = fundBalance < 0 ? Math.abs(fundBalance) : 0;

      setPayerId((current) => {
        if (fund && availableFund > 0 && totalAmount <= availableFund) {
          if (!current || current === user?.id) return fund.id;
        } else if (!current || current === fund?.id) {
          if (user) return user.id;
        }
        return current;
      });
    }
  }, [members, totalAmount, fundBalance]);

  React.useEffect(() => {
    if (userAccounts && userAccounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(userAccounts[0].id);
    }
  }, [userAccounts, selectedAccountId]);

  const payerIsUser = useMemo(() => {
    if (!members || !payerId) return false;
    return members.find((m) => m.id === payerId)?.isUser ?? false;
  }, [members, payerId]);

  const calculatedShares = useMemo(() => {
    if (!members) return {};
    const shares: Record<string, number> = {};

    if (splitType === "equal") {
      const splitMembers = members.filter((m) => !m.isFund); // Don't split owed shares to the fund itself
      const splitAmount = totalAmount / (splitMembers.length || 1);
      splitMembers.forEach((m) => (shares[m.id] = splitAmount));
    } else if (splitType === "exact") {
      members.forEach(
        (m) => (shares[m.id] = parseFloat(customShares[m.id]) || 0),
      );
    } else if (splitType === "percentage") {
      members.forEach((m) => {
        const pct = parseFloat(customShares[m.id]) || 0;
        shares[m.id] = totalAmount * (pct / 100);
      });
    }
    return shares;
  }, [members, totalAmount, splitType, customShares]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (totalAmount <= 0)
      return Alert.alert("Error", "Please enter a valid amount.");
    if (!payerId) return Alert.alert("Error", "Please select who paid.");
    if (!selectedCategoryId)
      return Alert.alert("Error", "Please select a category.");

    // Validate sums
    const sumShares = Object.values(calculatedShares).reduce(
      (a, b) => a + b,
      0,
    );
    if (Math.abs(sumShares - totalAmount) > 0.05) {
      return Alert.alert(
        "Error",
        `The split amounts do not add up to the total. (Off by ${Math.abs(sumShares - totalAmount).toFixed(2)})`,
      );
    }

    if (payerIsUser && !selectedAccountId) {
      return Alert.alert(
        "Error",
        "Please select a personal account to log this expense.",
      );
    }

    const finalDescription = description.trim() || "Group Expense";

    try {
      const expenseId = Crypto.randomUUID();
      const now = Date.now();

      const userMember = members?.find((m) => m.isUser);
      const userOwedShare = userMember
        ? calculatedShares[userMember.id] || 0
        : 0;
      const userPaidShare = payerIsUser ? totalAmount : 0;
      const lentAmount = userPaidShare - userOwedShare;

      // 1. Create Group Expense
      await db.insert(groupExpenses).values({
        id: expenseId,
        groupId,
        description: finalDescription,
        categoryId: selectedCategoryId,
        totalAmount,
        receiptImage: receiptImage,
        date: now,
        createdAt: now,
      });

      // 2. Create Participants
      const participants = members!.map((m) => ({
        id: Crypto.randomUUID(),
        expenseId,
        memberId: m.id,
        paidShare: m.id === payerId ? totalAmount : 0,
        owedShare: calculatedShares[m.id] || 0,
      }));
      await db.insert(groupExpenseParticipants).values(participants);

      // 3. Personal Tracker Sync
      if (payerIsUser && selectedAccountId) {
        // Find category name for the note
        const categoryName =
          useStore
            .getState()
            .expenseCategories.find((c) => c.id === selectedCategoryId)?.name ||
          "Expense";

        // Log the ENTIRE AMOUNT PAID as a single expense
        if (totalAmount > 0) {
          await addTxn({
            accountId: selectedAccountId,
            categoryId: selectedCategoryId,
            amount: totalAmount,
            type: "expense",
            date: now,
            note: `${finalDescription} - ${categoryName} (${groupName})`,
            groupId,
          });
        }
      }

      // Refresh global store so dashboard updates instantly
      await useStore.getState().loadData();

      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save expense.");
    }
  };

  const visibleCategories = expenseCategories.slice(0, 4);
  const hasMoreCategories = expenseCategories.length > 4;

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
            <Ionicons name="close" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
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

          {/* Selected Category Preview */}
          {selectedCategory && (
            <View style={styles.selectedCategoryPreview}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: selectedCategory.color + "20" },
                ]}
              >
                <Ionicons
                  name={selectedCategory.icon as any}
                  size={16}
                  color={selectedCategory.color}
                />
              </View>
              <Text style={styles.previewText}>
                <Text style={{ fontWeight: "600", color: Colors.light.text }}>
                  {selectedCategory.name}
                </Text>
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Description <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Dinner at Mario's"
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryWrap}>
              {visibleCategories.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    selectedCategoryId === cat.id && {
                      backgroundColor: cat.color,
                      borderColor: cat.color,
                    },
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={selectedCategoryId === cat.id ? "#FFF" : cat.color}
                  />
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategoryId === cat.id && { color: "#FFF" },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}

              {hasMoreCategories && (
                <TouchableOpacity
                  style={styles.viewAllChip}
                  onPress={() => setIsCategoryModalVisible(true)}
                >
                  <Ionicons
                    name="grid-outline"
                    size={16}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.viewAllChipText}>More</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Receipt Image Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Receipt Image <Text style={styles.optionalText}>(Optional)</Text>
            </Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
              {receiptImage ? (
                <Image
                  source={{ uri: receiptImage }}
                  style={styles.receiptImagePreview}
                />
              ) : (
                <>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.imagePickerText}>Upload Receipt</Text>
                </>
              )}
            </TouchableOpacity>
            {receiptImage && (
              <TouchableOpacity
                style={styles.removeImageBtn}
                onPress={() => setReceiptImage(null)}
              >
                <Text style={styles.removeImageText}>Remove Image</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.label}>Who Paid?</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 24 }}
          >
            {members
              ?.slice()
              .sort((a, b) => {
                if (a.isUser) return -1;
                if (b.isUser) return 1;
                if (a.isFund) return -1;
                if (b.isFund) return 1;
                return 0;
              })
              .map((m) => {
                const isFund = m.isFund;
                const fundTooLow =
                  isFund && Math.abs(fundBalance) < totalAmount;

                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.payerChip,
                      payerId === m.id && styles.payerChipActive,
                      fundTooLow && { opacity: 0.5 },
                    ]}
                    onPress={() => {
                      if (fundTooLow) {
                        Alert.alert(
                          "Fund Too Low",
                          `The group fund only has $${Math.abs(fundBalance).toFixed(2)} available. Expand the fund or split the expense.`,
                        );
                      } else {
                        setPayerId(m.id);
                      }
                    }}
                  >
                    <Ionicons
                      name={isFund ? "wallet" : "person"}
                      size={16}
                      color={
                        payerId === m.id ? "#FFF" : Colors.light.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.payerChipText,
                        payerId === m.id && styles.payerChipTextActive,
                      ]}
                    >
                      {m.isUser ? "Me" : m.name}
                    </Text>
                    {isFund && (
                      <Text
                        style={[
                          styles.payerChipText,
                          { fontSize: 10, marginLeft: 4 },
                          payerId === m.id && styles.payerChipTextActive,
                        ]}
                      >
                        (${Math.abs(fundBalance).toFixed(2)})
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
          </ScrollView>

          {payerIsUser && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pay From (Personal Account)</Text>
              <Text style={styles.subLabel}>
                This will automatically sync with your personal budget.
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
              >
                {userAccounts?.map((acc) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.payerChip,
                      selectedAccountId === acc.id && styles.payerChipActive,
                    ]}
                    onPress={() => setSelectedAccountId(acc.id)}
                  >
                    <Ionicons
                      name={acc.icon as any}
                      size={16}
                      color={selectedAccountId === acc.id ? "#FFF" : acc.color}
                    />
                    <Text
                      style={[
                        styles.payerChipText,
                        selectedAccountId === acc.id &&
                          styles.payerChipTextActive,
                      ]}
                    >
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {payerId &&
          members?.find((m) => m.id === payerId)?.isFund &&
          splitType === "equal" ? (
            <View
              style={{
                backgroundColor: "#F8FAFC",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons
                  name="information-circle"
                  size={20}
                  color="#10B981"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: Colors.light.text,
                  }}
                >
                  Deducting from Group Bank
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginTop: 8,
                  marginBottom: 6,
                }}
              >
                <Text
                  style={{ fontSize: 14, color: Colors.light.textSecondary }}
                >
                  Current Fund Balance
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: Colors.light.text,
                  }}
                >
                  ${Math.abs(fundBalance).toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{ fontSize: 14, color: Colors.light.textSecondary }}
                >
                  Remaining After Expense
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color:
                      Math.abs(fundBalance) - totalAmount < 0
                        ? Colors.light.danger
                        : Colors.light.success,
                  }}
                >
                  ${(Math.abs(fundBalance) - totalAmount).toFixed(2)}
                </Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.label}>Split Options</Text>
              </View>
              <View style={styles.splitTabs}>
                <TouchableOpacity
                  style={[
                    styles.splitTab,
                    splitType === "equal" && styles.splitTabActive,
                  ]}
                  onPress={() => setSplitType("equal")}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      splitType === "equal" && styles.splitTabTextActive,
                    ]}
                  >
                    Equally
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.splitTab,
                    splitType === "exact" && styles.splitTabActive,
                  ]}
                  onPress={() => setSplitType("exact")}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      splitType === "exact" && styles.splitTabTextActive,
                    ]}
                  >
                    Exact
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.splitTab,
                    splitType === "percentage" && styles.splitTabActive,
                  ]}
                  onPress={() => setSplitType("percentage")}
                >
                  <Text
                    style={[
                      styles.splitTabText,
                      splitType === "percentage" && styles.splitTabTextActive,
                    ]}
                  >
                    %
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.sharesList}>
                {members?.map((m) => {
                  if (m.isFund) return null; // Don't show fund in shares list
                  return (
                    <View key={m.id} style={styles.shareRow}>
                      <Text style={styles.shareName}>
                        {m.isUser ? "Me" : m.name}
                      </Text>

                      {splitType === "equal" ? (
                        <Text style={styles.shareAmount}>
                          ${calculatedShares[m.id]?.toFixed(2) || "0.00"}
                        </Text>
                      ) : (
                        <View style={styles.shareInputWrapper}>
                          {splitType === "exact" && (
                            <Text style={styles.shareInputPrefix}>$</Text>
                          )}
                          <TextInput
                            style={styles.shareInput}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            value={customShares[m.id] || ""}
                            onChangeText={(val) =>
                              setCustomShares({ ...customShares, [m.id]: val })
                            }
                          />
                          {splitType === "percentage" && (
                            <Text style={styles.shareInputSuffix}>%</Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setIsCategoryModalVisible(false)}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={Colors.light.textSecondary}
                />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <View style={styles.modalGrid}>
                {expenseCategories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.modalCategoryItem}
                    onPress={() => {
                      setSelectedCategoryId(cat.id);
                      setIsCategoryModalVisible(false);
                    }}
                  >
                    <View
                      style={[
                        styles.modalCategoryIcon,
                        {
                          backgroundColor:
                            selectedCategoryId === cat.id
                              ? cat.color
                              : cat.color + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={24}
                        color={
                          selectedCategoryId === cat.id ? "#FFF" : cat.color
                        }
                      />
                    </View>
                    <Text style={styles.modalCategoryText} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    backgroundColor: "#6366F1",
    borderRadius: 8,
  },
  saveBtnText: { fontSize: 15, fontWeight: "700", color: "#FFF" },

  content: { flex: 1, padding: 20 },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 0,
    marginBottom: 20,
  },
  currencySymbol: {
    fontSize: 40,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    fontSize: 48,
    fontWeight: "700",
    color: Colors.light.text,
    minWidth: 100,
  },

  selectedCategoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 2,
    borderRadius: 14,
    marginBottom: 16,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
  previewIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  previewText: { fontSize: 14 },

  inputGroup: { marginBottom: 24 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.text,
    marginBottom: 8,
  },
  optionalText: { fontSize: 13, color: "#94A3B8", fontWeight: "400" },
  subLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 8,
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

  categoryWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.light.text,
  },
  viewAllChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  viewAllChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },

  imagePickerBtn: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 12,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  imagePickerText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: "500",
  },
  receiptImagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  removeImageBtn: { alignSelf: "flex-start", marginTop: 8 },
  removeImageText: { color: "#EF4444", fontSize: 13, fontWeight: "600" },

  sectionHeader: { marginBottom: 12 },

  payerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  payerChipActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  payerChipText: { fontSize: 15, fontWeight: "500", color: Colors.light.text },
  payerChipTextActive: { color: "#FFF" },

  splitTabs: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  splitTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  splitTabActive: {
    backgroundColor: "#FFF",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  splitTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  splitTabTextActive: { color: "#6366F1" },

  sharesList: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  shareName: { fontSize: 16, fontWeight: "500", color: Colors.light.text },
  shareAmount: { fontSize: 16, fontWeight: "600", color: Colors.light.text },

  shareInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  shareInputPrefix: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginRight: 4,
  },
  shareInputSuffix: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  shareInput: {
    width: 60,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: "right",
    color: Colors.light.text,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: Colors.light.text },
  modalGrid: { flexDirection: "row", flexWrap: "wrap", paddingBottom: 40 },
  modalCategoryItem: { width: "25%", alignItems: "center", marginBottom: 20 },
  modalCategoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modalCategoryText: {
    fontSize: 12,
    color: Colors.light.text,
    textAlign: "center",
    fontWeight: "500",
    paddingHorizontal: 4,
  },
});
