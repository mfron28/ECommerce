export const SHIPPING_REGIONS = {
  US: { label: "United States", cost: 9.99 },
  EU: { label: "Europe", cost: 14.99 },
  UK: { label: "United Kingdom", cost: 12.99 },
  OTHER: { label: "Rest of world", cost: 19.99 },
};

export function getShippingCost(region) {
  const key = String(region || "").toUpperCase();
  const row = SHIPPING_REGIONS[key];
  if (!row) {
    return { region: "OTHER", cost: SHIPPING_REGIONS.OTHER.cost };
  }
  return { region: key, cost: row.cost };
}
