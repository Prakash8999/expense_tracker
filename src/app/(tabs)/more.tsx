import {
  Colors,
  FontFamily,
  Radius,
  ScreenPadding,
  Shadows,
} from "@/constants/theme";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MENU_SECTIONS = [
  {
    title: "Finance Tools",
    items: [
      {
        key: "accounts",
        icon: "wallet",
        color: "#6366F1",
        label: "Accounts",
        route: "/accounts",
      },
      {
        key: "categories",
        icon: "grid",
        color: "#42A5F5",
        label: "Categories",
        route: "/manage-categories",
      },
      {
        key: "planned",
        icon: "calendar",
        color: "#FF7043",
        label: "Planned Payments",
        route: "/planned-payments",
      },
      {
        key: "debts",
        icon: "people-circle",
        color: "#EF5350",
        label: "Debt Tracker",
        route: "/debts",
      },
    ],
  },
  {
    title: "Utilities",
    items: [
      {
        key: "shopping",
        icon: "cart",
        color: "#66BB6A",
        label: "Shopping Lists",
        route: "/shopping",
      },
      {
        key: "documents",
        icon: "document-text",
        color: "#FFA726",
        label: "Document Vault",
        route: "/documents",
      },
      {
        key: "investments",
        icon: "trending-up",
        color: "#26A69A",
        label: "Investments",
        route: "/investments",
      },
    ],
  },
  // {
  //   title: 'Data',
  //   items: [
  //     { key: 'export', icon: 'download', color: '#7E57C2', label: 'Export CSV', route: '' },
  //     { key: 'import', icon: 'cloud-upload', color: '#42A5F5', label: 'Import CSV', route: '' },
  //   ],
  // },
];

export default function MoreScreen() {
  const {
    debts,
    shoppingLists,
    investments,
    currency,
    accounts,
    plannedPayments,
  } = useStore();

  const totalDebtOwed = debts
    .filter((d: any) => d.type === "lent")
    .reduce((s: number, d: any) => s + d.remainingAmount, 0);
  const totalDebtBorrowed = debts
    .filter((d: any) => d.type === "borrowed")
    .reduce((s: number, d: any) => s + d.remainingAmount, 0);
  const totalInvestmentValue = investments.reduce(
    (s: number, i: any) => s + i.currentValue * i.quantity,
    0,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>More</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="wallet" size={22} color="#6366F1" />
            <Text style={styles.statLabel}>{accounts.length} Accounts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={22} color="#FF7043" />
            <Text style={styles.statLabel}>
              {plannedPayments.length} Upcoming
            </Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="people-circle" size={22} color="#EF5350" />
            <Text style={styles.statLabel}>{debts.length} Debts</Text>
          </View>
        </View>

        {/* Debt Summary */}
        {(totalDebtOwed > 0 || totalDebtBorrowed > 0) && (
          <View style={styles.debtSummary}>
            {totalDebtOwed > 0 && (
              <View style={styles.debtItem}>
                <View
                  style={[styles.debtDot, { backgroundColor: "#66BB6A" }]}
                />
                <Text style={styles.debtLabel}>Others owe you</Text>
                <Text style={[styles.debtAmount, { color: "#66BB6A" }]}>
                  {formatCurrency(totalDebtOwed, currency.code)}
                </Text>
              </View>
            )}
            {totalDebtBorrowed > 0 && (
              <View style={styles.debtItem}>
                <View
                  style={[styles.debtDot, { backgroundColor: "#EF5350" }]}
                />
                <Text style={styles.debtLabel}>You owe</Text>
                <Text style={[styles.debtAmount, { color: "#EF5350" }]}>
                  {formatCurrency(totalDebtBorrowed, currency.code)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Menu Sections */}
        {MENU_SECTIONS.map((section) => (
          <View key={section.title} style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>{section.title}</Text>
            <View style={styles.menuCard}>
              {section.items.map((item, i) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.menuItem,
                    i < section.items.length - 1 && styles.menuItemBorder,
                  ]}
                  onPress={() =>
                    item.route ? router.push(item.route as any) : null
                  }
                >
                  <View
                    style={[
                      styles.menuItemIcon,
                      { backgroundColor: item.color + "15" },
                    ]}
                  >
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color}
                    />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>💰 FinTrack</Text>
          <Text style={styles.appVersion}>Version 1.0.0 • Offline First</Text>
          <Text style={styles.appCurrency}>
            Currency: {currency.name} ({currency.symbol})
          </Text>

          <TouchableOpacity
            style={{
              marginTop: 24,
              padding: 14,
              backgroundColor: Colors.light.dangerLight,
              borderRadius: Radius.sm,
              borderWidth: 1,
              borderColor: "#FECACA",
            }}
            onPress={() => {
              import("react-native").then(({ Alert }) => {
                Alert.alert(
                  "Clear All Data",
                  "Are you sure you want to delete ALL data? This includes accounts, transactions, and groups.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        const { db } = require("@/db");
                        const schema = require("@/db/schema");
                        try {
                          await db.delete(schema.transactions);
                          await db.delete(schema.accounts);
                          await db.delete(schema.categories);
                          await db.delete(schema.budgets);
                          await db.delete(schema.debts);
                          await db.delete(schema.debtPayments);
                          await db.delete(schema.goals);
                          await db.delete(schema.goalContributions);
                          await db.delete(schema.plannedPayments);
                          await db.delete(schema.shoppingLists);
                          await db.delete(schema.shoppingItems);
                          await db.delete(schema.documents);
                          await db.delete(schema.investments);
                          await db.delete(schema.groups);
                          await db.delete(schema.groupMembers);
                          await db.delete(schema.groupExpenses);
                          await db.delete(schema.groupExpenseParticipants);
                          await db.delete(schema.groupSettlements);

                          useStore.getState().loadData();
                          Alert.alert("Success", "Database has been reset.");
                        } catch (e) {
                          console.error(e);
                          Alert.alert("Error", "Failed to clear database.");
                        }
                      },
                    },
                  ],
                );
              });
            }}
          >
            <Text
              style={{
                color: Colors.light.danger,
                fontFamily: FontFamily.bold,
              }}
            >
              ⚠️ Clear Database
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: ScreenPadding, paddingVertical: 16 },
  headerTitle: {
    fontSize: 26,
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: ScreenPadding,
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: Radius.md,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },

  debtSummary: {
    marginHorizontal: ScreenPadding,
    backgroundColor: Colors.light.card,
    borderRadius: Radius.lg,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  debtItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  debtDot: { width: 10, height: 10, borderRadius: 5 },
  debtLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.light.text,
  },
  debtAmount: { fontSize: 16, fontFamily: FontFamily.bold },

  menuSection: { paddingHorizontal: ScreenPadding, marginBottom: 24 },
  menuSectionTitle: {
    fontSize: 11,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: Colors.light.card,
    borderRadius: Radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.text,
  },

  appInfo: { alignItems: "center", paddingVertical: 36 },
  appName: {
    fontSize: 20,
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },
  appVersion: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: Colors.light.textTertiary,
    marginTop: 6,
  },
  appCurrency: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
});
