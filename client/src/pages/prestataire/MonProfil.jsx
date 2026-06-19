import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, Plus, X, CheckCircle, Clock } from 'lucide-react';
import { geocoderVille } from '../../utils/geocoder';
const CATEGORIES = [
  'Plomberie', 'Électricité', 'Informatique', 'Jardinage',
  'Peinture', 'Maçonnerie', 'Menuiserie', 'Climatisation',
  'Déménagement', 'Nettoyage', 'Cuisine', 'Autre',
];

const MonProfil = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    description: '', competences: [], categories: [],
    tarifMin: '', tarifMax: '', ville: '',
    region: '', rayon: 20, experience: '',
  });
  const [disponible, setDisponible] = useState(true);
  const [newComp,    setNewComp]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [profil, setProfil] = useState(null);
  const [coordonnees, setCoordonnees] = useState(null);
  useEffect(() => {
    setLoading(true);
    api.get('/prestataires/moi')
      .then(async ({ data }) => {
        const p = data.prestataire;
        setProfil(p);
        const ville  = p.zoneGeographique?.ville  || '';
        const region = p.zoneGeographique?.region || '';
        setForm({
          description: p.description || '',
          competences: p.competences || [],
          categories:  p.categories  || [],
          tarifMin:    p.tarifMin    || '',
          tarifMax:    p.tarifMax    || '',
          ville,
          region,
          rayon:       p.zoneGeographique?.rayon  || 20,
          experience:  p.experience || '',
        });
        setDisponible(p.disponible);

        const lat = p.zoneGeographique?.coordonnees?.lat;
        const lng = p.zoneGeographique?.coordonnees?.lng;
        if (lat && lng) {
          setCoordonnees({ lat, lng });
        } else if (ville.trim().length >= 3) {
          const coords = await geocoderVille(ville, region);
          if (coords) setCoordonnees(coords);
        }
      })
      .catch(() => toast.error('Erreur chargement profil'))
      .finally(() => setLoading(false));
  }, []);

  const toggleCategorie = (cat) => {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter((c) => c !== cat)
        : [...f.categories, cat],
    }));
  };

  const addCompetence = () => {
    if (!newComp.trim()) return;
    setForm((f) => ({ ...f, competences: [...f.competences, newComp.trim()] }));
    setNewComp('');
  };

  const removeCompetence = (i) => {
    setForm((f) => ({ ...f, competences: f.competences.filter((_, idx) => idx !== i) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/prestataires/profil', {
  ...form,
  ...(coordonnees && {
    coordonneesLat: coordonnees.lat,
    coordonneesLng: coordonnees.lng,
  }),
});
      await api.put('/prestataires/disponibilite', { disponible });
      toast.success('Profil mis à jour !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };
  const handleLocalisationChange = async (e) => {
  const { name, value } = e.target;
  setForm({ ...form, [name]: value });
  if (name === 'ville' || name === 'region') {
    const ville  = name === 'ville'  ? value : form.ville;
    const region = name === 'region' ? value : form.region;
    if (ville.trim().length >= 3) {
      const coords = await geocoderVille(ville, region);
      setCoordonnees(coords);
    } else {
      setCoordonnees(null);
    }
  }
};

  if (loading) {
    return (
      <div className="layout">
        <Navbar />
        <div className="page-content">
          <div className="empty-state">
            <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content mon-profil-page">


        <div className="profil-header">
          <div className="profil-avatar">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="profil-info">
  <h2>
    {user?.prenom} {user?.nom}
    {disponible !== undefined && profil?.user?.isVerified && (
      <span className="profil-status-badge verified">
        <CheckCircle size={13} /> Compte vérifié
      </span>
    )}
    {!profil?.user?.isVerified && (
      <span className="profil-status-badge pending">
        <Clock size={13} /> En attente de vérification
      </span>
    )}
  </h2>
  <p>{user?.email}</p>
</div>
        </div>

        <form onSubmit={handleSave} className="form-page mon-profil-form">


          <div className="card profil-availability-card">
            <div className="profil-availability-content">
              <div>
                <h3>Disponibilité</h3>
                <p>
                  Activez pour recevoir des demandes de clients
                </p>
              </div>
              <div className="toggle-wrap">
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={disponible}
                    onChange={(e) => setDisponible(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                </label>
                <span className="toggle-label">
                  {disponible ? 'Disponible' : 'Indisponible'}
                </span>
              </div>
            </div>
          </div>


          <div className="form-card profil-form-card">
            <div className="form-section">
              <div className="form-section-title">À propos</div>
              <div className="form-field">
                <label className="form-label">Description professionnelle</label>
                <textarea
                  className="form-textarea"
                  placeholder="Décrivez votre expérience, vos spécialités..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>


            <div className="form-section">
              <div className="form-section-title">Catégories de service</div>
              <div className="profil-category-list">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategorie(cat)}
                    className={form.categories.includes(cat) ? 'btn-primary profil-category-btn active' : 'btn-secondary profil-category-btn'}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>


            <div className="form-section">
              <div className="form-section-title">Compétences</div>
              <div className="profil-add-row">
                <input
                  className="form-input"
                  placeholder="Ex: Soudure TIG, Réseau informatique..."
                  value={newComp}
                  onChange={(e) => setNewComp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetence())}
                />
                <button type="button" className="btn-primary profil-add-btn" onClick={addCompetence}>
                  <Plus size={15} /> Ajouter
                </button>
              </div>
              <div className="profil-skill-list">
                {form.competences.map((c, i) => (
                  <span key={i} className="badge badge-accent profil-skill-badge">
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCompetence(i)}
                      className="profil-skill-remove"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>


          <div className="form-card profil-form-card">
            <div className="form-section">
              <div className="form-section-title">Tarifs & Expérience</div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Tarif minimum (MAD)</label>
                  <input className="form-input" type="number" placeholder="200"
                    value={form.tarifMin} onChange={(e) => setForm({ ...form, tarifMin: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Tarif maximum (MAD)</label>
                  <input className="form-input" type="number" placeholder="1000"
                    value={form.tarifMax} onChange={(e) => setForm({ ...form, tarifMax: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Années d'expérience</label>
                  <input className="form-input" type="number" placeholder="5"
                    value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">Zone géographique</div>
              <div className="form-grid-2">
                <div className="form-field">
                  <label className="form-label">Ville</label>
                  <input className="form-input" placeholder="Casablanca" name="ville"
                    value={form.ville} onChange={handleLocalisationChange} />
                </div>
                {coordonnees && (
  <span style={{ fontSize: 12, color: '#22c55e', marginTop: 4, display: 'block' }}>
     Position détectée ({coordonnees.lat.toFixed(4)}, {coordonnees.lng.toFixed(4)})
  </span>
)}
                <div className="form-field">
                  <label className="form-label">Région</label>
                  <input className="form-input" placeholder="Casablanca-Settat"
                    name="region"
                    value={form.region} onChange={handleLocalisationChange} />
                </div>
                <div className="form-field">
                  <label className="form-label">Rayon d'intervention (km)</label>
                  <input className="form-input" type="number" placeholder="20"
                    name="rayon"
                    value={form.rayon} onChange={(e) => setForm({ ...form, rayon: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary profil-save-btn" disabled={saving}>
            {saving ? <><span className="spinner" /> Sauvegarde...</> : <><Save size={16} /> Sauvegarder le profil</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MonProfil;
