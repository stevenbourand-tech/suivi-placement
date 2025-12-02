import { useState, useEffect } from "react";

const STORAGE_KEY = "portfolio-holdings-steven-simple";

const CATEGORIES = [
  "Liquidités",
  "ETF",
  "Actions",
  "Assurance-vie",
  "PEA / CTO",
  "Crypto",
  "Immobilier",
  "Autre",
];

// Gabarit de cryptos à pré-remplir
const CRYPTO_TEMPLATES = [
  { name: "BTC", account: "Bitstack", coingeckoId: "bitcoin" },
  { name: "BTC", account: "Portefeuille crypto", coingeckoId: "bitcoin" },
  { name: "ETH", account: "Portefeuille crypto", coingeckoId: "ethereum" },
  { name: "SOL", account: "Portefeuille crypto", coingeckoId: "solana" },
  { name: "LINK", account: "Portefeuille crypto", coingeckoId: "chainlink" },
  { name: "AVAX", account: "Portefeuille crypto", coingeckoId: "avalanche-2" },
  { name: "ATOM", account: "Portefeuille crypto", coingeckoId: "cosmos" },
  {
    name: "INJ",
    account: "Portefeuille crypto",
    coingeckoId: "injective-protocol",
  },
  { name: "USDT", account: "Portefeuille crypto", coingeckoId: "tether" },
];

