import { useEffect, useState } from "react";

const STORAGE_KEY = "steven-portfolio-v2";

// Catégories "patrimoine / investissements"
const INVESTMENT_CATEGORIES = [
  "Liquidités",
  "ETF",
  "Actions",
  "Assurance-vie",
  "PEA / CTO",
  "Start-up",
  "Autre",
];

// Catégories "budget / flux"
const BUDGET_CATEGORIES = [
  "Salaire",
  "Revenus",
  "Revenus divers",
  "Charges fixes",
  "Abonnements",
  "Impôts",
  "Autres dépenses",
];

// Catégories crédits / leasing
const CREDIT_CATEGORIES = [
  "Crédit",
  "Crédit immo",
  "Crédit conso",
  "Leasing",
  "Prêt",
  "Autre crédit",
];

// Liste globale pour les menus déroulants
const CATEGORIES = [
  ...INVESTMENT_CATEGORIES,
  "Crypto", // gérée dans l’onglet Crypto
  ...BUDGET_CATEGORIES,
  ...CREDIT_CATEGORIES,
];

// Ne doivent PAS entrer dans la perf patrimoine
const EXCLUDED_CATEGORIES = [...BUDGET_CATEGORIES, ...CREDIT_CATEGORIES];

const DEFAULT_HOLDINGS = [
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    maximumFractionDigits: 2,
  });
}

function computeProfit(current, invested) {
  const c = Number(current) || 0;
  const i = Number(invested) || 0;
  return c - i;
}

function computeProfitPercent(current, invested) {
  const c = Number(current) || 0;
  const i = Number(invested) || 0;
  if (i <= 0) return 0;
  return ((c - i) / i) * 100;
}

