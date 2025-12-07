// src/components/InvestmentsTab.jsx
import {
  INVESTMENT_CATEGORIES,
  CATEGORIES,
} from "../constants";
import {
  formatNumber,
  computeProfit,
  computeProfitPercent,
} from "../utils";
import AllocationBlock from "./AllocationBlock";

export default function InvestmentsTab({
  totalInvested,
  totalCurrent,
  totalProfit,
  totalProfitPct,
  allocationByCategory,
  displayedHoldings,
  newHolding,
  onNewHoldingChange,
  onAddInvestment,
  onUpdateHolding,
  onMoveHolding,
  onDeleteHolding,
  sortKey,
  profitClassGlobal,
}) {
  const filteredHoldings = displayedHoldings.filter(
    (h) =>
      INVESTMENT_CATEGORIES.includes(h.category) && h.category !== "Crypto"
  );

  return (
    <>
      <div className="stats-grid">
        <div className="card">
          <div className="card-title">
            Montant investi (hors crypto / budget / crédits)
          </div>
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
                "badge " + (totalProfit >= 0 ? "" : "badge-negative")
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
              Ne montre que les vraies briques de patrimoine (hors crypto,
              budget & crédits). Tu peux trier et réorganiser les lignes.
            </div>
          </div>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => onUpdateHolding("__sort__", "name")}
                  >
                    Nom{" "}
                    {sortKey === "name" &&
                      (/* direction gérée dans App */ true ? "" : "")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => onUpdateHolding("__sort__", "account")}
                  >
                    Compte{" "}
                    {sortKey === "account" &&
                      (/* direction gérée dans App */ true ? "" : "")}
                  </th>
                  <th
                    style={{ cursor: "pointer" }}
                    onClick={() => onUpdateHolding("__sort__", "category")}
                  >
                    Catégorie{" "}
                    {sortKey === "category" &&
                      (/* direction gérée dans App */ true ? "" : "")}
                  </th>
                  <th style={{ textAlign: "right" }}>Investi (€)</th>
                  <th style={{ textAlign: "right" }}>Valeur (€)</th>
                  <th style={{ textAlign: "right" }}>Perf.</th>
                  <th style={{ textAlign: "center" }}>Ordre</th>
                  <th style={{ textAlign: "center" }}>Suppr.</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((h) => {
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
                        <select
                          className="select"
                          value={h.category}
                          onChange={(e) =>
                            onUpdateHolding(h.id, "category", e.target.value)
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
                          type="number"
                          className="input input-number"
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
                        >
                          ↑
                        </button>
                        <button
                          className="btn-icon"
                          onClick={() => onMoveHolding(h.id, "down")}
                          title="Descendre"
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

                {filteredHoldings.length === 0 && (
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
                      Aucune ligne d’investissement. Ajoute un placement avec le
                      formulaire.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ALLOCATION + FORM GLOBAL */}
        <div className="card">
          <AllocationBlock
            title="Allocation par catégorie (investissements)"
            subtitle="Basée sur la valeur actuelle des catégories d’investissement uniquement."
            allocations={allocationByCategory.map((a) => ({
              ...a,
              label: a.category,
            }))}
            emptyText="Renseigne au moins une valeur actuelle pour voir la répartition."
          />

          <div className="section-title-small">Ajouter un investissement</div>
          <form onSubmit={onAddInvestment}>
            <div className="form-grid">
              <div>
                <label className="label">Nom</label>
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
                <label className="label">Catégorie</label>
                <select
                  className="select"
                  value={newHolding.category}
                  onChange={(e) =>
                    onNewHoldingChange("category", e.target.value)
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
                    onNewHoldingChange("amountInvested", e.target.value)
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
                    onNewHoldingChange("currentValue", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">Devise info</label>
                <select
                  className="select"
                  value={newHolding.currency}
                  onChange={(e) =>
                    onNewHoldingChange("currency", e.target.value)
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
  );
}
