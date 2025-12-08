// src/components/Tabs.jsx
export default function Tabs({ activeTab, onChange }) {
  const tabs = [
    { id: "global", label: "Patrimoine & investissements" },
    { id: "crypto", label: "Crypto" },
    { id: "actions", label: "Actions" },
    { id: "budget", label: "Budget & fixes" },
    { id: "credits", label: "Crédits & leasing" },
  ];

  return (
    <div className="tabs-row">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={
            "tab-btn " + (activeTab === tab.id ? "tab-btn-active" : "")
          }
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
