import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Save, Plus, X } from 'lucide-react';

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

  useEffect(() => {
    setLoading(true);
    api.get('/prestataires/moi')
      .then(({ data }) => {
        const p = data.prestataire;
         setProfil(p);
        setForm({
          description: p.description || '',
          competences: p.competences || [],
          categories:  p.categories  || [],
          tarifMin:    p.tarifMin    || '',
          tarifMax:    p.tarifMax    || '',
          ville:       p.zoneGeographique?.ville  || '',
          region:      p.zoneGeographique?.region || '',
          rayon:       p.zoneGeographique?.rayon  || 20,
          experience:  p.experience || '',
        });
        setDisponible(p.disponible);
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
      await api.put('/prestataires/profil', form);
      await api.put('/prestataires/disponibilite', { disponible });
      toast.success('✅ Profil mis à jour !');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
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
      <div className="page-content">

        {/* Header */}
        <div className="profil-header">
          <div className="profil-avatar">
            {user?.prenom?.[0]}{user?.nom?.[0]}
          </div>
          <div className="profil-info">
  <h2 style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
    {user?.prenom} {user?.nom}
    {disponible !== undefined && profil?.user?.isVerified && (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:4,
        padding:'4px 12px', borderRadius:99,
        background:'var(--info-light)',
        border:'1px solid rgba(37,99,235,0.2)',
        fontSize:13, fontWeight:600, color:'var(--info)',
      }}>
        ✅ Compte vérifié
      </span>
    )}
    {!profil?.user?.isVerified && (
      <span style={{
        display:'inline-flex', alignItems:'center', gap:4,
        padding:'4px 12px', borderRadius:99,
        background:'var(--warning-light)',
        border:'1px solid rgba(217,119,6,0.2)',
        fontSize:13, fontWeight:600, color:'var(--warning)',
      }}>
        ⏳ En attente de vérification
      </span>
    )}
  </h2>
  <p>{user?.email}</p>
</div>
        </div>

        <form onSubmit={handleSave} className="form-page" style={{ maxWidth: '100%' }}>

          {/* Disponibilité */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: 15, marginBottom: 4 }}>Disponibilité</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>
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
                  {disponible ? '🟢 Disponible' : '🔴 Indisponible'}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="form-card" style={{ marginBottom: 20 }}>
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

            {/* Catégories */}
            <div className="form-section">
              <div className="form-section-title">Catégories de service</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategorie(cat)}
                    className={form.categories.includes(cat) ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '8px 16px', fontSize: 13 }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Compétences */}
            <div className="form-section">
              <div className="form-section-title">Compétences</div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <input
                  className="form-input"
                  placeholder="Ex: Soudure TIG, Réseau informatique..."
                  value={newComp}
                  onChange={(e) => setNewComp(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetence())}
                />
                <button type="button" className="btn-primary" onClick={addCompetence} style={{ whiteSpace: 'nowrap' }}>
                  <Plus size={15} /> Ajouter
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {form.competences.map((c, i) => (
                  <span key={i} className="badge badge-accent" style={{ gap: 6, padding: '6px 12px' }}>
                    {c}
                    <button
                      type="button"
                      onClick={() => removeCompetence(i)}
                      style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Tarifs & Zone */}
          <div className="form-card" style={{ marginBottom: 20 }}>
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
                  <input className="form-input" placeholder="Casablanca"
                    value={form.ville} onChange={(e) => setForm({ ...form, ville: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Région</label>
                  <input className="form-input" placeholder="Casablanca-Settat"
                    value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                </div>
                <div className="form-field">
                  <label className="form-label">Rayon d'intervention (km)</label>
                  <input className="form-input" type="number" placeholder="20"
                    value={form.rayon} onChange={(e) => setForm({ ...form, rayon: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={saving} style={{ width: '100%', padding: '15px' }}>
            {saving ? <><span className="spinner" /> Sauvegarde...</> : <><Save size={16} /> Sauvegarder le profil</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default MonProfil;