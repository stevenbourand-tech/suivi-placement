// src/components/CryptoTab.jsx
import {
  formatNumber,
  computeProfit,
  computeProfitPercent,
} from "../utils";
import AllocationBlock from "./AllocationBlock";

export default function CryptoTab({
  cryptoHoldings,
  cryptoInvested,
  cryptoCurrent,
  cryptoProfit,
  cryptoProfitPct,
  cryptoAllocation,
  eurUsdtRate,
  setEurUsdtRate,
  newHolding,
  onNewHoldingChange,
  onAddCrypto,
  onUpdateHolding,
  onMoveHolding,
  onDeleteHolding,
  refreshCryptoPrices,
  isRefreshingCrypto,
  cryptoLastUpdate,
  profitClassCrypto,
  sortKey,
}) {
  return (
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
                "badge " + (cryptoProfit >= 0 ? "" : "badge-negative")
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
          <b>USDT</b>. Le montant investi est recalculé automatiquement en
          euros avec ce taux :
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
                  parseFloat(String(e.target.value).replace(",", ".")) ||
                    0.86
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
                  <th style={{ textAlign: "right" }}>Prix actuel (€)</th>
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
                            onUpdateHolding(h.id, "name", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          value={h.account}
                          onChange={(e) =>
                            onUpdateHolding(h.id, "account", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input input-number"
                          type="number"
                          value={h.quantity ?? ""}
                          onChange={(e) =>
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            (positive ? "profit-positive" : "profit-negative")
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
                          onClick={() => onMoveHolding(h.id, "up")}
                          title="Monter"
                          disabled={!!sortKey}
                        >
                          ↑
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onMoveHolding(h.id, "down")}
                          title="Descendre"
                          disabled={!!sortKey}
                        >
                          ↓
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          className="btn-icon"
                          onClick={() => onDeleteHolding(h.id)}
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
                      Aucune ligne crypto. Ajoute une crypto avec le formulaire
                      à droite.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALLOCATION + FORM CRYPTO */}
        <div className="card">
          <AllocationBlock
            title="Répartition de la poche crypto"
            subtitle="Basée sur la valeur actuelle de chaque ligne crypto."
            allocations={cryptoAllocation.map((a) => ({
              ...a,
              label: `${a.name} (${a.account})`,
            }))}
            emptyText="Ajoute au moins une crypto pour voir la répartition."
          />

          <div className="section-title-small">Ajouter une crypto</div>
          <form onSubmit={onAddCrypto}>
            <div className="form-grid">
              <div>
                <label className="label">Nom (BTC, ETH…)</label>
                <input
                  className="input"
                  value={newHolding.name}
                  onChange={(e) =>
                    onNewHoldingChange("name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">Compte / plateforme</label>
                <input
                  className="input"
                  value={newHolding.account}
                  onChange={(e) =>
                    onNewHoldingChange("account", e.target.value)
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
                    onNewHoldingChange("quantity", e.target.value)
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
                    onNewHoldingChange("avgBuyPrice", e.target.value)
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
                    onNewHoldingChange("pruCurrency", e.target.value)
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
                    onNewHoldingChange("coingeckoId", e.target.value)
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
  );
}
