import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Send, Upload, X, Image } from 'lucide-react';

const CATEGORIES = [
  'Plomberie', 'Électricité', 'Informatique', 'Jardinage',
  'Peinture', 'Maçonnerie', 'Menuiserie', 'Climatisation',
  'Déménagement', 'Nettoyage', 'Cuisine', 'Autre',
];

const CreerDemande = () => {
  const navigate = useNavigate();
  const [loading,   setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging,  setDragging]  = useState(false);
  const [fichiers,  setFichiers]  = useState([]); // urls cloudinary
  const [previews,  setPreviews]  = useState([]); // previews locaux
  const [form, setForm] = useState({
    titre: '', description: '', categorie: '',
    urgence: 'normale', budgetMin: '', budgetMax: '',
    ville: '', region: '', adresse: '',
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ── Upload fichiers ──
  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);

    // Prévisualisation locale
    filesArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setPreviews(prev => [...prev, { url: e.target.result, nom: file.name }]);
        reader.readAsDataURL(file);
      } else {
        setPreviews(prev => [...prev, { url: null, nom: file.name }]);
      }
    });

    // Upload vers Cloudinary
    setUploading(true);
    try {
      const formData = new FormData();
      filesArray.forEach(file => formData.append('fichiers', file));

      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFichiers(prev => [...prev, ...data.fichiers]);
      toast.success(`✅ ${data.fichiers.length} fichier(s) uploadé(s)`);
    } catch {
      toast.error('Erreur upload fichiers');
      setPreviews(prev => prev.slice(0, prev.length - filesArray.length));
    } finally {
      setUploading(false);
    }
  };

  const removeFichier = (index) => {
    setFichiers(prev  => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categorie) { toast.error('Choisissez une catégorie'); return; }
    setLoading(true);
    try {
      await api.post('/demandes', { ...form, fichiers });
      toast.success('✅ Demande publiée avec succès !');
      navigate('/client/demandes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">Nouvelle <span>Demande</span></h1>
          <p className="dashboard-subtitle">Décrivez votre besoin, on trouve le meilleur prestataire</p>
        </div>

        <div className="form-page">
          <form onSubmit={handleSubmit}>

            {/* Infos générales */}
            <div className="form-card">
              <div className="form-section">
                <div className="form-section-title">📝 Informations générales</div>
                <div className="form-field" style={{ marginBottom:16 }}>
                  <label className="form-label">Titre de la demande *</label>
                  <input className="form-input" name="titre"
                    placeholder="Ex: Réparation fuite d'eau urgente"
                    value={form.titre} onChange={handleChange} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Description détaillée *</label>
                  <textarea className="form-textarea" name="description"
                    placeholder="Décrivez votre problème en détail..."
                    value={form.description} onChange={handleChange} required />
                </div>
              </div>

              {/* Catégorie */}
              <div className="form-section">
                <div className="form-section-title">🏷️ Catégorie de service *</div>
                <div className="cat-grid">
                  {CATEGORIES.map(cat => (
                    <button key={cat} type="button"
                      className={`cat-btn ${form.categorie === cat ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, categorie: cat })}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Urgence */}
              <div className="form-section">
                <div className="form-section-title">⚡ Niveau d&apos;urgence</div>
                <div className="urgence-selector">
                  {['faible', 'normale', 'urgente'].map(u => (
                    <button key={u} type="button"
                      className={`urgence-btn ${u} ${form.urgence === u ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, urgence: u })}>
                      {u === 'faible' ? '🟢 Faible' : u === 'normale' ? '🟡 Normale' : '🔴 Urgente'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Budget & Localisation */}
            <div className="form-card">
              <div className="form-section">
                <div className="form-section-title">💰 Budget estimé (MAD)</div>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Budget minimum</label>
                    <input className="form-input" type="number" name="budgetMin"
                      placeholder="200" value={form.budgetMin} onChange={handleChange} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Budget maximum</label>
                    <input className="form-input" type="number" name="budgetMax"
                      placeholder="1000" value={form.budgetMax} onChange={handleChange} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">📍 Localisation</div>
                <div className="form-grid-2">
                  <div className="form-field">
                    <label className="form-label">Ville</label>
                    <input className="form-input" name="ville" placeholder="Casablanca"
                      value={form.ville} onChange={handleChange} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Région</label>
                    <input className="form-input" name="region" placeholder="Casablanca-Settat"
                      value={form.region} onChange={handleChange} />
                  </div>
                  <div className="form-field" style={{ gridColumn:'1 / -1' }}>
                    <label className="form-label">Adresse précise</label>
                    <input className="form-input" name="adresse" placeholder="Rue, quartier..."
                      value={form.adresse} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>

            {/* Upload photos */}
            <div className="form-card">
              <div className="form-section">
                <div className="form-section-title">📸 Photos / Fichiers</div>

                {/* Zone drag & drop */}
                <div
                  className={`upload-zone ${dragging ? 'dragging' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input').click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    style={{ display:'none' }}
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  <div className="upload-icon">
                    {uploading
                      ? <span className="spinner-dark" />
                      : <Upload size={22} />
                    }
                  </div>
                  <p className="upload-title">
                    {uploading ? 'Upload en cours...' : 'Glissez vos fichiers ici'}
                  </p>
                  <p className="upload-sub">
                    ou cliquez pour sélectionner — JPG, PNG, PDF — max 5MB
                  </p>
                </div>

                {/* Prévisualisations */}
                {previews.length > 0 && (
                  <div className="upload-preview">
                    {previews.map((p, i) => (
                      <div key={i} className="upload-preview-item">
                        {p.url ? (
                          <img src={p.url} alt={p.nom} />
                        ) : (
                          <div style={{
                            width:'100%', height:'100%',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            background:'var(--bg3)', fontSize:11, color:'var(--muted)',
                            padding:4, textAlign:'center',
                          }}>
                            <Image size={20} />
                          </div>
                        )}
                        <button
                          type="button"
                          className="upload-preview-remove"
                          onClick={(e) => { e.stopPropagation(); removeFichier(i); }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {fichiers.length > 0 && (
                  <p style={{ fontSize:12, color:'var(--success)', marginTop:8 }}>
                    ✅ {fichiers.length} fichier(s) prêt(s) à envoyer
                  </p>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary"
              disabled={loading || uploading}
              style={{ width:'100%', padding:15 }}>
              {loading
                ? <><span className="spinner" /> Publication...</>
                : <><Send size={16} /> Publier la demande</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreerDemande;