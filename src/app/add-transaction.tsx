import { Colors } from "@/constants/theme";
import { addTransaction as addTxn } from "@/db/queries";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
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

const { width } = Dimensions.get("window");
const GRID_COLS = 4;
const ICON_SIZE = (width - 80) / GRID_COLS;

export default function AddTransactionScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { accounts, expenseCategories, incomeCategories, currency, loadData } =
    useStore();

  const [type, setType] = useState<"expense" | "income" | "transfer">(
    (params.type as any) || "expense",
  );
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts[0]?.id || "",
  );
  const [toAccountId, setToAccountId] = useState(
    accounts[1]?.id || accounts[0]?.id || "",
  );
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showToAccountPicker, setShowToAccountPicker] = useState(false);
  const [pickerFor, setPickerFor] = useState<"from" | "to">("from");

  const currentCategories =
    type === "income" ? incomeCategories : expenseCategories;
  const selectedAccount = accounts.find((a: any) => a.id === selectedAccountId);
  const toAccount = accounts.find((a: any) => a.id === toAccountId);
  const selectedCategory = currentCategories.find(
    (c: any) => c.id === selectedCategoryId,
  );
  const selectedParent = currentCategories.find(
    (c: any) => c.id === selectedCategory?.parentId,
  );

  const executeSave = async () => {
    const parsedAmount = parseFloat(amount);
    try {
      await addTxn({
        accountId: selectedAccountId,
        categoryId: type !== "transfer" ? selectedCategoryId : undefined,
        amount: parsedAmount,
        type,
        note: note.trim() || undefined,
        toAccountId: type === "transfer" ? toAccountId : undefined,
      });
      await loadData();
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (!selectedAccountId) {
      Alert.alert("No Account", "Please select an account first.");
      return;
    }
    if (type !== "transfer" && !selectedCategoryId) {
      Alert.alert("No Category", "Please select a category.");
      return;
    }
    if (type === "transfer" && selectedAccountId === toAccountId) {
      Alert.alert(
        "Same Account",
        "Please select different accounts for transfer.",
      );
      return;
    }

    if (type === "expense" || type === "transfer") {
      if (selectedAccount && selectedAccount.balance < parsedAmount) {
        Alert.alert(
          "Insufficient Funds",
          `This transaction will bring your account balance to ${formatCurrency(selectedAccount.balance - parsedAmount, currency.code)}. Are you sure you want to proceed?`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Proceed",
              style: "destructive",
              onPress: executeSave,
            },
          ]
        );
        return;
      }
    }

    await executeSave();
  };

  const parentCategories = currentCategories.filter((c: any) => !c.parentId);
  const subCategories = currentCategories.filter((c: any) => c.parentId);

  const renderCategoryGrid = () => (
    <View>
      {parentCategories.map((parent: any) => {
        const children = subCategories.filter(
          (c: any) => c.parentId === parent.id,
        );

        return (
          <View key={parent.id} style={styles.parentSection}>
            <View style={styles.parentHeader}>
              <View style={styles.parentHeaderLeft}>
                <Ionicons
                  name={parent.icon as any}
                  size={20}
                  color={parent.color}
                />
                <Text style={styles.parentTitle}>{parent.name}</Text>
              </View>
            </View>

            <View style={styles.categoryGrid}>
              {children.map((cat: any) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    selectedCategoryId === cat.id &&
                      styles.categoryItemSelected,
                  ]}
                  onPress={() => setSelectedCategoryId(cat.id)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: parent.color + "15" },
                      selectedCategoryId === cat.id && {
                        backgroundColor: parent.color,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={22}
                      color={
                        selectedCategoryId === cat.id ? "#FFF" : parent.color
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      selectedCategoryId === cat.id && {
                        color: parent.color,
                        fontWeight: "700",
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
              {children.length === 0 && (
                <Text style={styles.emptySubText}>No sub-categories</Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const AccountPickerModal = ({
    visible,
    onClose,
    onSelect,
    excludeId,
  }: any) => {
    const availableAccounts = accounts.filter((a: any) => a.id !== excludeId);

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Account</Text>
              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                <TouchableOpacity onPress={() => { onClose(); router.push('/add-account'); }}>
                  <Ionicons name="add" size={26} color={Colors.light.tint || "#42A5F5"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={26} color={Colors.light.text} />
                </TouchableOpacity>
              </View>
            </View>
            
            {availableAccounts.length === 0 ? (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
                <Ionicons name="wallet-outline" size={56} color="#CBD5E1" style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 16, color: Colors.light.text, textAlign: "center", fontWeight: "600", marginBottom: 8 }}>
                  No accounts found
                </Text>
                <Text style={{ fontSize: 14, color: Colors.light.textSecondary, textAlign: "center", marginBottom: 24, lineHeight: 20 }}>
                  You currently don't have any accounts available. Please create one to continue.
                </Text>
                <TouchableOpacity 
                  style={{ backgroundColor: Colors.light.tint || "#42A5F5", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8 }}
                  onPress={() => { onClose(); router.push('/add-account'); }}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFF" />
                  <Text style={{ color: "#FFF", fontWeight: "600", fontSize: 15 }}>Create Account</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {availableAccounts.map((acc: any) => (
                  <TouchableOpacity
                    key={acc.id}
                    style={styles.accountOption}
                    onPress={() => {
                      onSelect(acc.id);
                      onClose();
                    }}
                  >
                    <Ionicons name={acc.icon as any} size={22} color={acc.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.accountOptionName}>{acc.name}</Text>
                      <Text style={styles.accountOptionBal}>
                        {formatCurrency(acc.balance, currency.code)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/');
            }
          }}>
            <Ionicons name="close" size={28} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Transaction</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          {(["expense", "income", "transfer"] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeBtn, type === t && styles.typeBtnActive(t)]}
              onPress={() => {
                setType(t);
                setSelectedCategoryId("");
              }}
            >
              <Text
                style={[
                  styles.typeBtnText,
                  type === t && styles.typeBtnTextActive,
                ]}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text style={styles.currencySymbol}>{currency.symbol}</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#CBD5E1"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
              autoFocus
            />
          </View>

          {/* Selected Category Preview */}
          {type !== "transfer" && selectedCategory && selectedParent && (
            <View style={styles.selectedCategoryPreview}>
              <View
                style={[
                  styles.previewIcon,
                  { backgroundColor: selectedParent.color + "20" },
                ]}
              >
                <Ionicons
                  name={selectedCategory.icon as any}
                  size={16}
                  color={selectedParent.color}
                />
              </View>
              <Text style={styles.previewText}>
                <Text style={{ fontWeight: "600", color: Colors.light.text }}>
                  {selectedParent.name}
                </Text>
                <Text style={{ color: "#94A3B8" }}> • </Text>
                <Text style={{ color: Colors.light.textSecondary }}>
                  {selectedCategory.name}
                </Text>
              </Text>
            </View>
          )}

          {/* Account Selector */}
          <TouchableOpacity
            style={styles.selectorRow}
            onPress={() => setShowAccountPicker(true)}
          >
            <View style={styles.selectorLeft}>
              <Ionicons
                name={(selectedAccount?.icon || "wallet") as any}
                size={20}
                color={selectedAccount?.color || Colors.light.tint}
              />
              <Text style={styles.selectorLabel}>From Account</Text>
            </View>
            <View style={styles.selectorRight}>
              <Text style={styles.selectorValue}>
                {selectedAccount?.name || "Select"}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </View>
          </TouchableOpacity>

          {/* To Account (Transfer only) */}
          {type === "transfer" && (
            <TouchableOpacity
              style={styles.selectorRow}
              onPress={() => setShowToAccountPicker(true)}
            >
              <View style={styles.selectorLeft}>
                <Ionicons
                  name={(toAccount?.icon || "wallet") as any}
                  size={20}
                  color={toAccount?.color || Colors.light.tint}
                />
                <Text style={styles.selectorLabel}>To Account</Text>
              </View>
              <View style={styles.selectorRight}>
                <Text style={styles.selectorValue}>
                  {toAccount?.name || "Select"}
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </View>
            </TouchableOpacity>
          )}

          {/* Category Grid (not for transfers) */}
          {type !== "transfer" && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Category</Text>
              {renderCategoryGrid()}
            </View>
          )}

          {/* Note */}
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note (optional)"
            placeholderTextColor="#94A3B8"
            value={note}
            onChangeText={setNote}
            multiline
          />

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              {
                backgroundColor:
                  type === "income"
                    ? "#66BB6A"
                    : type === "transfer"
                      ? "#42A5F5"
                      : "#EF5350",
              },
            ]}
            onPress={handleSave}
          >
            <Ionicons name="checkmark" size={22} color="#FFF" />
            <Text style={styles.saveBtnText}>
              Save {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <AccountPickerModal
        visible={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        onSelect={setSelectedAccountId}
      />
      <AccountPickerModal
        visible={showToAccountPicker}
        onClose={() => setShowToAccountPicker(false)}
        onSelect={setToAccountId}
        excludeId={selectedAccountId}
      />
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
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },

  typeSelector: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  typeBtnActive: (t: string) => ({
    backgroundColor:
      t === "expense" ? "#EF5350" : t === "income" ? "#66BB6A" : "#42A5F5",
  }),
  typeBtnText: { fontSize: 14, fontWeight: "600", color: "#94A3B8" },
  typeBtnTextActive: { color: "#FFF" },

  content: { flex: 1, paddingHorizontal: 20 },

  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: "700",
    color: Colors.light.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 40,
    fontWeight: "800",
    color: Colors.light.text,
  },

  selectedCategoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  previewIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  previewText: { fontSize: 15 },

  selectorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  selectorLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  selectorLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.light.textSecondary,
  },
  selectorRight: { flexDirection: "row", alignItems: "center", gap: 4 },
  selectorValue: { fontSize: 15, fontWeight: "600", color: Colors.light.text },

  section: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.light.textSecondary,
    marginBottom: 12,
  },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap" },
  categoryItem: { width: ICON_SIZE, alignItems: "center", marginBottom: 16 },
  categoryItemSelected: {},
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },

  parentSection: {
    marginBottom: 20,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
  },
  parentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  parentHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  parentTitle: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  emptySubText: {
    fontSize: 13,
    color: "#94A3B8",
    fontStyle: "italic",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  addParentBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  addParentText: { fontSize: 14, fontWeight: "600", color: "#64748B" },

  noteInput: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.light.text,
    minHeight: 56,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  bottomBar: { padding: 20, paddingBottom: 8 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  saveBtnText: { color: "#FFF", fontSize: 17, fontWeight: "700" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "60%",
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.light.text },
  accountOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  accountOptionName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.light.text,
  },
  accountOptionBal: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
} as any);