function guessCoingeckoId(symbol) {
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

export default function App() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [activeTab, setActiveTab] = useState("global");
  const [eurUsdtRate, setEurUsdtRate] = useState(0.93);
  const [newHolding, setNewHolding] = useState({
    name: "",
    account: "",
    category: "Liquidités",
    amountInvested: "",
    currentValue: "",
    currency: "EUR",
    quantity: "",
    avgBuyPrice: "",
    pruCurrency: "EUR",
    coingeckoId: "",
    stockTicker: "",
  });
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [isRefreshingCrypto, setIsRefreshingCrypto] = useState(false);
  const [cryptoLastUpdate, setCryptoLastUpdate] = useState(null);
  const [isRefreshingStocks, setIsRefreshingStocks] = useState(false);
  const [stockLastUpdate, setStockLastUpdate] = useState(null);

  // ======= LOCALSTORAGE =======
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHoldings(parsed);
        }
      }
    } catch (e) {
      console.error("Erreur lecture localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    } catch (e) {
      console.error("Erreur écriture localStorage", e);
    }
  }, [holdings]);

  // ======= DERIVÉS GLOBAUX =======
  const totalInvested = holdings.reduce((sum, h) => {
    if (EXCLUDED_CATEGORIES.includes(h.category)) return sum;
    if (h.category === "Crypto") return sum; // crypto gérée à part
    return sum + (Number(h.amountInvested) || 0);
  }, 0);

  const totalCurrent = holdings.reduce((sum, h) => {
    if (EXCLUDED_CATEGORIES.includes(h.category)) return sum;
    if (h.category === "Crypto") return sum;
    return sum + (Number(h.currentValue) || 0);
  }, 0);

  const totalProfit = computeProfit(totalCurrent, totalInvested);
  const totalProfitPct = computeProfitPercent(totalCurrent, totalInvested);

  const cryptoHoldings = holdings.filter((h) => h.category === "Crypto");
  const actionsHoldings = holdings.filter((h) => h.category === "Actions");

  const budgetHoldings = holdings.filter((h) =>
    BUDGET_CATEGORIES.includes(h.category)
  );
  const creditHoldings = holdings.filter((h) =>
    CREDIT_CATEGORIES.includes(h.category)
  );

  const cryptoInvested = cryptoHoldings.reduce(
    (s, h) => s + (Number(h.amountInvested) || 0),
    0
  );
  const cryptoCurrent = cryptoHoldings.reduce(
    (s, h) => s + (Number(h.currentValue) || 0),
    0
  );
  const cryptoProfit = computeProfit(cryptoCurrent, cryptoInvested);
  const cryptoProfitPct = computeProfitPercent(cryptoCurrent, cryptoInvested);

  const actionsInvested = actionsHoldings.reduce(
    (s, h) => s + (Number(h.amountInvested) || 0),
    0
  );
  const actionsCurrent = actionsHoldings.reduce(
    (s, h) => s + (Number(h.currentValue) || 0),
    0
  );
  const actionsProfit = computeProfit(actionsCurrent, actionsInvested);
  const actionsProfitPct = computeProfitPercent(
    actionsCurrent,
    actionsInvested
  );

  const allocationByCategory = INVESTMENT_CATEGORIES.map((cat) => {
    const value = holdings
      .filter((h) => h.category === cat)
      .reduce((sum, h) => sum + (Number(h.currentValue) || 0), 0);
    const weight = totalCurrent > 0 ? (value / totalCurrent) * 100 : 0;
    return { category: cat, value, weight };
  }).filter((a) => a.value > 0);

  const cryptoAllocation = cryptoHoldings
    .map((h) => {
      const value = Number(h.currentValue) || 0;
      const weight = cryptoCurrent > 0 ? (value / cryptoCurrent) * 100 : 0;
      return { key: `${h.name}-${h.account}`, name: h.name, account: h.account, value, weight };
    })
    .sort((a, b) => b.value - a.value);

  const actionsAllocation = actionsHoldings
    .map((h) => {
      const value = Number(h.currentValue) || 0;
      const weight =
        actionsCurrent > 0 ? (value / actionsCurrent) * 100 : 0;
      return {
        key: `${h.name}-${h.account}`,
        name: h.name,
        account: h.account,
        value,
        weight,
      };
    })
    .sort((a, b) => b.value - a.value);

  const totalBudgetFlux = budgetHoldings.reduce(
    (s, h) => s + (Number(h.amountInvested) || 0),
    0
  );

  const totalCredits = creditHoldings.reduce(
    (s, h) => s + (Number(h.currentValue) || 0),
    0
  );

  // ======= TRI / ORDRE =======
  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function getSortedHoldings() {
    const arr = [...holdings];
    if (!sortKey) return arr;
    const dir = sortDir === "asc" ? 1 : -1;
    return arr.sort((a, b) => {
      let av = a[sortKey] ?? "";
      let bv = b[sortKey] ?? "";
      av = String(av).toLowerCase();
      bv = String(bv).toLowerCase();
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }

  const displayedHoldings = getSortedHoldings();

  function moveHolding(id, direction) {
    setHoldings((prev) => {
      const arr = [...prev];
      const index = arr.findIndex((h) => h.id === id);
      if (index === -1) return prev;
      if (direction === "up" && index === 0) return prev;
      if (direction === "down" && index === arr.length - 1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const tmp = arr[index];
      arr[index] = arr[targetIndex];
      arr[targetIndex] = tmp;
      return arr;
    });
  }

  // ======= CRUD =======
  function handleNewHoldingChange(field, value) {
    setNewHolding((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddHolding(e, mode) {
    e.preventDefault();

    const rawQuantity = newHolding.quantity;
    const rawAvg = newHolding.avgBuyPrice;
    const quantity = rawQuantity
      ? parseFloat(String(rawQuantity).replace(",", "."))
      : null;
    const avg = rawAvg
      ? parseFloat(String(rawAvg).replace(",", "."))
      : null;

    const amountInvestedInput = newHolding.amountInvested
      ? parseFloat(
          String(newHolding.amountInvested).replace(",", ".")
        )
      : null;
    const currentValueInput = newHolding.currentValue
      ? parseFloat(
          String(newHolding.currentValue).replace(",", ".")
        )
      : null;

    if (!newHolding.name) {
      alert("Merci d’indiquer un nom.");
      return;
    }

    let category = newHolding.category;
    if (mode === "crypto") category = "Crypto";
    if (mode === "actions") category = "Actions";

    let pruCurrency = newHolding.pruCurrency || "EUR";

    let amountInvested = amountInvestedInput ?? 0;
    let currentValue = currentValueInput ?? 0;

    if (quantity && avg && category === "Crypto") {
      const factor = pruCurrency === "USDT" ? eurUsdtRate : 1;
      amountInvested = quantity * avg * factor;
    }

    const coingeckoId =
      category === "Crypto"
        ? newHolding.coingeckoId || guessCoingeckoId(newHolding.name)
        : null;

    const stockTicker =
      category === "Actions" ? newHolding.stockTicker || "" : null;

    const holding = {
      id: Date.now(),
      name: newHolding.name,
      account: newHolding.account || "",
      category,
      amountInvested: isNaN(amountInvested) ? 0 : amountInvested,
      currentValue: isNaN(currentValue) ? 0 : currentValue,
      currency: newHolding.currency || "EUR",
      quantity: quantity,
      avgBuyPrice: avg,
      pruCurrency,
      livePrice: null,
      coingeckoId,
      stockTicker,
    };

    setHoldings((prev) => [...prev, holding]);

    setNewHolding((prev) => ({
      ...prev,
      name: "",
      account: "",
      amountInvested: "",
      currentValue: "",
      quantity: "",
      avgBuyPrice: "",
      coingeckoId: "",
      stockTicker: "",
    }));
  }

  function updateHolding(id, field, value) {
    setHoldings((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const updated = { ...h };

        if (field === "amountInvested" || field === "currentValue") {
          updated[field] =
            value === ""
              ? 0
              : parseFloat(String(value).replace(",", ".")) || 0;
        } else if (field === "quantity" || field === "avgBuyPrice") {
          updated[field] =
            value === ""
              ? null
              : parseFloat(String(value).replace(",", ".")) || 0;

          if (updated.category === "Crypto" && updated.quantity && updated.avgBuyPrice) {
            const factor =
              (updated.pruCurrency || "EUR") === "USDT"
                ? eurUsdtRate
                : 1;
            updated.amountInvested =
              updated.quantity * updated.avgBuyPrice * factor;
          }
          if (updated.quantity && updated.livePrice) {
            updated.currentValue =
              updated.quantity * updated.livePrice;
          }
        } else if (field === "pruCurrency") {
          updated.pruCurrency =
            value === "" ? "EUR" : value;
          if (updated.category === "Crypto" && updated.quantity && updated.avgBuyPrice) {
            const factor =
              updated.pruCurrency === "USDT" ? eurUsdtRate : 1;
            updated.amountInvested =
              updated.quantity * updated.avgBuyPrice * factor;
          }
        } else if (field === "livePrice") {
          updated.livePrice =
            value === ""
              ? null
              : parseFloat(String(value).replace(",", ".")) || 0;
          if (updated.quantity && updated.livePrice) {
            updated.currentValue =
              updated.quantity * updated.livePrice;
          }
        } else {
          updated[field] = value;
        }

        return updated;
      })
    );
  }

  function deleteHolding(id) {
    if (!window.confirm("Supprimer cette ligne ?")) return;
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  }

  // ======= API CRYPTO =======
  async function refreshCryptoPrices() {
    const ids = Array.from(
      new Set(
        cryptoHoldings
          .map((h) => h.coingeckoId)
          .filter((id) => typeof id === "string" && id.length > 0)
      )
    );
    if (ids.length === 0) {
      alert(
        "Aucun id CoinGecko pour les cryptos. Vérifie les noms ou renseigne coingeckoId."
      );
      return;
    }

    setIsRefreshingCrypto(true);
    try {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?vs_currencies=eur&ids=" +
        ids.join(",");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur API CoinGecko");
      const data = await res.json();

      setHoldings((prev) =>
        prev.map((h) => {
          if (h.category !== "Crypto" || !h.coingeckoId) return h;
          const info = data[h.coingeckoId];
          if (!info || !info.eur) return h;
          const livePrice = info.eur;
          const updated = { ...h, livePrice };
          if (updated.quantity) {
            updated.currentValue = updated.quantity * livePrice;
          }
          return updated;
        })
      );
      setCryptoLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (e) {
      console.error(e);
      alert(
        "Impossible de récupérer les prix des cryptos. Tu peux continuer en manuel."
      );
    } finally {
      setIsRefreshingCrypto(false);
    }
  }

  // ======= API ACTIONS (Yahoo Finance, soumis à CORS) =======
  async function refreshStockPrices() {
    const tickers = Array.from(
      new Set(
        actionsHoldings
          .map((h) => h.stockTicker)
          .filter((t) => typeof t === "string" && t.length > 0)
      )
    );
    if (tickers.length === 0) {
      alert(
        "Aucun ticker renseigné pour les actions (ex : AI.PA pour Air Liquide)."
      );
      return;
    }

    setIsRefreshingStocks(true);
    try {
      const results = {};
      for (const t of tickers) {
        const url =
          "https://query1.finance.yahoo.com/v7/finance/quote?symbols=" + t;
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json();
        const quote = data.quoteResponse?.result?.[0];
        if (!quote || !quote.regularMarketPrice) continue;
        results[t] = {
          price: quote.regularMarketPrice,
          currency: quote.currency || "EUR",
        };
      }

      setHoldings((prev) =>
        prev.map((h) => {
          if (h.category !== "Actions" || !h.stockTicker) return h;
          const info = results[h.stockTicker];
          if (!info) return h;
          const livePrice = info.price;
          const updated = { ...h, livePrice };
          if (updated.quantity) {
            updated.currentValue = updated.quantity * livePrice;
          }
          return updated;
        })
      );
      setStockLastUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (e) {
      console.error(e);
      alert(
        "Impossible d’actualiser les cours des actions. Tu peux saisir le prix actuel à la main."
      );
    } finally {
      setIsRefreshingStocks(false);
    }
  }

  // ======= EXPORT / IMPORT JSON =======
  function handleExport() {
    try {
      const blob = new Blob([JSON.stringify(holdings, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `suivi-placements-${date}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Impossible d’exporter les données.");
    }
  }

  function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          alert("Fichier invalide : le contenu n’est pas une liste.");
          return;
        }
        if (
          !window.confirm(
            "Importer ces données va remplacer les données actuelles sur cet appareil. Continuer ?"
          )
        ) {
          return;
        }
        setHoldings(parsed);
      } catch (err) {
        console.error(err);
        alert(
          "Erreur lors de la lecture du fichier. Vérifie qu’il vient bien de l’export."
        );
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  // ======= CLASSES CSS =======
  const profitClassGlobal =
    "card-value " + (totalProfit >= 0 ? "profit-positive" : "profit-negative");
  const profitClassCrypto =
    "card-value " +
    (cryptoProfit >= 0 ? "profit-positive" : "profit-negative");
  const profitClassActions =
    "card-value " +
    (actionsProfit >= 0 ? "profit-positive" : "profit-negative");

  // ======= RENDER =======
  return (
    <div className="app-shell">
      <div className="app-container">
        {/* HEADER */}
        <header className="app-header">
          <div className="app-header-title">
            <span>📊</span>
            <span>Tableau de bord placements</span>
          </div>
          <div className="app-header-subtitle">
            Suivi manuel de ton patrimoine (placements, crypto, actions…).
            Données stockées uniquement dans ton navigateur.
          </div>

          <div className="tabs-row">
            <button
              className={
                "tab-btn " +
                (activeTab === "global" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("global")}
            >
              Patrimoine & investissements
            </button>

            <button
              className={
                "tab-btn " +
                (activeTab === "crypto" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("crypto")}
            >
              Crypto
            </button>

            <button
              className={
                "tab-btn " +
                (activeTab === "actions" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("actions")}
            >
              Actions
            </button>

            <button
              className={
                "tab-btn " +
                (activeTab === "budget" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("budget")}
            >
              Budget & fixes
            </button>

            <button
              className={
                "tab-btn " +
                (activeTab === "credits" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("credits")}
            >
              Crédits & leasing
            </button>
          </div>
        </header>

        {/* SAUVEGARDE LOCALE */}
        <div className="card">
          <div className="section-title-small">
            Sauvegarde locale (export / import)
          </div>
          <div className="section-subtitle-small">
            Utilise ces boutons pour transférer tes données d’un appareil à
            l’autre. L’export crée un fichier <code>.json</code> que tu peux
            envoyer sur ton téléphone (email, WhatsApp, Drive…), puis importer
            depuis l’app mobile.
          </div>
          <div className="backup-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExport}
            >
              💾 Exporter les données (JSON)
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() =>
                document.getElementById("import-json-input")?.click()
              }
            >
              📂 Importer un fichier
            </button>
            <input
              id="import-json-input"
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </div>
          <div className="helper-text">
            L’export / import fonctionne appareil par appareil. Les données
            ne sont pas partagées automatiquement entre ton PC et ton téléphone.
          </div>
        </div>

        {/* ======= ONGLET PATRIMOINE / INVESTISSEMENTS ======= */}
        {activeTab === "global" && (
          <>
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Montant investi (hors crypto / budget / crédits)</div>
                <div className="card-value">
                  {formatNumber(totalInvested)} <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Valeur actuelle</div>
                <div className="card-value">
                  {formatNumber(totalCurrent)} <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Performance globale</div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <div className={profitClassGlobal}>
                    {totalProfit >= 0 ? "+" : ""}
                    {formatNumber(totalProfit)} <span>€</span>
                  </div>
                  <span
                    className={
                      "badge " +
                      (totalProfit >= 0 ? "" : "badge-negative")
                    }
                  >
                    {totalProfit >= 0 ? "+" : ""}
                    {totalProfitPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="main-grid">
              {/* TABLEAU INVESTISSEMENTS */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-title">
                    Détail des investissements
                  </div>
                  <div className="card-header-subtitle">
                    Ne montre que les vraies briques de patrimoine (hors
                    crypto, budget & crédits). Tu peux trier et réorganiser les
                    lignes.
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("name")}
                        >
                          Nom{" "}
                          {sortKey === "name" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("account")}
                        >
                          Compte{" "}
                          {sortKey === "account" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          style={{ cursor: "pointer" }}
                          onClick={() => handleSort("category")}
                        >
                          Catégorie{" "}
                          {sortKey === "category" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th style={{ textAlign: "right" }}>Investi (€)</th>
                        <th style={{ textAlign: "right" }}>Valeur (€)</th>
                        <th style={{ textAlign: "right" }}>Perf.</th>
                        <th style={{ textAlign: "center" }}>Ordre</th>
                        <th style={{ textAlign: "center" }}>Suppr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedHoldings
                        .filter(
                          (h) =>
                            INVESTMENT_CATEGORIES.includes(h.category) &&
                            h.category !== "Crypto"
                        )
                        .map((h) => {
                          const localProfit = computeProfit(
                            h.currentValue,
                            h.amountInvested
                          );
                          const localProfitPct = computeProfitPercent(
                            h.currentValue,
                            h.amountInvested
                          );
                          const positive = localProfit >= 0;

                          return (
                            <tr key={h.id}>
                              <td>
                                <input
                                  className="input"
                                  value={h.name}
                                  onChange={(e) =>
                                    updateHolding(
                                      h.id,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <input
                                  className="input"
                                  value={h.account}
                                  onChange={(e) =>
                                    updateHolding(
                                      h.id,
                                      "account",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td>
                                <select
                                  className="select"
                                  value={h.category}
                                  onChange={(e) =>
                                    updateHolding(
                                      h.id,
                                      "category",
                                      e.target.value
                                    )
                                  }
                                >
                                  {CATEGORIES.map((cat) => (
                                    <option key={cat} value={cat}>
                                      {cat}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <input
                                  type="number"
                                  className="input input-number"
                                  value={h.amountInvested}
                                  onChange={(e) =>
                                    updateHolding(
                                      h.id,
                                      "amountInvested",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <input
                                  type="number"
                                  className="input input-number"
                                  value={h.currentValue}
                                  onChange={(e) =>
                                    updateHolding(
                                      h.id,
                                      "currentValue",
                                      e.target.value
                                    )
                                  }
                                />
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <div
                                  className={
                                    "profit-cell-main " +
                                    (positive
                                      ? "profit-positive"
                                      : "profit-negative")
                                  }
                                >
                                  {positive ? "+" : ""}
                                  {formatNumber(localProfit)} €
                                </div>
                                <div className="profit-cell-sub">
                                  {positive ? "+" : ""}
                                  {localProfitPct.toFixed(1)}%
                                </div>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  className="btn-icon"
                                  onClick={() =>
                                    moveHolding(h.id, "up")
                                  }
                                  title="Monter"
                                >
                                  ↑
                                </button>
                                <button
                                  className="btn-icon"
                                  onClick={() =>
                                    moveHolding(h.id, "down")
                                  }
                                  title="Descendre"
                                >
                                  ↓
                                </button>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <button
                                  className="btn-icon"
                                  onClick={() =>
                                    deleteHolding(h.id)
                                  }
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                      {displayedHoldings.filter(
                        (h) =>
                          INVESTMENT_CATEGORIES.includes(h.category) &&
                          h.category !== "Crypto"
                      ).length === 0 && (
                        <tr>
                          <td
                            colSpan={8}
                            style={{
                              textAlign: "center",
                              padding: 16,
                              fontSize: 12,
                              color: "#9ca3af",
                            }}
                          >
                            Aucune ligne d’investissement. Ajoute un
                            placement avec le formulaire.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ALLOCATION + FORM GLOBAL */}
              <div className="card">
                <div className="section-title-small">
                  Allocation par catégorie (investissements)
                </div>
                <div className="section-subtitle-small">
                  Basée sur la valeur actuelle des catégories d’investissement
                  uniquement.
                </div>
                <div style={{ marginBottom: 12 }}>
                  {allocationByCategory.length === 0 && (
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Renseigne au moins une valeur actuelle pour voir la
                      répartition.
                    </div>
                  )}
                  {allocationByCategory.map((a) => (
                    <div key={a.category} className="allocation-row">
                      <div className="allocation-header">
                        <span>{a.category}</span>
                        <span>
                          {a.weight.toFixed(1)}% ·{" "}
                          {formatNumber(a.value)} €
                        </span>
                      </div>
                      <div className="allocation-bar">
                        <div
                          className="allocation-bar-inner"
                          style={{ width: `${a.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="section-title-small">
                  Ajouter un investissement
                </div>
                <form onSubmit={(e) => handleAddHolding(e, "global")}>
                  <div className="form-grid">
                    <div>
                      <label className="label">Nom</label>
                      <input
                        className="input"
                        value={newHolding.name}
                        onChange={(e) =>
                          handleNewHoldingChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Compte</label>
                      <input
                        className="input"
                        value={newHolding.account}
                        onChange={(e) =>
                          handleNewHoldingChange("account", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">Catégorie</label>
                      <select
                        className="select"
                        value={newHolding.category}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "category",
                            e.target.value
                          )
                        }
                      >
                        {INVESTMENT_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Montant investi (€)</label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.amountInvested}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "amountInvested",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">Valeur actuelle (€)</label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.currentValue}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "currentValue",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Devise info</label>
                      <select
                        className="select"
                        value={newHolding.currency}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "currency",
                            e.target.value
                          )
                        }
                      >
                        <option value="EUR">EUR</option>
                        <option value="CHF">CHF</option>
                        <option value="USD">USD</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">
                    ➕ Ajouter l’investissement
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ======= ONGLET CRYPTO ======= */}
        {activeTab === "crypto" && (
          <>
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Montant investi (crypto)</div>
                <div className="card-value">
                  {formatNumber(cryptoInvested)} <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Valeur actuelle (crypto)</div>
                <div className="card-value">
                  {formatNumber(cryptoCurrent)} <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Perf portefeuille crypto</div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <div className={profitClassCrypto}>
                    {cryptoProfit >= 0 ? "+" : ""}
                    {formatNumber(cryptoProfit)} <span>€</span>
                  </div>
                  <span
                    className={
                      "badge " +
                      (cryptoProfit >= 0 ? "" : "badge-negative")
                    }
                  >
                    {cryptoProfit >= 0 ? "+" : ""}
                    {cryptoProfitPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 12 }}>
              <div className="section-title-small">
                Paramètres crypto (PRU & taux USDT)
              </div>
              <div className="section-subtitle-small">
                Tu peux saisir le PRU de tes cryptos en <b>EUR</b> ou en{" "}
                <b>USDT</b>. Le montant investi est recalculé automatiquement
                en euros avec ce taux :
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                <label className="label">
                  Taux EUR / USDT (1 USDT =&nbsp;
                  <input
                    type="number"
                    step="0.0001"
                    className="input input-number"
                    style={{ width: 90, display: "inline-block" }}
                    value={eurUsdtRate}
                    onChange={(e) =>
                      setEurUsdtRate(
                        parseFloat(
                          String(e.target.value).replace(",", ".")
                        ) || 0.93
                      )
                    }
                  />
                  &nbsp;€)
                </label>
              </div>
            </div>

            <div className="main-grid">
              {/* TABLEAU CRYPTO */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-title">Portefeuille crypto</div>
                  <div className="card-header-subtitle">
                    Qté + PRU (EUR ou USDT) → Investi en €. Clique sur
                    “Actualiser les prix” pour mettre à jour la valeur actuelle.
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 8,
                    marginBottom: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={refreshCryptoPrices}
                    disabled={isRefreshingCrypto}
                  >
                    {isRefreshingCrypto
                      ? "Mise à jour des prix…"
                      : "⟳ Actualiser les prix (API CoinGecko)"}
                  </button>
                  <span className="meta-text">
                    {cryptoLastUpdate
                      ? `Dernière mise à jour : ${cryptoLastUpdate}`
                      : "Pas encore de mise à jour des prix"}
                  </span>
                </div>

                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Crypto</th>
                        <th>Compte</th>
                        <th>Qté</th>
                        <th>PRU</th>
                        <th>Devise PRU</th>
                        <th style={{ textAlign: "right" }}>
                          Prix actuel (€)
                        </th>
                        <th style={{ textAlign: "right" }}>Investi (€)</th>
                        <th style={{ textAlign: "right" }}>Valeur (€)</th>
                        <th style={{ textAlign: "right" }}>Perf.</th>
                        <th style={{ textAlign: "center" }}>Ordre</th>
                        <th style={{ textAlign: "center" }}>Suppr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoHoldings.map((h) => {
                        const localProfit = computeProfit(
                          h.currentValue,
                          h.amountInvested
                        );
                        const localProfitPct = computeProfitPercent(
                          h.currentValue,
                          h.amountInvested
                        );
                        const positive = localProfit >= 0;

                        return (
                          <tr key={h.id}>
                            <td>
                              <input
                                className="input"
                                value={h.name}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="input"
                                value={h.account}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "account",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.quantity ?? ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.avgBuyPrice ?? ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "avgBuyPrice",
                                    e.target.value
                                  )
                                }
                                placeholder="PRU"
                              />
                            </td>
                            <td>
                              <select
                                className="select"
                                value={h.pruCurrency || "EUR"}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "pruCurrency",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="EUR">EUR</option>
                                <option value="USDT">USDT</option>
                              </select>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.livePrice ?? ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "livePrice",
                                    e.target.value
                                  )
                                }
                                placeholder="Prix act."
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.amountInvested}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "amountInvested",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.currentValue}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "currentValue",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div
                                className={
                                  "profit-cell-main " +
                                  (positive
                                    ? "profit-positive"
                                    : "profit-negative")
                                }
                              >
                                {positive ? "+" : ""}
                                {formatNumber(localProfit)} €
                              </div>
                              <div className="profit-cell-sub">
                                {positive ? "+" : ""}
                                {localProfitPct.toFixed(1)}%
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-icon"
                                onClick={() => moveHolding(h.id, "up")}
                                title="Monter"
                              >
                                ↑
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() =>
                                  moveHolding(h.id, "down")
                                }
                                title="Descendre"
                              >
                                ↓
                              </button>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-icon"
                                onClick={() => deleteHolding(h.id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {cryptoHoldings.length === 0 && (
                        <tr>
                          <td
                            colSpan={11}
                            style={{
                              textAlign: "center",
                              padding: 16,
                              fontSize: 12,
                              color: "#9ca3af",
                            }}
                          >
                            Aucune ligne crypto. Ajoute une crypto avec le
                            formulaire à droite.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ALLOCATION + FORM CRYPTO */}
              <div className="card">
                <div className="section-title-small">
                  Répartition de la poche crypto
                </div>
                <div className="section-subtitle-small">
                  Basée sur la valeur actuelle de chaque ligne crypto.
                </div>
                <div style={{ marginBottom: 12 }}>
                  {cryptoAllocation.length === 0 && (
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Ajoute au moins une crypto pour voir la répartition.
                    </div>
                  )}
                  {cryptoAllocation.map((a) => (
                    <div key={a.key} className="allocation-row">
                      <div className="allocation-header">
                        <span>
                          {a.name} ({a.account})
                        </span>
                        <span>
                          {a.weight.toFixed(1)}% ·{" "}
                          {formatNumber(a.value)} €
                        </span>
                      </div>
                      <div className="allocation-bar">
                        <div
                          className="allocation-bar-inner"
                          style={{ width: `${a.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="section-title-small">Ajouter une crypto</div>
                <form onSubmit={(e) => handleAddHolding(e, "crypto")}>
                  <div className="form-grid">
                    <div>
                      <label className="label">Nom (BTC, ETH…)</label>
                      <input
                        className="input"
                        value={newHolding.name}
                        onChange={(e) =>
                          handleNewHoldingChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Compte / plateforme</label>
                      <input
                        className="input"
                        value={newHolding.account}
                        onChange={(e) =>
                          handleNewHoldingChange("account", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">Quantité</label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.quantity}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "quantity",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">PRU</label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.avgBuyPrice}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "avgBuyPrice",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">Devise PRU</label>
                      <select
                        className="select"
                        value={newHolding.pruCurrency}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "pruCurrency",
                            e.target.value
                          )
                        }
                      >
                        <option value="EUR">EUR</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Id CoinGecko (optionnel)</label>
                      <input
                        className="input"
                        value={newHolding.coingeckoId}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "coingeckoId",
                            e.target.value
                          )
                        }
                        placeholder="bitcoin, ethereum…"
                      />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">
                    ➕ Ajouter la crypto
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ======= ONGLET ACTIONS ======= */}
        {activeTab === "actions" && (
          <>
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Montant investi (actions)</div>
                <div className="card-value">
                  {formatNumber(actionsInvested)} <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Valeur actuelle (actions)</div>
                <div className="card-value">
                  {formatNumber(actionsCurrent)} <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Perf portefeuille actions</div>
                <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                  <div className={profitClassActions}>
                    {actionsProfit >= 0 ? "+" : ""}
                    {formatNumber(actionsProfit)} <span>€</span>
                  </div>
                  <span
                    className={
                      "badge " +
                      (actionsProfit >= 0 ? "" : "badge-negative")
                    }
                  >
                    {actionsProfit >= 0 ? "+" : ""}
                    {actionsProfitPct.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 12 }}>
              <div className="section-title-small">
                Cours des actions (API Yahoo Finance)
              </div>
              <div className="section-subtitle-small">
                Pour Air Liquide, utilise le ticker <b>AI.PA</b>. Si l’API est
                bloquée par le navigateur, tu peux toujours saisir le cours
                manuellement.
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={refreshStockPrices}
                  disabled={isRefreshingStocks}
                >
                  {isRefreshingStocks
                    ? "Mise à jour des cours…"
                    : "⟳ Actualiser les cours (API Yahoo)"}
                </button>
                <span className="meta-text">
                  {stockLastUpdate
                    ? `Dernière mise à jour : ${stockLastUpdate}`
                    : "Pas encore de mise à jour des cours"}
                </span>
              </div>
            </div>

            <div className="main-grid">
              {/* TABLEAU ACTIONS */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-title">Portefeuille actions</div>
                  <div className="card-header-subtitle">
                    Même principe que la partie crypto, mais avec un ticker de
                    bourse (ex : AI.PA).
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Action</th>
                        <th>Compte</th>
                        <th>Ticker</th>
                        <th>Qté</th>
                        <th style={{ textAlign: "right" }}>PRU (€)</th>
                        <th style={{ textAlign: "right" }}>
                          Prix actuel (€)
                        </th>
                        <th style={{ textAlign: "right" }}>Investi (€)</th>
                        <th style={{ textAlign: "right" }}>Valeur (€)</th>
                        <th style={{ textAlign: "right" }}>Perf.</th>
                        <th style={{ textAlign: "center" }}>Ordre</th>
                        <th style={{ textAlign: "center" }}>Suppr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actionsHoldings.map((h) => {
                        const localProfit = computeProfit(
                          h.currentValue,
                          h.amountInvested
                        );
                        const localProfitPct = computeProfitPercent(
                          h.currentValue,
                          h.amountInvested
                        );
                        const positive = localProfit >= 0;

                        return (
                          <tr key={h.id}>
                            <td>
                              <input
                                className="input"
                                value={h.name}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "name",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="input"
                                value={h.account}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "account",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td>
                              <input
                                className="input"
                                value={h.stockTicker || ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "stockTicker",
                                    e.target.value
                                  )
                                }
                                placeholder="AI.PA"
                              />
                            </td>
                            <td>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.quantity ?? ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.avgBuyPrice ?? ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "avgBuyPrice",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.livePrice ?? ""}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "livePrice",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.amountInvested}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "amountInvested",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.currentValue}
                                onChange={(e) =>
                                  updateHolding(
                                    h.id,
                                    "currentValue",
                                    e.target.value
                                  )
                                }
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div
                                className={
                                  "profit-cell-main " +
                                  (positive
                                    ? "profit-positive"
                                    : "profit-negative")
                                }
                              >
                                {positive ? "+" : ""}
                                {formatNumber(localProfit)} €
                              </div>
                              <div className="profit-cell-sub">
                                {positive ? "+" : ""}
                                {localProfitPct.toFixed(1)}%
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-icon"
                                onClick={() => moveHolding(h.id, "up")}
                              >
                                ↑
                              </button>
                              <button
                                className="btn-icon"
                                onClick={() =>
                                  moveHolding(h.id, "down")
                                }
                              >
                                ↓
                              </button>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-icon"
                                onClick={() => deleteHolding(h.id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {actionsHoldings.length === 0 && (
                        <tr>
                          <td
                            colSpan={11}
                            style={{
                              textAlign: "center",
                              padding: 16,
                              fontSize: 12,
                              color: "#9ca3af",
                            }}
                          >
                            Aucune action. Ajoute Air Liquide ou d’autres avec
                            le formulaire.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ALLOCATION + FORM ACTIONS */}
              <div className="card">
                <div className="section-title-small">
                  Répartition de la poche actions
                </div>
                <div className="section-subtitle-small">
                  Basée sur la valeur actuelle de chaque ligne d’actions.
                </div>
                <div style={{ marginBottom: 12 }}>
                  {actionsAllocation.length === 0 && (
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Ajoute au moins une action pour voir la répartition.
                    </div>
                  )}
                  {actionsAllocation.map((a) => (
                    <div key={a.key} className="allocation-row">
                      <div className="allocation-header">
                        <span>
                          {a.name} ({a.account})
                        </span>
                        <span>
                          {a.weight.toFixed(1)}% ·{" "}
                          {formatNumber(a.value)} €
                        </span>
                      </div>
                      <div className="allocation-bar">
                        <div
                          className="allocation-bar-inner"
                          style={{ width: `${a.weight}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="section-title-small">Ajouter une action</div>
                <form onSubmit={(e) => handleAddHolding(e, "actions")}>
                  <div className="form-grid">
                    <div>
                      <label className="label">Nom (ex : Air Liquide)</label>
                      <input
                        className="input"
                        value={newHolding.name}
                        onChange={(e) =>
                          handleNewHoldingChange("name", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Compte</label>
                      <input
                        className="input"
                        value={newHolding.account}
                        onChange={(e) =>
                          handleNewHoldingChange("account", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">Ticker (ex : AI.PA)</label>
                      <input
                        className="input"
                        value={newHolding.stockTicker}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "stockTicker",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">Quantité</label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.quantity}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "quantity",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">PRU (€)</label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.avgBuyPrice}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "avgBuyPrice",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="label">
                        Valeur actuelle (€) (optionnel)
                      </label>
                      <input
                        className="input input-number"
                        type="number"
                        value={newHolding.currentValue}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "currentValue",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                  <button className="btn-primary" type="submit">
                    ➕ Ajouter l’action
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ======= ONGLET BUDGET & FIXES ======= */}
        {activeTab === "budget" && (
          <>
            <div className="card" style={{ marginTop: 12 }}>
              <div className="section-title-small">Budget & flux fixes</div>
              <div className="section-subtitle-small">
                Ici tu suis tes <b>salaires, revenus variés, charges fixes,
                abonnements…</b> Ces lignes ne sont pas prises en compte dans
                la performance de ton patrimoine.
              </div>
              <div style={{ marginTop: 6 }}>
                <span className="badge">
                  Total (revenus positifs + charges négatives)&nbsp;:&nbsp;
                  {formatNumber(totalBudgetFlux)} €
                </span>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Compte</th>
                      <th>Catégorie</th>
                      <th style={{ textAlign: "right" }}>Montant (€)</th>
                      <th style={{ textAlign: "center" }}>Ordre</th>
                      <th style={{ textAlign: "center" }}>Suppr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHoldings
                      .filter((h) => BUDGET_CATEGORIES.includes(h.category))
                      .map((h) => (
                        <tr key={h.id}>
                          <td>
                            <input
                              className="input"
                              value={h.name}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={h.account}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "account",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <select
                              className="select"
                              value={h.category}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "category",
                                  e.target.value
                                )
                              }
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              className="input input-number"
                              value={h.amountInvested}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "amountInvested",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-icon"
                              onClick={() => moveHolding(h.id, "up")}
                            >
                              ↑
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => moveHolding(h.id, "down")}
                            >
                              ↓
                            </button>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-icon"
                              onClick={() => deleteHolding(h.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}

                    {displayedHoldings.filter((h) =>
                      BUDGET_CATEGORIES.includes(h.category)
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: 16,
                            fontSize: 12,
                            color: "#9ca3af",
                          }}
                        >
                          Aucune ligne de budget. Tu peux ajouter un salaire,
                          une charge ou un abonnement en choisissant la
                          catégorie correspondante dans les autres onglets ou
                          via l’import JSON.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ======= ONGLET CREDITS & LEASING ======= */}
        {activeTab === "credits" && (
          <>
            <div className="card" style={{ marginTop: 12 }}>
              <div className="section-title-small">Crédits & leasing</div>
              <div className="section-subtitle-small">
                Suivi de ton <b>crédit immobilier, crédits conso, leasing
                voiture…</b> Ces lignes sont visibles ici mais n’entrent pas
                dans la performance de ton patrimoine.
              </div>
              <div style={{ marginTop: 6 }}>
                <span className="badge">
                  Total des capitaux / encours&nbsp;:&nbsp;
                  {formatNumber(totalCredits)} €
                </span>
              </div>
            </div>

            <div className="card">
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Compte</th>
                      <th>Catégorie</th>
                      <th style={{ textAlign: "right" }}>Montant (€)</th>
                      <th style={{ textAlign: "right" }}>
                        Capital / Valeur (€)
                      </th>
                      <th style={{ textAlign: "center" }}>Ordre</th>
                      <th style={{ textAlign: "center" }}>Suppr.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHoldings
                      .filter((h) =>
                        CREDIT_CATEGORIES.includes(h.category)
                      )
                      .map((h) => (
                        <tr key={h.id}>
                          <td>
                            <input
                              className="input"
                              value={h.name}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              className="input"
                              value={h.account}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "account",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td>
                            <select
                              className="select"
                              value={h.category}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "category",
                                  e.target.value
                                )
                              }
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              className="input input-number"
                              value={h.amountInvested}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "amountInvested",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <input
                              type="number"
                              className="input input-number"
                              value={h.currentValue}
                              onChange={(e) =>
                                updateHolding(
                                  h.id,
                                  "currentValue",
                                  e.target.value
                                )
                              }
                            />
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-icon"
                              onClick={() => moveHolding(h.id, "up")}
                            >
                              ↑
                            </button>
                            <button
                              className="btn-icon"
                              onClick={() => moveHolding(h.id, "down")}
                            >
                              ↓
                            </button>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <button
                              className="btn-icon"
                              onClick={() => deleteHolding(h.id)}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}

                    {displayedHoldings.filter((h) =>
                      CREDIT_CATEGORIES.includes(h.category)
                    ).length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          style={{
                            textAlign: "center",
                            padding: 16,
                            fontSize: 12,
                            color: "#9ca3af",
                          }}
                        >
                          Aucun crédit ou leasing pour l’instant. Tu peux les
                          ajouter en changeant la catégorie d’une ligne
                          existante (par exemple "Crédit immo", "Leasing",
                          etc.).
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
