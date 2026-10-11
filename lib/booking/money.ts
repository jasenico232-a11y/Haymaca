/**
 * All money is integer cents, computed server-side from the departure record.
 * The client never supplies a price, so a tampered client amount cannot influence
 * what is charged.
 */
export function computeAmounts(
  priceUsdPerPerson: number,
  partySize: number,
  depositPct: number,
): { totalCents: number; depositCents: number; currency: "USD" } {
  const totalCents = Math.round(priceUsdPerPerson * 100) * partySize;
  const depositCents = Math.round(totalCents * depositPct);
  return { totalCents, depositCents, currency: "USD" };
}

export function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}