const DEFAULT_HOLDINGS = [
  {
    id: 1,
    name: "Livret A",
    account: "Banque principale",
    category: "Liquidités",
    amountInvested: 14000,
    currentValue: 14000,
    currency: "EUR",
  },
  {
    id: 2,
    name: "ETF Monde",
    account: "PEA / CTO",
    category: "ETF",
    amountInvested: 10000,
    currentValue: 11200,
    currency: "EUR",
  },
  {
    id: 3,
    name: "BTC",
    account: "Plateforme crypto",
    category: "Crypto",
    amountInvested: 1900,
    currentValue: 2600,
    currency: "EUR",
    quantity: null,
    avgBuyPrice: null,
    livePrice: null,
    coingeckoId: "bitcoin",
  },
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
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
  const [activeTab, setActiveTab] = useState("global"); // "global" ou "crypto"
  const [newHolding, setNewHolding] = useState({
    name: "",
    account: "",
    category: "Liquidités",
    amountInvested: "",
    currentValue: "",
    currency: "EUR",
    quantity: "",
    avgBuyPrice: "",
    coingeckoId: "",
  });
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);

  // Chargement depuis localStorage
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHoldings(parsed);
        }
      }
    } catch (e) {
      console.error("Erreur de lecture du stockage local", e);
    }
  }, []);

  // Sauvegarde dans localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings));
    } catch (e) {
      console.error("Erreur d'écriture du stockage local", e);
    }
  }, [holdings]);

  // Quand on passe sur l’onglet crypto, on force la catégorie du formulaire sur "Crypto"
  useEffect(() => {
    if (activeTab === "crypto") {
      setNewHolding((prev) => ({ ...prev, category: "Crypto" }));
    }
  }, [activeTab]);

  // Stats globales
  const totalInvested = holdings.reduce(
    (sum, h) => sum + (Number(h.amountInvested) || 0),
    0
  );
  const totalCurrent = holdings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );
  const profit = totalCurrent - totalInvested;
  const profitPercent = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

  // Crypto uniquement
  const cryptoHoldings = holdings.filter((h) => h.category === "Crypto");
  const cryptoInvested = cryptoHoldings.reduce(
    (sum, h) => sum + (Number(h.amountInvested) || 0),
    0
  );
  const cryptoCurrent = cryptoHoldings.reduce(
    (sum, h) => sum + (Number(h.currentValue) || 0),
    0
  );
  const cryptoProfit = cryptoCurrent - cryptoInvested;
  const cryptoProfitPercent =
    cryptoInvested > 0 ? (cryptoProfit / cryptoInvested) * 100 : 0;

  const allocationByCategory = CATEGORIES.map((cat) => {
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
      return { name: h.name, account: h.account, value, weight };
    })
    .sort((a, b) => b.value - a.value);

  function handleNewHoldingChange(field, value) {
    setNewHolding((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddHolding(e) {
    e.preventDefault();
    const amountInvested = parseFloat(
      String(newHolding.amountInvested).replace(",", ".")
    );
    const currentValue = parseFloat(
      String(newHolding.currentValue).replace(",", ".")
    );
    const quantity = newHolding.quantity
      ? parseFloat(String(newHolding.quantity).replace(",", "."))
      : null;
    const avgBuyPrice = newHolding.avgBuyPrice
      ? parseFloat(String(newHolding.avgBuyPrice).replace(",", "."))
      : null;

    if (!newHolding.name) {
      alert("Merci de renseigner au minimum le nom.");
      return;
    }

    let finalAmountInvested = amountInvested;
    if (newHolding.category === "Crypto" && quantity && avgBuyPrice) {
      finalAmountInvested = quantity * avgBuyPrice;
    }

    let finalCurrentValue = isNaN(currentValue) ? 0 : currentValue;

    const coingeckoId =
      newHolding.coingeckoId ||
      (newHolding.category === "Crypto"
        ? guessCoingeckoId(newHolding.name)
        : null);

    const holding = {
      id: Date.now(),
      name: newHolding.name,
      account: newHolding.account || "",
      category: newHolding.category,
      amountInvested: isNaN(finalAmountInvested) ? 0 : finalAmountInvested,
      currentValue: finalCurrentValue,
      currency: newHolding.currency || "EUR",
      quantity: quantity || null,
      avgBuyPrice: avgBuyPrice || null,
      livePrice: null,
      coingeckoId,
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
    }));
  }

  function updateHolding(id, field, value) {
    setHoldings((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        let updated = { ...h };

        if (field === "amountInvested" || field === "currentValue") {
          updated[field] =
            parseFloat(String(value).replace(",", ".")) || 0;
        } else if (field === "quantity" || field === "avgBuyPrice") {
          updated[field] =
            value === "" ? null : parseFloat(String(value).replace(",", "."));
          if (updated.category === "Crypto") {
            if (updated.quantity && updated.avgBuyPrice) {
              updated.amountInvested =
                updated.quantity * updated.avgBuyPrice;
            }
            if (updated.quantity && updated.livePrice) {
              updated.currentValue = updated.quantity * updated.livePrice;
            }
          }
        } else if (field === "livePrice") {
          updated.livePrice =
            value === "" ? null : parseFloat(String(value).replace(",", "."));
          if (updated.category === "Crypto" && updated.quantity && updated.livePrice) {
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

  function addCryptoTemplates() {
    setHoldings((prev) => {
      const already = new Set(
        prev
          .filter((h) => h.category === "Crypto")
          .map((h) => `${h.name}-${h.account}`)
      );

      const now = [...prev];
      CRYPTO_TEMPLATES.forEach((tpl) => {
        const key = `${tpl.name}-${tpl.account}`;
        if (!already.has(key)) {
          now.push({
            id: Date.now() + Math.random(),
            name: tpl.name,
            account: tpl.account,
            category: "Crypto",
            amountInvested: 0,
            currentValue: 0,
            currency: "EUR",
            quantity: null,
            avgBuyPrice: null,
            livePrice: null,
            coingeckoId: tpl.coingeckoId,
          });
        }
      });
      return now;
    });
  }

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
        "Aucun id CoinGecko trouvé. Vérifie les noms de tes cryptos ou ajoute-les via le gabarit."
      );
      return;
    }

    setIsRefreshingPrices(true);
    try {
      const url =
        "https://api.coingecko.com/api/v3/simple/price?vs_currencies=eur&ids=" +
        ids.join(",");
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erreur API prix");
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
      setLastPriceUpdate(new Date().toLocaleTimeString("fr-FR"));
    } catch (e) {
      console.error(e);
      alert(
        "Impossible de récupérer les prix (API). Réessaie plus tard ou vérifie ta connexion."
      );
    } finally {
      setIsRefreshingPrices(false);
    }
  }

  // EXPORT : télécharge un fichier JSON de tes données
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

  // IMPORT : charge un fichier JSON et remplace les données locales
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
        alert("Erreur lors de la lecture du fichier. Vérifie qu’il vient bien de l’export.");
      } finally {
        event.target.value = "";
      }
    };
    reader.readAsText(file);
  }

  const profitClassGlobal =
    "card-value " + (profit >= 0 ? "profit-positive" : "profit-negative");
  const profitClassCrypto =
    "card-value " +
    (cryptoProfit >= 0 ? "profit-positive" : "profit-negative");

  return (
    <div className="app-shell">
      <div className="app-container">
        {/* HEADER */}
        <header className="app-header">
          <div className="app-header-title">
            <span>📊</span>
            <span>Tableau de bord patrimoine</span>
          </div>
          <div className="app-header-subtitle">
            Suivi manuel de tes placements (assurance-vie, PEA/CTO, crypto,
            immobilier, liquidités, etc.). Les données restent uniquement dans
            le navigateur de chaque appareil (localStorage).
          </div>

          {/* Onglets */}
          <div className="tabs-row">
            <button
              type="button"
              className={
                "tab-btn " + (activeTab === "global" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("global")}
            >
              Patrimoine global
            </button>
            <button
              type="button"
              className={
                "tab-btn " + (activeTab === "crypto" ? "tab-btn-active" : "")
              }
              onClick={() => setActiveTab("crypto")}
            >
              Crypto
            </button>
          </div>
        </header>

        {/* SAUVEGARDE LOCALE */}
        <div className="card">
          <div className="section-title-small">Sauvegarde locale (export / import)</div>
          <div className="section-subtitle-small">
            Utilise ces boutons pour transférer tes données d’un appareil à
            l’autre. L’export crée un fichier <code>.json</code> que tu peux
            envoyer sur ton téléphone (email, WhatsApp, Drive…), puis importer
            depuis l’app mobile.
          </div>
          <div className="backup-actions">
            <button type="button" className="btn-secondary" onClick={handleExport}>
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

        {/* CONTENU GLOBAL */}
        {activeTab === "global" && (
          <>
            {/* STATS GLOBAL */}
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Montant investi</div>
                <div className="card-value">
                  {formatNumber(totalInvested)}
                  <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Valeur actuelle</div>
                <div className="card-value">
                  {formatNumber(totalCurrent)}
                  <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Performance globale</div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <div className={profitClassGlobal}>
                    {profit >= 0 ? "+" : ""}
                    {formatNumber(Math.round(profit))}
                    <span>€</span>
                  </div>
                  <span
                    className={
                      "badge " + (profit >= 0 ? "" : "badge-negative")
                    }
                  >
                    {profit >= 0 ? "+" : ""}
                    {profitPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* MAIN GRID GLOBAL */}
            <div className="main-grid">
              {/* TABLEAU DES PLACEMENTS */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-title">Détail des placements</div>
                  <div className="card-header-subtitle">
                    Tu peux modifier les montants directement dans le tableau.
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Compte</th>
                        <th>Catégorie</th>
                        <th style={{ textAlign: "right" }}>Investi (€)</th>
                        <th style={{ textAlign: "right" }}>Valeur (€)</th>
                        <th style={{ textAlign: "right" }}>Perf.</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.length === 0 && (
                        <tr>
                          <td
                            colSpan={7}
                            style={{
                              textAlign: "center",
                              padding: 16,
                              fontSize: 11,
                              color: "#9ca3af",
                            }}
                          >
                            Aucune ligne pour l’instant. Ajoute un placement
                            avec le formulaire à droite.
                          </td>
                        </tr>
                      )}
                      {holdings.map((h) => {
                        const localProfit =
                          (Number(h.currentValue) || 0) -
                          (Number(h.amountInvested) || 0);
                        const localProfitPct =
                          (Number(h.amountInvested) || 0) > 0
                            ? (localProfit / Number(h.amountInvested)) * 100
                            : 0;
                        const positive = localProfit >= 0;
                        return (
                          <tr key={h.id}>
                            <td>
                              <input
                                className="input"
                                value={h.name}
                                onChange={(e) =>
                                  updateHolding(h.id, "name", e.target.value)
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
                                {formatNumber(Math.round(localProfit))} €
                              </div>
                              <div className="profit-cell-sub">
                                {positive ? "+" : ""}
                                {localProfitPct.toFixed(1)}%
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-icon"
                                title="Supprimer"
                                onClick={() => deleteHolding(h.id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ALLOCATION + FORM GLOBAL */}
              <div className="card">
                <div className="section-title-small">
                  Allocation par catégorie
                </div>
                <div className="section-subtitle-small">
                  Basée sur la valeur actuelle de chaque ligne.
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
                          {formatNumber(Math.round(a.value))} €
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

                <div className="section-title-small">Ajouter un placement</div>
                <div className="section-subtitle-small">
                  Crée une ligne par enveloppe (PEA, AV, crypto…) ou par actif
                  détaillé.
                </div>

                <form onSubmit={handleAddHolding}>
                  <div className="form-grid">
                    <div>
                      <label className="label">Nom du placement</label>
                      <input
                        className="input"
                        value={newHolding.name}
                        onChange={(e) =>
                          handleNewHoldingChange("name", e.target.value)
                        }
                        placeholder="Ex : Linxea Spirit 2, PEA Bourse Direct, BTC…"
                      />
                    </div>
                    <div>
                      <label className="label">Compte / support</label>
                      <input
                        className="input"
                        value={newHolding.account}
                        onChange={(e) =>
                          handleNewHoldingChange("account", e.target.value)
                        }
                        placeholder="Ex : Crédit Agricole, Bourse Direct, Binance…"
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
                          handleNewHoldingChange("category", e.target.value)
                        }
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label">Devise (info)</label>
                      <select
                        className="select"
                        value={newHolding.currency}
                        onChange={(e) =>
                          handleNewHoldingChange("currency", e.target.value)
                        }
                      >
                        <option value="EUR">EUR</option>
                        <option value="CHF">CHF</option>
                        <option value="USD">USD</option>
                        <option value="Autre">Autre</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ marginTop: 6 }}>
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
                        placeholder="Ex : 10000"
                      />
                    </div>
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
                        placeholder="Ex : 11200"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    ➕ Ajouter la ligne
                  </button>
                  <div className="helper-text">
                    Astuce : commence par recréer tes grandes enveloppes (PEA,
                    assurance-vie, crypto, projet Bali, Blast, etc.).
                  </div>
                </form>
              </div>
            </div>
          </>
        )}

        {/* CONTENU CRYPTO */}
        {activeTab === "crypto" && (
          <>
            {/* STATS CRYPTO + toolbar */}
            <div className="stats-grid">
              <div className="card">
                <div className="card-title">Montant investi (crypto)</div>
                <div className="card-value">
                  {formatNumber(cryptoInvested)}
                  <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Valeur actuelle (crypto)</div>
                <div className="card-value">
                  {formatNumber(cryptoCurrent)}
                  <span>€</span>
                </div>
              </div>
              <div className="card">
                <div className="card-title">Perf. portefeuille crypto</div>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <div className={profitClassCrypto}>
                    {cryptoProfit >= 0 ? "+" : ""}
                    {formatNumber(Math.round(cryptoProfit))}
                    <span>€</span>
                  </div>
                  <span
                    className={
                      "badge " + (cryptoProfit >= 0 ? "" : "badge-negative")
                    }
                  >
                    {cryptoProfit >= 0 ? "+" : ""}
                    {cryptoProfitPercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="toolbar">
              <button
                type="button"
                className="btn-secondary"
                onClick={addCryptoTemplates}
              >
                ➕ Pré-remplir mes cryptos (BTC, ETH, SOL, AVAX, ATOM, INJ, LINK, USDT…)
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={refreshCryptoPrices}
                  disabled={isRefreshingPrices}
                >
                  {isRefreshingPrices
                    ? "Mise à jour des prix…"
                    : "⟳ Actualiser les prix (API)"}
                </button>
                <span className="meta-text">
                  {lastPriceUpdate
                    ? `Dernière mise à jour : ${lastPriceUpdate}`
                    : "Pas encore de mise à jour des prix"}
                </span>
              </div>
            </div>

            {/* GRID CRYPTO */}
            <div className="main-grid">
              {/* TABLEAU CRYPTO */}
              <div className="card">
                <div className="card-header">
                  <div className="card-header-title">Portefeuille crypto</div>
                  <div className="card-header-subtitle">
                    Seules les lignes avec la catégorie “Crypto” apparaissent
                    ici. Tu peux saisir la quantité et ton prix moyen pour
                    chaque coin.
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Crypto</th>
                        <th>Plateforme</th>
                        <th>Qté</th>
                        <th style={{ textAlign: "right" }}>Prix moyen (€)</th>
                        <th style={{ textAlign: "right" }}>Prix actuel (€)</th>
                        <th style={{ textAlign: "right" }}>Investi (€)</th>
                        <th style={{ textAlign: "right" }}>Valeur (€)</th>
                        <th style={{ textAlign: "right" }}>Perf.</th>
                        <th style={{ textAlign: "center" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cryptoHoldings.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            style={{
                              textAlign: "center",
                              padding: 16,
                              fontSize: 11,
                              color: "#9ca3af",
                            }}
                          >
                            Aucune ligne crypto pour l’instant. Utilise le
                            bouton ci-dessus pour pré-remplir ton portefeuille,
                            puis indique quantité et prix moyen.
                          </td>
                        </tr>
                      )}
                      {cryptoHoldings.map((h) => {
                        const localProfit =
                          (Number(h.currentValue) || 0) -
                          (Number(h.amountInvested) || 0);
                        const localProfitPct =
                          (Number(h.amountInvested) || 0) > 0
                            ? (localProfit / Number(h.amountInvested)) * 100
                            : 0;
                        const positive = localProfit >= 0;
                        return (
                          <tr key={h.id}>
                            <td>
                              <input
                                className="input"
                                value={h.name}
                                onChange={(e) =>
                                  updateHolding(h.id, "name", e.target.value)
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
                                placeholder="Ex : Bitstack, Binance, Swissborg…"
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
                                placeholder="Qté"
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
                                placeholder="Prix moy."
                              />
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <input
                                className="input input-number"
                                type="number"
                                value={h.livePrice != null ? h.livePrice : ""}
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
                                {formatNumber(Math.round(localProfit))} €
                              </div>
                              <div className="profit-cell-sub">
                                {positive ? "+" : ""}
                                {localProfitPct.toFixed(1)}%
                              </div>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                className="btn-icon"
                                title="Supprimer"
                                onClick={() => deleteHolding(h.id)}
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ALLOCATION CRYPTO + FORMULAIRE CRYPTO */}
              <div className="card">
                <div className="section-title-small">
                  Répartition à l’intérieur de la poche crypto
                </div>
                <div className="section-subtitle-small">
                  Basée uniquement sur la valeur actuelle de tes positions
                  crypto.
                </div>

                <div style={{ marginBottom: 12 }}>
                  {cryptoAllocation.length === 0 && (
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Ajoute au moins une ligne crypto pour voir la
                      répartition.
                    </div>
                  )}
                  {cryptoAllocation.map((a, index) => (
                    <div
                      key={`${a.name}-${a.account}-${index}`}
                      className="allocation-row"
                    >
                      <div className="allocation-header">
                        <span>
                          {a.name} ({a.account})
                        </span>
                        <span>
                          {a.weight.toFixed(1)}% ·{" "}
                          {formatNumber(Math.round(a.value))} €
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
                <div className="section-subtitle-small">
                  Tu peux suivre BTC, ETH, SOL, AVAX, INJ, ATOM, LINK, USDT,
                  etc. Si tu connais la quantité et ton prix moyen d’achat,
                  renseigne-les : le montant investi sera recalculé
                  automatiquement.
                </div>

                <form onSubmit={handleAddHolding}>
                  <div className="form-grid">
                    <div>
                      <label className="label">Nom de la crypto</label>
                      <input
                        className="input"
                        value={newHolding.name}
                        onChange={(e) =>
                          handleNewHoldingChange("name", e.target.value)
                        }
                        placeholder="Ex : BTC, ETH, SOL…"
                      />
                    </div>
                    <div>
                      <label className="label">Plateforme</label>
                      <input
                        className="input"
                        value={newHolding.account}
                        onChange={(e) =>
                          handleNewHoldingChange("account", e.target.value)
                        }
                        placeholder="Ex : Bitstack, Binance, Swissborg…"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">Catégorie</label>
                      <input
                        className="input"
                        value="Crypto"
                        disabled
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="label">
                        Id CoinGecko (optionnel)
                      </label>
                      <input
                        className="input"
                        value={newHolding.coingeckoId}
                        onChange={(e) =>
                          handleNewHoldingChange(
                            "coingeckoId",
                            e.target.value
                          )
                        }
                        placeholder="Ex : bitcoin, ethereum…"
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
                          handleNewHoldingChange("quantity", e.target.value)
                        }
                        placeholder="Ex : 0.5"
                      />
                    </div>
                    <div>
                      <label className="label">Prix moyen (€)</label>
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
                        placeholder="Ex : 25000"
                      />
                    </div>
                  </div>

                  <div className="form-grid-2" style={{ marginTop: 6 }}>
                    <div>
                      <label className="label">
                        Montant investi (€) (facultatif)
                      </label>
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
                        placeholder="Sinon calculé depuis Qté x Prix moyen"
                      />
                    </div>
                    <div>
                      <label className="label">
                        Valeur actuelle (€) (facultatif)
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
                        placeholder="Sinon calculée depuis l’API"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    ➕ Ajouter la crypto
                  </button>
                  <div className="helper-text">
                    Ensuite, clique sur “Actualiser les prix (API)” pour
                    mettre à jour la valeur de ton portefeuille à partir des
                    cours du marché.
                  </div>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
