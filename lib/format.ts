// Price format decided by Matas (docs/design/JOURNEY.md, 2026-11-12):
// the euro sign sticks to the number in mono prices: "78€", "149,90€".
// In plain running text (Archivo) a space is fine: "4,90 €".

function amount(cents: number): string {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString('lt-LT', {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

/** Mono price: 7800 -> "78€", 14990 -> "149,90€". */
export function formatEUR(cents: number): string {
  return `${amount(cents)}€`;
}

/** Price inside normal text: 490 -> "4,90 €". */
export function formatEURText(cents: number): string {
  return `${amount(cents)} €`;
}
