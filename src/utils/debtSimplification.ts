export interface RepaymentInstruction {
  from: string;
  to: string;
  amount: number;
}

export function simplifyDebts(balances: Record<string, number>): RepaymentInstruction[] {
  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  // Separate into debtors (negative balance) and creditors (positive balance)
  for (const [id, balance] of Object.entries(balances)) {
    if (balance < -0.01) {
      debtors.push({ id, amount: Math.abs(balance) });
    } else if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    }
  }

  // Sort descending by amount for greedy matching
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const instructions: RepaymentInstruction[] = [];
  let d = 0; // debtor index
  let c = 0; // creditor index

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];

    const amountToSettle = Math.min(debtor.amount, creditor.amount);

    if (amountToSettle > 0.01) {
      instructions.push({
        from: debtor.id,
        to: creditor.id,
        amount: amountToSettle,
      });
    }

    debtor.amount -= amountToSettle;
    creditor.amount -= amountToSettle;

    // Move to next debtor/creditor if their balance is settled
    if (debtor.amount < 0.01) {
      d++;
    }
    if (creditor.amount < 0.01) {
      c++;
    }
  }

  return instructions;
}
