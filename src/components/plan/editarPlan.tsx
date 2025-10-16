import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { API_BASE } from "../../api";
import styles from "./css/EditarPlan.module.css";

/* CRUD simple para /plans: listar, crear, editar, eliminar */

interface Plan {
  id: number;
  name: string;
  speed_mbps: number;
  price: number;
  description?: string | null;
  technology?: string | null;
  features?: string | null;
}

const EditarPlan: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [features, setFeatures] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Toast (small confirmation banner)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (message: string, duration = 3000) => {
    console.log('[EditarPlan] showToast called with:', message, duration, 'existingTimer:', toastTimerRef.current);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current as number);
      toastTimerRef.current = null;
    }
    setToast({ message, visible: true });
    const id = window.setTimeout(() => {
      setToast({ message: '', visible: false });
      toastTimerRef.current = null;
    }, duration) as unknown as number;
    toastTimerRef.current = id;
  };

  const hideToast = () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current as number);
      toastTimerRef.current = null;
    }
    setToast({ message: '', visible: false });
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [speed, setSpeed] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");
  const [technology, setTechnology] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => { loadPlans(); }, []);

  // GET /plans
  const loadPlans = async () => {
    setLoading(true); setError(null);
    try { const res = await axios.get<Plan[]>(`${API_BASE}/plans`); setPlans(res.data); }
    catch { setError("No se pudieron cargar los planes."); }
    finally { setLoading(false); }
  };

  const clearForm = () => {
  setEditingId(null); setName(""); setSpeed(""); setPrice(""); setTechnology(""); setDescription(""); setFeatures(""); setError(null);
  };

  // Cargar plan al formulario
  const startEdit = (p: Plan) => {
  setEditingId(p.id); setName(p.name || ""); setSpeed(p.speed_mbps ?? ""); setPrice(p.price ?? ""); setTechnology(p.technology ?? ""); setDescription(p.description ?? ""); setFeatures(p.features ?? ""); window.scrollTo({ top: 0, behavior: "smooth" });
    showToast('Plan cargado para editar');
  };

  // POST /plans o PUT /plans/:id
  const savePlan = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setError(null);
    
    if (!name || speed === "" || price === "" || !technology) { 
      setError("Completa nombre, velocidad, precio y tecnología."); 
      return; 
    }
    
    const payload = { 
      name, 
      speed_mbps: Number(speed), 
      price: Number(price), 
      technology, 
      description,
      features
    };
    
    setSaving(true);
    
    try {
      if (editingId) 
        await axios.put(`${API_BASE}/plans/${editingId}`, payload);
      else 
        await axios.post(`${API_BASE}/plans`, payload);
      
      await loadPlans(); 
      clearForm();
      showToast(editingId ? 'Cambios guardados correctamente' : 'Plan creado correctamente');
    } catch (err: any) { 
      setError(err?.response?.data?.error || "Error al guardar."); 
    } finally {
      setSaving(false);
    }
  };

  // DELETE /plans/:id
  const deletePlan = async (id: number) => {
    if (!confirm("¿Eliminar/desactivar este plan?")) return;
    
    setDeletingId(id);
    
    try { 
      await axios.delete(`${API_BASE}/plans/${id}`); 
      await loadPlans(); 
      if (editingId === id) clearForm(); 
    } catch { 
      setError("No se pudo eliminar el plan."); 
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={styles.adminContainer}>
      <h3 className={styles.formTitle}>
        {editingId ? "✏️ Editar plan" : "✨ Crear nuevo plan"}
      </h3>
      
      {error && <div className={styles.errorMessage}>{error}</div>}

      <form onSubmit={savePlan} className={styles.planForm}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Nombre del plan</label>
            <input 
              id="name"
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej: Plan Fibra Hogar"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="speed">Velocidad (Mbps)</label>
            <input 
              id="speed"
              type="number" 
              value={speed as any} 
              onChange={e => setSpeed(e.target.value === "" ? "" : Number(e.target.value))} 
              placeholder="Ej: 300"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="price">Precio (S/)</label>
            <input 
              id="price"
              type="number" 
              step="0.01" 
              value={price as any} 
              onChange={e => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
              placeholder="Ej: 79.90" 
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="technology">Tecnología</label>
            <input 
              id="technology"
              value={technology} 
              onChange={e => setTechnology(e.target.value)} 
              placeholder="Ej: Fibra óptica"
              className={styles.formInput}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description">Descripción</label>
          <textarea 
            id="description"
            value={description} 
            onChange={e => setDescription(e.target.value)} 
            placeholder="Describe las características del plan..."
            className={styles.formTextarea}
            rows={3}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="features">Características (separadas por coma)</label>
          <input
            id="features"
            value={features}
            onChange={e => setFeatures(e.target.value)}
            placeholder="Ej: Instalación gratuita, Router incluido, Soporte técnico"
            className={styles.formInput}
          />
        </div>

        <div className={styles.formActions}>
          <button 
            type="submit" 
            className={`${styles.formButton} ${saving ? styles.actionLoader : ''}`}
            disabled={saving}
          >
            {!saving && (editingId ? "💾 Guardar cambios" : "➕ Crear plan")}
            {saving && <span className={styles.loader}></span>}
            {saving && "Guardando..."}
          </button>
          <button 
            type="button" 
            onClick={clearForm} 
            className={styles.formButton}
            disabled={saving}
          >
            🔄 Limpiar
          </button>
        </div>
      </form>

      <div className={styles.planListSection}>
        <h3 className={styles.sectionTitle}>
          <span className={styles.iconList}>📋</span> Lista de planes
        </h3>
        
        {loading && <div className={styles.loading}>Cargando planes...</div>}
        {!loading && plans.length === 0 && <div className={styles.emptyList}>No hay planes disponibles.</div>}

        <div className={styles.planList}>
          {plans.map(p => (
            <div key={p.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.planName}>{p.name}</span>
                <span className={styles.planSpeed}>⚡ {p.speed_mbps} Mbps</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.planPrice}>S/ {p.price}</div>
                {p.technology && <div className={styles.planDetail}><span>Tecnología:</span> {p.technology}</div>}
                {p.description && <div className={styles.planDescription}>{p.description}</div>}
              </div>
              <div className={styles.cardActions}>
                <button 
                  onClick={() => startEdit(p)} 
                  className={`${styles.btn} ${styles.btnEdit}`}
                  disabled={deletingId === p.id}
                >
                  ✏️ Editar
                </button>
                <button 
                  onClick={() => deletePlan(p.id)} 
                  className={`${styles.btn} ${styles.btnDelete} ${deletingId === p.id ? styles.actionLoader : ''}`}
                  disabled={deletingId === p.id}
                >
                  {deletingId !== p.id && "🗑️ Eliminar"}
                  {deletingId === p.id && "Eliminando..."}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Centered confirmation banner */}
      {toast.visible && (
        <div data-testid="plan-toast-banner" style={{ position: 'fixed', left: '50%', top: '18%', transform: 'translate(-50%, -18%)', background: '#27ae60', color: '#fff', padding: '1rem 1.25rem', borderRadius: 8, zIndex: 2147483647, fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', textAlign: 'center' }}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default EditarPlan;