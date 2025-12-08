// src/constants.js
export const STORAGE_KEY = "steven-portfolio-v2";

// Catégories "patrimoine / investissements"
export const INVESTMENT_CATEGORIES = [
  "Liquidités",
  "ETF",
  "Actions",
  "Assurance-vie",
  "PEA / CTO",
  "Start-up",
  "Autre",
];

// Catégories "budget / flux"
export const BUDGET_CATEGORIES = [
  "Salaire",
  "Revenus",
  "Revenus divers",
  "Charges fixes",
  "Abonnements",
  "Impôts",
  "Autres dépenses",
];

// Catégories crédits / leasing
export const CREDIT_CATEGORIES = [
  "Crédit",
  "Crédit immo",
  "Crédit immobilier",
  "Crédit conso",
  "Leasing",
  "Prêt",
  "Autre crédit",
];

// Liste globale pour les menus déroulants
export const CATEGORIES = [
  ...INVESTMENT_CATEGORIES,
  "Crypto",
  ...BUDGET_CATEGORIES,
  ...CREDIT_CATEGORIES,
];

// Ne doivent PAS entrer dans la perf patrimoine
export const EXCLUDED_CATEGORIES = [...BUDGET_CATEGORIES, ...CREDIT_CATEGORIES];

export const DEFAULT_HOLDINGS = [
  {
    id: 1,
    name: "Livret A",
    account: "Banque principale",
    category: "Liquidités",
    amountInvested: 14000,
    currentValue: 14000,
    currency: "EUR",
    quantity: null,
    avgBuyPrice: null,
    pruCurrency: "EUR",
    livePrice: null,
    coingeckoId: null,
    stockTicker: null,
  },
  {
    id: 2,
    name: "ETF Monde",
    account: "PEA Bourse Direct",
    category: "ETF",
    amountInvested: 10000,
    currentValue: 11200,
    currency: "EUR",
    quantity: null,
    avgBuyPrice: null,
    pruCurrency: "EUR",
    livePrice: null,
    coingeckoId: null,
    stockTicker: null,
  },
  {
    id: 3,
    name: "Air Liquide",
    account: "PEA Bourse Direct",
    category: "Actions",
    amountInvested: 10000,
    currentValue: 11000,
    currency: "EUR",
    quantity: 83,
    avgBuyPrice: 120,
    pruCurrency: "EUR",
    livePrice: null,
    coingeckoId: null,
    stockTicker: "AI.PA",
  },
  {
    id: 4,
    name: "BTC",
    account: "Portefeuille crypto",
    category: "Crypto",
    amountInvested: 1900,
    currentValue: 2600,
    currency: "EUR",
    quantity: 0.05,
    avgBuyPrice: 38000,
    pruCurrency: "EUR",
    livePrice: null,
    coingeckoId: "bitcoin",
    stockTicker: null,
  },
];
