// src/components/CreditsTab.jsx
import {
  CREDIT_CATEGORIES,
  CATEGORIES,
} from "../constants";
import { formatNumber } from "../utils";

export default function CreditsTab({
  displayedHoldings,
  totalCredits,
  onUpdateHolding,
  onMoveHolding,
  onDeleteHolding,
  sortKey,
}) {
  const rows = displayedHoldings.filter((h) =>
    CREDIT_CATEGORIES.includes(h.category)
  );

  return (
    <>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="section-title-small">Crédits & leasing</div>
        <div className="section-subtitle-small">
          Suivi de ton <b>crédit immobilier, crédits conso, leasing
          voiture…</b> Ces lignes sont visibles ici mais n’entrent pas dans la
          performance de ton patrimoine.
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
                <th style={{ textAlign: "right" }}>Capital / Valeur (€)</th>
                <th style={{ textAlign: "center" }}>Ordre</th>
                <th style={{ textAlign: "center" }}>Suppr.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
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
              ))}

              {rows.length === 0 && (
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
                    Aucun crédit ou leasing pour l’instant. Tu peux les ajouter
                    en changeant la catégorie d’une ligne existante (par
                    exemple "Crédit immo", "Leasing", etc.).
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
