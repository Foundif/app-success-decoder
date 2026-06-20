// Currency formatting — INR only.
export const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const INR2 = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export function formatINR(amount: number | null | undefined, withPaise = false) {
  if (amount == null || isNaN(Number(amount))) return "₹0";
  return (withPaise ? INR2 : INR).format(Number(amount));
}
