// src/components/AllocationBlock.jsx
import { formatNumber } from "../utils";

export default function AllocationBlock({
  title,
  subtitle,
  allocations,
  emptyText,
}) {
  return (
    <div>
      <div className="section-title-small">{title}</div>
      <div className="section-subtitle-small">{subtitle}</div>
      <div style={{ marginBottom: 12 }}>
        {allocations.length === 0 && (
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{emptyText}</div>
        )}
        {allocations.map((a) => (
          <div key={a.key ?? a.category} className="allocation-row">
            <div className="allocation-header">
              <span>{a.label ?? a.category}</span>
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
