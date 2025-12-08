// src/App.jsx
import { useEffect, useState } from "react";
import {
  STORAGE_KEY,
  DEFAULT_HOLDINGS,
  CATEGORIES,
} from "./constants";
import { guessCoingeckoId } from "./utils";

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
    const avg = rawAvg ? parseFloat(String(rawAvg).replace(",", ".")) : null;

    const amountInvestedInput = newHolding.amountInvested
      ? parseFloat(String(newHolding.amountInvested).replace(",", "."))
      : null;
    const currentValueInput = newHolding.currentValue
      ? parseFloat(String(newHolding.currentValue).replace(",", "."))
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

          if (
            updated.category === "Crypto" &&
            updated.quantity &&
            updated.avgBuyPrice
          ) {
            const factor =
              (updated.pruCurrency || "EUR") === "USDT" ? eurUsdtRate : 1;
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
    const cryptoHoldings = holdings.filter((h) => h.category === "Crypto");
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

  // ======= API ACTIONS =======
  async function refreshStockPrices() {
    const actionsHoldings = holdings.filter((h) => h.category === "Actions");
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

  // ======= FILTRES PAR POCHES =======
  const cryptoHoldings = holdings.filter((h) => h.category === "Crypto");
  const actionsHoldings = holdings.filter((h) => h.category === "Actions");

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

        {/* SAUVEGARDE LOCALE */}
        <SavePanel onExport={handleExport} onImport={handleImport} />

        {/* ONGLET PATRIMOINE */}
        {activeTab === "global" && (
          <InvestmentsTab
            holdings={holdings}
            displayedHoldings={displayedHoldings}
            chfEurRate={chfEurRate}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            moveHolding={moveHolding}
            deleteHolding={deleteHolding}
            updateHolding={updateHolding}
            newHolding={newHolding}
            onNewHoldingChange={handleNewHoldingChange}
            onAddHolding={handleAddHolding}
          />
        )}

        {/* ONGLET CRYPTO */}
        {activeTab === "crypto" && (
          <CryptoTab
            cryptoHoldings={cryptoHoldings}
            eurUsdtRate={eurUsdtRate}
            setEurUsdtRate={setEurUsdtRate}
            refreshCryptoPrices={refreshCryptoPrices}
            isRefreshingCrypto={isRefreshingCrypto}
            cryptoLastUpdate={cryptoLastUpdate}
            moveHolding={moveHolding}
            deleteHolding={deleteHolding}
            updateHolding={updateHolding}
            newHolding={newHolding}
            onNewHoldingChange={handleNewHoldingChange}
            onAddHolding={handleAddHolding}
          />
        )}

        {/* ONGLET ACTIONS */}
        {activeTab === "actions" && (
          <ActionsTab
            actionsHoldings={actionsHoldings}
            moveHolding={moveHolding}
            deleteHolding={deleteHolding}
            updateHolding={updateHolding}
            newHolding={newHolding}
            onNewHoldingChange={handleNewHoldingChange}
            onAddHolding={handleAddHolding}
            refreshStockPrices={refreshStockPrices}
            isRefreshingStocks={isRefreshingStocks}
            stockLastUpdate={stockLastUpdate}
          />
        )}

        {/* ONGLET BUDGET */}
        {activeTab === "budget" && (
          <BudgetTab
            displayedHoldings={displayedHoldings}
            chfEurRate={chfEurRate}
            setChfEurRate={setChfEurRate}
            updateHolding={updateHolding}
            moveHolding={moveHolding}
            deleteHolding={deleteHolding}
          />
        )}

        {/* ONGLET CREDITS */}
        {activeTab === "credits" && (
          <CreditsTab
            displayedHoldings={displayedHoldings}
            updateHolding={updateHolding}
            moveHolding={moveHolding}
            deleteHolding={deleteHolding}
          />
        )}
      </div>
    </div>
  );
}
