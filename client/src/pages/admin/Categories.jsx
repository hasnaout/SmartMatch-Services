import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Check, X, Eye, EyeOff } from 'lucide-react';

const ICONES = ['🔧','⚡','💻','🌿','🎨','🏗️','🪚','❄️','📦','🧹','👨‍🍳','✏️','📢','🌐','🔨','🏠','🚗','📱','🎵','📷'];

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ nom:'', description:'', icone:'🔧', ordre:0 });

  const fetchCategories = () => {
    setLoading(true);
    api.get('/categories')
      .then(({ data }) => setCategories(data.categories))
      .catch(() => toast.error('Erreur chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async () => {
    if (!form.nom.trim()) { toast.error('Le nom est obligatoire'); return; }
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/categories/${editId}`, form);
        toast.success('✅ Catégorie mise à jour');
      } else {
        await api.post('/categories', form);
        toast.success('✅ Catégorie créée');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ nom:'', description:'', icone:'🔧', ordre:0 });
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat) => {
    setForm({ nom:cat.nom, description:cat.description, icone:cat.icone, ordre:cat.ordre });
    setEditId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    try {
      await api.delete(`/categories/${id}`);
      toast.success('✅ Catégorie supprimée');
      fetchCategories();
    } catch { toast.error('Erreur suppression'); }
  };

  const handleToggle = async (cat) => {
    try {
      await api.put(`/categories/${cat._id}`, { ...cat, isActive: !cat.isActive });
      toast.success(`Catégorie ${!cat.isActive ? 'activée' : 'désactivée'}`);
      fetchCategories();
    } catch { toast.error('Erreur'); }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ nom:'', description:'', icone:'🔧', ordre:0 });
  };

  return (
    <div className="layout">
      <Navbar />
      <div className="page-content">

        <div className="dashboard-header">
          <h1 className="dashboard-greeting">
            Gestion des <span>Catégories</span>
          </h1>
          <p className="dashboard-subtitle">
            Gérez les catégories de services disponibles sur la plateforme
          </p>
        </div>

        {/* Formulaire */}
        {showForm && (
          <div className="card" style={{ marginBottom:24, border:'2px solid var(--accent)', animation:'fadeUp 0.3s ease-out' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20, color:'var(--accent2)' }}>
              {editId ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
            </h3>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div className="form-field">
                <label className="form-label">Nom *</label>
                <input className="form-input" placeholder="Ex: Plomberie"
                  value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label">Ordre d&apos;affichage</label>
                <input className="form-input" type="number" placeholder="1"
                  value={form.ordre} onChange={e => setForm({ ...form, ordre: Number(e.target.value) })} />
              </div>
            </div>

            <div className="form-field" style={{ marginBottom:16 }}>
              <label className="form-label">Description</label>
              <input className="form-input" placeholder="Description courte..."
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>

            <div className="form-field" style={{ marginBottom:20 }}>
              <label className="form-label">Icône</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>
                {ICONES.map(icone => (
                  <button
                    key={icone}
                    type="button"
                    onClick={() => setForm({ ...form, icone })}
                    style={{
                      width:40, height:40, borderRadius:10, fontSize:20,
                      border: form.icone === icone ? '2px solid var(--accent)' : '2px solid var(--border)',
                      background: form.icone === icone ? 'var(--accent-light)' : 'var(--bg3)',
                      cursor:'pointer', transition:'all 0.15s',
                    }}
                  >
                    {icone}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display:'flex', gap:10 }}>
              <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
                {saving ? <><span className="spinner" /> Sauvegarde...</> : <><Check size={15} /> Sauvegarder</>}
              </button>
              <button className="btn-secondary" onClick={handleCancel}>
                <X size={15} /> Annuler
              </button>
            </div>
          </div>
        )}

        {/* Header + bouton */}
        <div className="section-header" style={{ marginBottom:20 }}>
          <div>
            <h2 className="section-title">Toutes les catégories</h2>
            <p className="section-subtitle">{categories.length} catégories au total</p>
          </div>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={15} /> Nouvelle catégorie
            </button>
          )}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="empty-state">
            <span className="spinner-dark" style={{ width:32, height:32, borderWidth:3 }} />
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
            {categories.map(cat => (
              <div key={cat._id} className="card" style={{
                border: cat.isActive ? '1px solid var(--border)' : '1px solid var(--border)',
                opacity: cat.isActive ? 1 : 0.6,
                transition:'all 0.2s',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                  <div style={{
                    width:48, height:48, borderRadius:14, fontSize:24,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: cat.isActive ? 'var(--accent-light)' : 'var(--bg3)',
                    flexShrink:0,
                  }}>
                    {cat.icone}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
                      {cat.nom}
                    </div>
                    <span className={cat.isActive ? 'badge badge-success' : 'badge badge-muted'}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {cat.description && (
                  <p style={{ fontSize:13, color:'var(--muted)', marginBottom:12, lineHeight:1.5 }}>
                    {cat.description}
                  </p>
                )}

                <div style={{ fontSize:12, color:'var(--muted)', marginBottom:14 }}>
                  Ordre : {cat.ordre}
                </div>

                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn-secondary" onClick={() => handleEdit(cat)}
                    style={{ flex:1, padding:'8px', fontSize:12 }}>
                    <Edit size={13} /> Modifier
                  </button>
                  <button
                    onClick={() => handleToggle(cat)}
                    style={{
                      padding:'8px 10px', borderRadius:10, fontSize:12,
                      border:'1.5px solid var(--border)', background:'var(--bg3)',
                      cursor:'pointer', color:'var(--muted)', display:'flex', alignItems:'center', gap:4,
                    }}
                  >
                    {cat.isActive ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(cat._id)}
                    style={{ padding:'8px 10px', fontSize:12 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;