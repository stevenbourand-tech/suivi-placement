// src/utils.js
export function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

export function computeProfit(current, invested) {
  const c = Number(current) || 0;
  const i = Number(invested) || 0;
  return c - i;
}

export function computeProfitPercent(current, invested) {
  const c = Number(current) || 0;
  const i = Number(invested) || 0;
  if (i <= 0) return 0;
  return ((c - i) / i) * 100;
}

// Conversion simple pour le budget : EUR ou CHF → EUR
export function convertCurrency(amount, currency, chfRate) {
  const val = Number(amount) || 0;
  if (currency === "CHF") return val * chfRate;
  return val;
}

// Conversion pour les placements (patrimoine)
export function convertHoldingValueToEur(h, value, chfEurRate) {
  const v = Number(value) || 0;
  if (h.currency === "CHF") {
    const rate = chfEurRate || 1.05;
    return v * rate;
  }
  return v; // EUR ou autre
}

export function guessCoingeckoId(symbol) {
  if (!symbol) return null;
  const s = symbol.toLowerCase();
  const map = {
    btc: "bitcoin",
    eth: "ethereum",
    sol: "solana",
    link: "chainlink",
    avax: "avalanche-2",
    atom: "cosmos",
    inj: "injective-protocol",
    usdt: "tether",
  };
  return map[s] || null;
}
