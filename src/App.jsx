// src/App.jsx
import { useEffect, useState, useMemo, useCallback } from "react";
import "./App.css";

import {
  STORAGE_KEY,
  FX_STORAGE_KEY,
  INVESTMENT_CATEGORIES,
  EXCLUDED_CATEGORIES,
  DEFAULT_HOLDINGS,
} from "./constants";

import {
  computeProfit,
  computeProfitPercent,
  convertCurrency,
  convertHoldingValueToEur,
  guessCoingeckoId,
} from "./utils";

import Tabs from "./components/Tabs";
import SavePanel from "./components/SavePanel";
import InvestmentsTab from "./components/InvestmentsTab";
import CryptoTab from "./components/CryptoTab";
import ActionsTab from "./components/ActionsTab";
import BudgetTab from "./components/BudgetTab";
import CreditsTab from "./components/CreditsTab";

export default function App() {
  const [holdings, setHoldings] = useState(DEFAULT_HOLDINGS);
  const [activeTab, setActiveTab] = useState("global");
  const [eurUsdtRate, setEurUsdtRate] = useState(0.86);
  const [chfEurRate, setChfEurRate] = useState(1.05);
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

  // ======= LOCALSTORAGE : holdings =======
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

  // ======= LOCALSTORAGE : FX =======
  useEffect(() => {
    try {
      const savedFx = localStorage.getItem(FX_STORAGE_KEY);
      if (savedFx) {
        const parsed = JSON.parse(savedFx);
        if (parsed.eurUsdtRate) setEurUsdtRate(parsed.eurUsdtRate);
        if (parsed.chfEurRate) setChfEurRate(parsed.chfEurRate);
      }
    } catch (e) {
      console.error("Erreur lecture FX localStorage", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        FX_STORAGE_KEY,
        JSON.stringify({ eurUsdtRate, chfEurRate })
      );
    } catch (e) {
      console.error("Erreur écriture FX localStorage", e);
    }
  }, [eurUsdtRate, chfEurRate]);

  // ======= DERIVÉS GLOBAUX (useMemo) =======
  const derived = useMemo(() => {
    const cryptoHoldings = holdings.filter((h) => h.category === "Crypto");
    const actionsHoldings = holdings.filter((h) => h.category === "Actions");
    const budgetHoldings = holdings.filter((h) =>
      EXCLUDED_CATEGORIES.includes(h.category) &&
      !["Crédit", "Crédit immo", "Crédit immobilier", "Crédit conso", "Leasing", "Prêt", "Autre crédit"].includes(
        h.category
      )
    );
    const creditHoldings = holdings.filter((h) =>
      ["Crédit", "Crédit immo", "Crédit immobilier", "Crédit conso", "Leasing", "Prêt", "Autre crédit"].includes(
        h.category
      )
    );

    const totalInvested = holdings.reduce((sum, h) => {
      if (EXCLUDED_CATEGORIES.includes(h.category)) return sum;
      if (h.category === "Crypto") return sum;
      return sum + convertHoldingValueToEur(h, h.amountInvested, chfEurRate);
    }, 0);

    const totalCurrent = holdings.reduce((sum, h) => {
      if (EXCLUDED_CATEGORIES.includes(h.category)) return sum;
      if (h.category === "Crypto") return sum;
      return sum + convertHoldingValueToEur(h, h.currentValue, chfEurRate);
    }, 0);

    const totalProfit = computeProfit(totalCurrent, totalInvested);
    const totalProfitPct = computeProfitPercent(totalCurrent, totalInvested);

    const cryptoInvested = cryptoHoldings.reduce(
      (s, h) => s + (Number(h.amountInvested) || 0),
      0
    );
    const cryptoCurrent = cryptoHoldings.reduce(
      (s, h) => s + (Number(h.currentValue) || 0),
      0
    );
    const cryptoProfit = computeProfit(cryptoCurrent, cryptoInvested);
    const cryptoProfitPct = computeProfitPercent(
      cryptoCurrent,
      cryptoInvested
    );

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
        .reduce(
          (sum, h) =>
            sum + convertHoldingValueToEur(h, h.currentValue, chfEurRate),
          0
        );
      const weight = totalCurrent > 0 ? (value / totalCurrent) * 100 : 0;
      return { category: cat, value, weight };
    }).filter((a) => a.value > 0);

    const cryptoAllocation = cryptoHoldings
      .map((h) => {
        const value = Number(h.currentValue) || 0;
        const weight = cryptoCurrent > 0 ? (value / cryptoCurrent) * 100 : 0;
        return {
          key: `${h.name}-${h.account}`,
          name: h.name,
          account: h.account,
          value,
          weight,
        };
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
      (s, h) =>
        s + convertCurrency(h.amountInvested, h.currency, chfEurRate),
      0
    );

    const totalCredits = creditHoldings.reduce(
      (s, h) => s + (Number(h.currentValue) || 0),
      0
    );

    return {
      cryptoHoldings,
      actionsHoldings,
      budgetHoldings,
      creditHoldings,
      totalInvested,
      totalCurrent,
      totalProfit,
      totalProfitPct,
      cryptoInvested,
      cryptoCurrent,
      cryptoProfit,
      cryptoProfitPct,
      actionsInvested,
      actionsCurrent,
      actionsProfit,
      actionsProfitPct,
      allocationByCategory,
      cryptoAllocation,
      actionsAllocation,
      totalBudgetFlux,
      totalCredits,
    };
  }, [holdings, chfEurRate]);

  const {
    cryptoHoldings,
    actionsHoldings,
    totalInvested,
    totalCurrent,
    totalProfit,
    totalProfitPct,
    cryptoInvested,
    cryptoCurrent,
    cryptoProfit,
    cryptoProfitPct,
    actionsInvested,
    actionsCurrent,
    actionsProfit,
    actionsProfitPct,
    allocationByCategory,
    cryptoAllocation,
    actionsAllocation,
    totalBudgetFlux,
    totalCredits,
  } = derived;

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
    if (sortKey) return; // on bloque le déplacement si tri actif

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

  const handleAddHolding = useCallback(
    (e, mode) => {
      e.preventDefault();

      if (!newHolding.name.trim()) {
        alert("Merci d’indiquer un nom.");
        return;
      }

      const parseNum = (val) =>
        val !== "" && val !== null && val !== undefined
          ? parseFloat(String(val).replace(",", "."))
          : null;

      const quantity = parseNum(newHolding.quantity);
      const avg = parseNum(newHolding.avgBuyPrice);
      const amountInvestedInput = parseNum(newHolding.amountInvested);
      const currentValueInput = parseNum(newHolding.currentValue);

      let category = newHolding.category;
      if (mode === "crypto") category = "Crypto";
      if (mode === "actions") category = "Actions";

      let pruCurrency = newHolding.pruCurrency || "EUR";

      let amountInvested = amountInvestedInput ?? 0;
      let currentValue = currentValueInput ?? 0;

      if (quantity && avg && category === "Crypto") {
        const factor = pruCurrency === "USDT" ? eurUsdtRate : 1;
        amountInvested = quantity * avg * factor;
        if (!currentValue) currentValue = amountInvested;
      }

      const coingeckoId =
        category === "Crypto"
          ? newHolding.coingeckoId || guessCoingeckoId(newHolding.name)
          : null;

      const stockTicker =
        category === "Actions" ? newHolding.stockTicker || "" : null;

      const holding = {
        id: Date.now(),
        name: newHolding.name.trim(),
        account: newHolding.account || "",
        category,
        amountInvested: isNaN(amountInvested) ? 0 : amountInvested,
        currentValue: isNaN(currentValue) ? 0 : currentValue,
        currency: newHolding.currency || "EUR",
        quantity,
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
    },
    [newHolding, eurUsdtRate]
  );

  function updateHolding(id, field, value) {
    if (id === "__sort__") {
      handleSort(value);
      return;
    }

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

          if (
            updated.category === "Crypto" &&
            updated.quantity &&
            updated.avgBuyPrice
          ) {
            const factor =
              (updated.pruCurrency || "EUR") === "USDT"
                ? eurUsdtRate
                : 1;
            updated.amountInvested =
              updated.quantity * updated.avgBuyPrice * factor;
          }
          if (updated.quantity && updated.livePrice) {
            updated.currentValue = updated.quantity * updated.livePrice;
          }
        } else if (field === "pruCurrency") {
          updated.pruCurrency = value === "" ? "EUR" : value;
          if (
            updated.category === "Crypto" &&
            updated.quantity &&
            updated.avgBuyPrice
          ) {
            const factor = updated.pruCurrency === "USDT" ? eurUsdtRate : 1;
            updated.amountInvested =
              updated.quantity * updated.avgBuyPrice * factor;
          }
        } else if (field === "livePrice") {
          updated.livePrice =
            value === ""
              ? null
              : parseFloat(String(value).replace(",", ".")) || 0;
          if (updated.quantity && updated.livePrice) {
            updated.currentValue = updated.quantity * updated.livePrice;
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

  // ======= API ACTIONS (Yahoo Finance) =======
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

          <Tabs activeTab={activeTab} onChange={setActiveTab} />
        </header>

        {/* SAUVEGARDE */}
        <SavePanel onExport={handleExport} onImport={handleImport} />

        {/* ONGLETS */}
        {activeTab === "global" && (
          <InvestmentsTab
            totalInvested={totalInvested}
            totalCurrent={totalCurrent}
            totalProfit={totalProfit}
            totalProfitPct={totalProfitPct}
            allocationByCategory={allocationByCategory}
            displayedHoldings={displayedHoldings}
            newHolding={newHolding}
            onNewHoldingChange={handleNewHoldingChange}
            onAddInvestment={(e) => handleAddHolding(e, "global")}
            onUpdateHolding={updateHolding}
            onMoveHolding={moveHolding}
            onDeleteHolding={deleteHolding}
            sortKey={sortKey}
            profitClassGlobal={profitClassGlobal}
          />
        )}

        {activeTab === "crypto" && (
          <CryptoTab
            cryptoHoldings={cryptoHoldings}
            cryptoInvested={cryptoInvested}
            cryptoCurrent={cryptoCurrent}
            cryptoProfit={cryptoProfit}
            cryptoProfitPct={cryptoProfitPct}
            cryptoAllocation={cryptoAllocation}
            eurUsdtRate={eurUsdtRate}
            setEurUsdtRate={setEurUsdtRate}
            newHolding={newHolding}
            onNewHoldingChange={handleNewHoldingChange}
            onAddCrypto={(e) => handleAddHolding(e, "crypto")}
            onUpdateHolding={updateHolding}
            onMoveHolding={moveHolding}
            onDeleteHolding={deleteHolding}
            refreshCryptoPrices={refreshCryptoPrices}
            isRefreshingCrypto={isRefreshingCrypto}
            cryptoLastUpdate={cryptoLastUpdate}
            profitClassCrypto={profitClassCrypto}
            sortKey={sortKey}
          />
        )}

        {activeTab === "actions" && (
          <ActionsTab
            actionsHoldings={actionsHoldings}
            actionsInvested={actionsInvested}
            actionsCurrent={actionsCurrent}
            actionsProfit={actionsProfit}
            actionsProfitPct={actionsProfitPct}
            actionsAllocation={actionsAllocation}
            newHolding={newHolding}
            onNewHoldingChange={handleNewHoldingChange}
            onAddAction={(e) => handleAddHolding(e, "actions")}
            onUpdateHolding={updateHolding}
            onMoveHolding={moveHolding}
            onDeleteHolding={deleteHolding}
            refreshStockPrices={refreshStockPrices}
            isRefreshingStocks={isRefreshingStocks}
            stockLastUpdate={stockLastUpdate}
            profitClassActions={profitClassActions}
            sortKey={sortKey}
          />
        )}

        {activeTab === "budget" && (
          <BudgetTab
            displayedHoldings={displayedHoldings}
            chfEurRate={chfEurRate}
            setChfEurRate={setChfEurRate}
            totalBudgetFlux={derived.totalBudgetFlux}
            onUpdateHolding={updateHolding}
            onMoveHolding={moveHolding}
            onDeleteHolding={deleteHolding}
            sortKey={sortKey}
          />
        )}

        {activeTab === "credits" && (
          <CreditsTab
            displayedHoldings={displayedHoldings}
            totalCredits={totalCredits}
            onUpdateHolding={updateHolding}
            onMoveHolding={moveHolding}
            onDeleteHolding={deleteHolding}
            sortKey={sortKey}
          />
        )}
      </div>
    </div>
  );
}
