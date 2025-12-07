// src/components/ActionsTab.jsx
import {
  formatNumber,
  computeProfit,
  computeProfitPercent,
} from "../utils";
import AllocationBlock from "./AllocationBlock";

export default function ActionsTab({
  actionsHoldings,
  actionsInvested,
  actionsCurrent,
  actionsProfit,
  actionsProfitPct,
  actionsAllocation,
  newHolding,
  onNewHoldingChange,
  onAddAction,
  onUpdateHolding,
  onMoveHolding,
  onDeleteHolding,
  refreshStockPrices,
  isRefreshingStocks,
  stockLastUpdate,
  profitClassActions,
  sortKey,
}) {
  return (
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
                "badge " + (actionsProfit >= 0 ? "" : "badge-negative")
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
              Même principe que la partie crypto, mais avec un ticker de bourse
              (ex : AI.PA).
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
                  <th style={{ textAlign: "right" }}>Prix actuel (€)</th>
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
                          className="input"
                          value={h.stockTicker || ""}
                          onChange={(e) =>
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                            onUpdateHolding(
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
                          disabled={!!sortKey}
                        >
                          ↑
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onMoveHolding(h.id, "down")}
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
                      Aucune action. Ajoute Air Liquide ou d’autres avec le
                      formulaire.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALLOCATION + FORM ACTIONS */}
        <div className="card">
          <AllocationBlock
            title="Répartition de la poche actions"
            subtitle="Basée sur la valeur actuelle de chaque ligne d’actions."
            allocations={actionsAllocation.map((a) => ({
              ...a,
              label: `${a.name} (${a.account})`,
            }))}
            emptyText="Ajoute au moins une action pour voir la répartition."
          />

          <div className="section-title-small">Ajouter une action</div>
          <form onSubmit={onAddAction}>
            <div className="form-grid">
              <div>
                <label className="label">Nom (ex : Air Liquide)</label>
                <input
                  className="input"
                  value={newHolding.name}
                  onChange={(e) =>
                    onNewHoldingChange("name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">Compte</label>
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
                <label className="label">Ticker (ex : AI.PA)</label>
                <input
                  className="input"
                  value={newHolding.stockTicker}
                  onChange={(e) =>
                    onNewHoldingChange("stockTicker", e.target.value)
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
                    onNewHoldingChange("quantity", e.target.value)
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
                    onNewHoldingChange("avgBuyPrice", e.target.value)
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
                    onNewHoldingChange("currentValue", e.target.value)
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
  );
}
