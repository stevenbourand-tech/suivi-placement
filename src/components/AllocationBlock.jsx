// src/components/AllocationBlock.jsx
import { formatNumber } from "../utils";

export default function AllocationBlock({ title, subtitle, allocations }) {
  return (
    <div>
      <div className="section-title-small">{title}</div>
      {subtitle && (
        <div className="section-subtitle-small" style={{ marginBottom: 4 }}>
          {subtitle}
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        {allocations.length === 0 && (
          <div style={{ fontSize: 11, color: "#9ca3af" }}>
            Renseigne au moins une valeur actuelle pour voir la répartition.
          </div>
        )}
        {allocations.map((a) => (
          <div key={a.key || a.category} className="allocation-row">
            <div className="allocation-header">
              <span>{a.label || a.category}</span>
              <span>
                {a.weight.toFixed(1)}% · {formatNumber(a.value)} €
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
    </div>
  );
}
