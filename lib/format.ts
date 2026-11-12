/** Format integer cents as a euro price, e.g. 14500 -> "EUR 145,00". Show it in IBM Plex Mono (.mono). */
export function formatEUR(cents: number): string {
  const value = (cents / 100).toLocaleString('lt-LT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `EUR ${value}`;
}

/** Short form without decimals when whole, e.g. 14500 -> "EUR 145", 4999 -> "EUR 49,99". */
export function formatEURShort(cents: number): string {
  return cents % 100 === 0 ? `EUR ${cents / 100}` : formatEUR(cents);
}
