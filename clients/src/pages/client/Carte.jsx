import { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import api from "../../services/api";
import { MapPin, Search, Star, Wallet, CheckCircle, XCircle } from "lucide-react";

export default function Carte() {
  const [prestataires, setPrestataires] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/prestataires")
      .then(({ data }) => setPrestataires(data.prestataires || []))
      .catch(() => setPrestataires([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = prestataires.filter((prestataire) => {
    const user = prestataire.user || {};
    const ville = prestataire.zoneGeographique?.ville || "";
    const label = `${user.prenom || ""} ${user.nom || ""} ${ville}`.toLowerCase();
    return label.includes(search.toLowerCase());
  });

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">
        <div className="dashboard-header">
          <h1 className="dashboard-greeting">Prestataires <span>par zone</span></h1>
          <p className="dashboard-subtitle">
            Version liste géographique, prête à évoluer vers une carte interactive.
          </p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ position: "relative" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
            />
            <input
              className="form-input"
              placeholder="Rechercher par nom ou ville..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <div className="empty-state">
              <div className="empty-state-icon"><MapPin size={28} /></div>
              <p className="empty-state-title">Aucun prestataire trouvé</p>
            </div>
          </div>
        ) : (
          <div className="demandes-grid">
            {filtered.map((prestataire) => {
              const user = prestataire.user || {};
              return (
                <div key={prestataire._id} className="demande-card prest-style">
                  <div className="demande-card-header">
                    <div>
                      <div className="demande-card-title">
                        {user.prenom} {user.nom}
                      </div>
                      <div className="demande-card-cat">
                        {prestataire.categories?.[0] || "Service"}
                      </div>
                    </div>
                    <span className={prestataire.disponible ? "badge badge-success" : "badge badge-danger"}>
                      {prestataire.disponible ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {prestataire.disponible ? "Disponible" : "Indisponible"}
                    </span>
                  </div>

                  <p className="demande-card-body">
                    {prestataire.description || "Prestataire SmartMatch disponible selon sa zone géographique."}
                  </p>

                  <div className="demande-card-footer">
                    <div className="demande-card-meta-row">
                      <span className="demande-card-meta">
                        <MapPin size={12} />
                        {prestataire.zoneGeographique?.ville || "Ville non précisée"}
                      </span>
                      <span className="demande-card-meta">
                        <Star size={12} />
                        {prestataire.notemoyenne || 0}/5
                      </span>
                      <span className="demande-card-meta">
                        <Wallet size={12} />
                        {prestataire.tarifMin || 0} - {prestataire.tarifMax || 0} MAD
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
