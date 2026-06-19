import { useEffect, useState } from 'react';
import Navbar from '../../components/layout/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Edit, Trash2, Check, X, Eye, EyeOff,
  Wrench, Zap, Laptop, Leaf, Palette, Building2, Hammer, Snowflake,
  Package, Sparkles, ChefHat, Pencil, Megaphone, Globe, Home, Car,
  Smartphone, Music, Camera
} from 'lucide-react';

const ICONES = [
  { value:'Wrench', label:'Outils', Icon:Wrench },
  { value:'Zap', label:'Énergie', Icon:Zap },
  { value:'Laptop', label:'Informatique', Icon:Laptop },
  { value:'Leaf', label:'Jardinage', Icon:Leaf },
  { value:'Palette', label:'Design', Icon:Palette },
  { value:'Building2', label:'Construction', Icon:Building2 },
  { value:'Hammer', label:'Travaux', Icon:Hammer },
  { value:'Snowflake', label:'Climatisation', Icon:Snowflake },
  { value:'Package', label:'Livraison', Icon:Package },
  { value:'Sparkles', label:'Nettoyage', Icon:Sparkles },
  { value:'ChefHat', label:'Cuisine', Icon:ChefHat },
  { value:'Pencil', label:'Rédaction', Icon:Pencil },
  { value:'Megaphone', label:'Marketing', Icon:Megaphone },
  { value:'Globe', label:'Web', Icon:Globe },
  { value:'Home', label:'Maison', Icon:Home },
  { value:'Car', label:'Auto', Icon:Car },
  { value:'Smartphone', label:'Mobile', Icon:Smartphone },
  { value:'Music', label:'Audio', Icon:Music },
  { value:'Camera', label:'Photo', Icon:Camera },
];

const ICON_COMPONENTS = Object.fromEntries(ICONES.map(({ value, Icon }) => [value, Icon]));
const CategoryIcon = ({ name, size = 20 }) => {
  const Icon = ICON_COMPONENTS[name] || Wrench;
  return <Icon size={size} strokeWidth={2.1} />;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [form, setForm] = useState({ nom:'', description:'', icone:'Wrench', ordre:0 });

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
        toast.success('Catégorie mise à jour');
      } else {
        await api.post('/categories', form);
        toast.success('Catégorie créée');
      }
      setShowForm(false);
      setEditId(null);
      setForm({ nom:'', description:'', icone:'Wrench', ordre:0 });
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
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Catégorie supprimée');
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
    setForm({ nom:'', description:'', icone:'Wrench', ordre:0 });
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


        {showForm && (
          <div className="card" style={{ marginBottom:24, border:'2px solid var(--accent)', animation:'fadeUp 0.3s ease-out' }}>
            <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20, color:'var(--accent2)' }}>
              {editId ? <><Edit size={16} /> Modifier la catégorie</> : <><Plus size={16} /> Nouvelle catégorie</>}
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
                {ICONES.map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    title={label}
                    onClick={() => setForm({ ...form, icone: value })}
                    style={{
                      width:40, height:40, borderRadius:10,
                      border: form.icone === value ? '2px solid var(--accent)' : '2px solid var(--border)',
                      background: form.icone === value ? 'var(--accent-light)' : 'var(--bg3)',
                      color: form.icone === value ? 'var(--accent2)' : 'var(--muted)',
                      cursor:'pointer', transition:'all 0.15s',
                      display:'inline-flex', alignItems:'center', justifyContent:'center',
                    }}
                  >
                    <Icon size={19} />
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
                    width:48, height:48, borderRadius:14,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: cat.isActive ? 'var(--accent-light)' : 'var(--bg3)',
                    color: cat.isActive ? 'var(--accent2)' : 'var(--muted)',
                    flexShrink:0,
                  }}>
                    <CategoryIcon name={cat.icone} size={22} />
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
