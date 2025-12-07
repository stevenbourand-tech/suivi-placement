// src/components/SavePanel.jsx

export default function SavePanel({ onExport, onImport }) {
  return (
    <div className="card">
      <div className="section-title-small">
        Sauvegarde locale (export / import)
      </div>
      <div className="section-subtitle-small">
        Utilise ces boutons pour transférer tes données d’un appareil à
        l’autre. L’export crée un fichier <code>.json</code> que tu peux
        envoyer sur ton téléphone (email, WhatsApp, Drive…), puis importer
        depuis l’app mobile.
      </div>
      <div className="backup-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={onExport}
        >
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
          onChange={onImport}
        />
      </div>
      <div className="helper-text">
        L’export / import fonctionne appareil par appareil. Les données ne
        sont pas partagées automatiquement entre ton PC et ton téléphone.
      </div>
    </div>
  );
}
