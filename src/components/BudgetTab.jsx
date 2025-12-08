// src/components/BudgetTab.jsx
import { BUDGET_CATEGORIES, CATEGORIES } from "../constants";
import { formatNumber, convertCurrency } from "../utils";

export default function BudgetTab({
  displayedHoldings,
  chfEurRate,
  setChfEurRate,
  updateHolding,
  moveHolding,
  deleteHolding,
}) {
  const budgetHoldings = displayedHoldings.filter((h) =>
    BUDGET_CATEGORIES.includes(h.category)
  );

  const totalBudgetFlux = budgetHoldings.reduce(
    (s, h) => s + convertCurrency(h.amountInvested, h.currency, chfEurRate),
    0
  );

  return (
    <>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="section-title-small">Budget & flux fixes</div>
        <div className="section-subtitle-small">
          Ici tu suis tes <b>salaires, revenus variés, charges fixes,
          abonnements…</b> Ces lignes ne sont pas prises en compte dans la
          performance de ton patrimoine.
        </div>
        <div style={{ marginTop: 6 }}>
          <span className="badge">
            Total (revenus positifs + charges négatives)&nbsp;:&nbsp;
            {formatNumber(totalBudgetFlux)} €
          </span>
        </div>
        <div style={{ marginTop: 8 }}>
          <label className="label">
            1 CHF =&nbsp;
            <input
              type="number"
              className="input input-number"
              style={{ width: 90, display: "inline-block" }}
              value={chfEurRate}
              onChange={(e) =>
                setChfEurRate(
                  parseFloat(String(e.target.value).replace(",", ".")) || 1.0
                )
              }
            />
            &nbsp;€
          </label>
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
                <th style={{ textAlign: "right" }}>Montant</th>
                <th>Devise</th>
                <th style={{ textAlign: "right" }}>Montant en €</th>
                <th style={{ textAlign: "center" }}>Ordre</th>
                <th style={{ textAlign: "center" }}>Suppr.</th>
              </tr>
            </thead>
            <tbody>
              {budgetHoldings.map((h) => (
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
                        updateHolding(h.id, "account", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      className="select"
                      value={h.category}
                      onChange={(e) =>
                        updateHolding(h.id, "category", e.target.value)
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
                  <td>
                    <select
                      className="select"
                      value={h.currency || "EUR"}
                      onChange={(e) =>
                        updateHolding(h.id, "currency", e.target.value)
                      }
                    >
                      <option value="EUR">EUR</option>
                      <option value="CHF">CHF</option>
                    </select>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {formatNumber(
                      convertCurrency(h.amountInvested, h.currency, chfEurRate)
                    )}{" "}
                    €
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

              {budgetHoldings.length === 0 && (
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
                    Aucune ligne de budget. Tu peux ajouter un salaire, une
                    charge ou un abonnement en choisissant la catégorie
                    correspondante dans les autres onglets ou via l’import
                    JSON.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
