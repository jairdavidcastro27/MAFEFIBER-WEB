import React, { useEffect, useState, useRef } from "react";
import ReactDOM from 'react-dom';
import axios from "axios";
import { API_BASE } from "../../api";
import styles from "../productos/css/EditarProducto.module.css";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number | string;
  sku: string;
  stock_quantity: number;
  images: string[];
  is_active: boolean;
}

const EditarProductos: React.FC = () => {
  // Desactivar producto (no eliminar)
  const desactivarProducto = async (id: number) => {
    if (!window.confirm("¿Desactivar este producto?")) return;
    try {
      await axios.patch(`${API_BASE}/products/${id}/deactivate`);
      showToast("Producto desactivado");
      await loadProducts();
    } catch {
      showToast("Error al desactivar producto");
    }
  };

  // Activar producto
  const activarProducto = async (id: number) => {
    if (!window.confirm("¿Activar este producto?")) return;
    try {
      await axios.patch(`${API_BASE}/products/${id}/activate`);
      showToast("Producto activado");
      await loadProducts();
    } catch {
      showToast("Error al activar producto");
    }
  };
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState<string>("");
  const searchDebounceRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 3;
  const listRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  // Toast (small confirmation alert)
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });
  const toastTimerRef = useRef<number | null>(null);
  const showToast = (message: string, duration = 3000) => {
    console.log('[EditarProductos] showToast called with:', message, duration, 'existingTimer:', toastTimerRef.current);
    if (toastTimerRef.current) {
      console.log('[EditarProductos] clearing existing timer', toastTimerRef.current);
      window.clearTimeout(toastTimerRef.current as number);
      toastTimerRef.current = null;
    }
    setToast({ message, visible: true });
    // auto-hide
    const id = window.setTimeout(() => {
      console.log('[EditarProductos] toast timeout callback firing for message:', message, 'timerId:', id);
      setToast({ message: '', visible: false });
      toastTimerRef.current = null;
    }, duration) as unknown as number;
    toastTimerRef.current = id;
    console.log('[EditarProductos] set new toast timer', toastTimerRef.current);
  };

  const hideToast = () => {
    console.log('[EditarProductos] hideToast called, currentTimer:', toastTimerRef.current);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current as number);
      console.log('[EditarProductos] cleared timer', toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast({ message: '', visible: false });
  };

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  // mark mounted to avoid SSR/client markup mismatch (portal and random SKU generation)
  useEffect(() => {
    setMounted(true);
    console.log('[EditarProductos] mounted set to true');
  }, []);

  // SKU generator
  const generateSku = (prefix = 'SKU') => {
    const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${rand}`;
  };

  // Form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [sku, setSku] = useState("");
  const [stock, setStock] = useState<number | "">("");
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => { 
    loadProducts(); 
  }, []);

  // generate SKU only on client after mount to avoid SSR hydration mismatch
  useEffect(() => {
    if (mounted && !sku) {
      setSku(generateSku());
    }
  }, [mounted]);

  // When page changes, jump to top of the product list without smooth transition
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollIntoView({ behavior: 'auto', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [page]);

  // GET /products
  const loadProducts = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = q && q.trim() !== "" ? `${API_BASE}/products?search=${encodeURIComponent(q)}` : `${API_BASE}/products`;
      const res = await axios.get<Product[]>(url);
      setProducts(res.data);
      setPage(1); // reset page when reloading list
    } catch (err:any) {
      console.error('Error loading products', err);
      setError("No se pudieron cargar los productos.");
    } finally {
      setLoading(false);
    }
  };

  function handleSearchChange(value: string) {
    setQuery(value);
    if (searchDebounceRef.current) { window.clearTimeout(searchDebounceRef.current); searchDebounceRef.current = null; }
    searchDebounceRef.current = window.setTimeout(() => { loadProducts(value); }, 350) as unknown as number;
  }

  const clearForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setSku(generateSku());
    setStock("");
    setImages([]);
    setError(null);
  };

  // Cargar producto al formulario
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setName(p.name || "");
    setDescription(p.description || "");
    if (p.price === null || p.price === undefined || p.price === "") {
      setPrice("");
    } else if (typeof p.price === "string") {
      const num = Number(p.price);
      setPrice(isNaN(num) ? "" : num);
    } else {
      setPrice(p.price);
    }
    setSku(p.sku || generateSku());
    setStock(p.stock_quantity ?? "");
    setImages(p.images || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  console.log('[EditarProductos] startEdit called for id', p.id);
  };

  // POST /products o PUT /products/:id
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || price === "" || !sku) {
      setError("Completa nombre, precio y SKU.");
      return;
    }

    const payload = {
      name,
      description,
      price: Number(price),
      sku,
      stock_quantity: Number(stock) || 0,
      images,
    };

    setSaving(true);

    try {
      if (editingId)
        await axios.put(`${API_BASE}/products/${editingId}`, payload);
      else
        await axios.post(`${API_BASE}/products`, payload);

      await loadProducts();
      clearForm();
  // ensure user sees the toast: scroll to top of page first
  window.scrollTo({ top: 0, behavior: 'auto' });
  // small delay so the scroll happens before showing the toast
      console.log('[EditarProductos] saveProduct completed, will show toast');
      showToast('Cambios guardados correctamente');
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  // Log toast state changes for debugging
  useEffect(() => {
    console.log('[EditarProductos] toast state changed:', toast);
  }, [toast]);

  // DELETE /products/:id
  const deleteProduct = async (id: number) => {
    if (!confirm("¿Eliminar este producto?")) return;

    setDeletingId(id);

    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      await loadProducts();
      if (editingId === id) clearForm();
      // adjust page if current page would be empty after deletion
      const remaining = products.length - 1;
      const totalPagesAfter = Math.max(1, Math.ceil(remaining / ITEMS_PER_PAGE));
      if (page > totalPagesAfter) setPage(totalPagesAfter);
    } catch {
      setError("No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  // Helpers para imágenes
  const handleImageChange = (idx: number, value: string) => {
    setImages(prev => prev.map((img, i) => i === idx ? value : img));
  };
  
  const addImage = () => setImages(prev => [...prev, ""]);
  
  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));

  // Modal para imágenes
  const openImageModal = (imageUrl: string) => {
    setModalImage(imageUrl);
  };

  const closeImageModal = () => {
    setModalImage(null);
  };

  return (
    <div className={styles.adminContainer}>
      <h3 className={styles.formTitle}>
        <span className={styles.iconList}>🛠️</span> Gestión de productos
      </h3>
      
      <div className={styles.gridLayout}>
        {/* Columna izquierda - Formulario */}
        <div className={styles.leftCol}>
          <div className={styles.cardForm}>
            <h4 className={styles.formSubtitle}>
              {editingId ? "✏️ Editar producto" : "✨ Crear nuevo producto"}
            </h4>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <form onSubmit={saveProduct} className={styles.planForm}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Nombre del producto</label>
                  <input
                    id="name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Mouse Inalámbrico"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="price">Precio (S/)</label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price === 0 ? "" : price}
                    onChange={e => {
                      const val = e.target.value;
                      setPrice(val === "" ? "" : Number(val));
                    }}
                    placeholder="Ej: 99.90"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="sku">SKU</label>
                  <input
                    id="sku"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="Ej: SKU123"
                    className={styles.formInput}
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="stock">Stock</label>
                  <input
                    id="stock"
                    type="number"
                    value={stock === 0 ? "" : stock}
                    onChange={e => {
                      const val = e.target.value;
                      setStock(val === "" ? "" : Number(val));
                    }}
                    placeholder="Ej: 10"
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
                  placeholder="Describe el producto..."
                  className={styles.formTextarea}
                  rows={3}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Imágenes (URL):</label>
                {images.map((img, idx) => (
                  <div key={idx} className={styles.imageRow}>
                    <input
                      value={img}
                      onChange={e => handleImageChange(idx, e.target.value)}
                      placeholder={`Imagen #${idx + 1}`}
                      className={styles.formInput}
                    />
                    {img && (
                      <img 
                        src={img} 
                        alt={`Preview ${idx + 1}`} 
                        className={styles.imgPreview} 
                        onError={e => (e.currentTarget.style.display = 'none')} 
                        onClick={() => img && openImageModal(img)}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    <button 
                      type="button" 
                      className={styles.btnRemoveImage} 
                      onClick={() => removeImage(idx)} 
                      title="Quitar imagen"
                    >
                      ✖
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className={styles.btnAddImage} 
                  onClick={addImage}
                >
                  + Agregar imagen
                </button>
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`${styles.formButton} ${styles.primary} ${saving ? styles.actionLoader : ''}`}
                  disabled={saving}
                >
                  {!saving && (editingId ? "💾 Guardar cambios" : "➕ Crear producto")}
                  {saving && "Guardando..."}
                </button>
                
                <button
                  type="button"
                  onClick={clearForm}
                  className={`${styles.formButton} ${styles.secondary}`}
                  disabled={saving}
                >
                  🔄 Limpiar
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Columna derecha - Lista de productos */}
        <div className={styles.rightCol}>
          <div className={styles.planListSection} ref={listRef}>
            <h3 className={styles.sectionTitle}>
              <span className={styles.iconList}>📋</span> Lista de productos
            </h3>
              <div className={styles.searchRow}>
                <input
                  className={styles.searchInput}
                  placeholder="Buscar por nombre o descripción..."
                  value={query}
                  onChange={e => handleSearchChange(e.target.value)}
                  aria-label="Buscar productos"
                />
                <div className={styles.searchActions}>
                  <button type="button" className={styles.btnSearch} onClick={() => loadProducts(query)}>Buscar</button>
                  <button type="button" className={styles.btnClear} onClick={() => { setQuery(''); loadProducts(); }}>Limpiar</button>
                </div>
              </div>

            {loading && <div className={styles.loadingText}>Cargando productos...</div>}
            
            {!loading && products.length === 0 && (
              <div className={styles.loadingText}>No hay productos disponibles.</div>
            )}
            
            <div className={styles.planList}>
              {(() => {
                const totalPages = Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE));
                const start = (page - 1) * ITEMS_PER_PAGE;
                const paginated = products.slice(start, start + ITEMS_PER_PAGE);
                return paginated.map(p => (
                  <div key={p.id} className={`${styles.card} ${p.is_active ? '' : styles.inactive}`}>
                    <div className={styles.cardHeader}>
                      <span 
                        className={styles.planName} 
                        title={p.name}
                        onClick={() => alert(`Nombre completo: ${p.name}`)}
                      >
                        {p.name}
                      </span>
                      <span className={styles.planSpeed}>S/ {p.price}</span>
                    </div>
                    <div className={styles.planDescription}>{p.description}</div>
                    <div className={styles.skuStock}>
                      SKU: {p.sku} | Stock: {p.stock_quantity}
                    </div>
                    {p.images && p.images.length > 0 && (
                      <div className={styles.cardImages}>
                        {p.images.map((img, i) => (
                          <button 
                            key={i} 
                            className={styles.cardImgLink}
                            onClick={() => openImageModal(img)}
                            title="Haz clic para ampliar"
                          >
                            <img 
                              src={img} 
                              alt={`Imagen ${i + 1} de ${p.name}`} 
                              className={styles.cardImg} 
                              onError={e => (e.currentTarget.style.display = 'none')} 
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => startEdit(p)}
                        className={`${styles.btn} ${styles.btnEdit}`}
                        disabled={deletingId === p.id}
                      >
                        ✏️ Editar
                      </button>
                      {p.is_active ? (
                        <button
                          onClick={() => desactivarProducto(p.id)}
                          className={`${styles.btn} ${styles.btnDelete}`}
                          disabled={deletingId === p.id}
                        >
                          {deletingId !== p.id ? "🗑️ Eliminar" : "Eliminando..."}
                        </button>
                      ) : (
                        <button
                          onClick={() => activarProducto(p.id)}
                          className={`${styles.btn} ${styles.btnActivate}`}
                        >
                          🔓 Activar
                        </button>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Pagination controls */}
            {products.length > ITEMS_PER_PAGE && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageButton}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  ← Anterior
                </button>

                {Array.from({ length: Math.max(1, Math.ceil(products.length / ITEMS_PER_PAGE)) }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    className={`${styles.pageButton} ${n === page ? styles.pageButtonActive : ''}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}

                <button
                  className={styles.pageButton}
                  onClick={() => setPage(prev => Math.min(Math.ceil(products.length / ITEMS_PER_PAGE), prev + 1))}
                  disabled={page >= Math.ceil(products.length / ITEMS_PER_PAGE)}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para imagen ampliada */}
      <div 
        className={`${styles.imageModal} ${modalImage ? styles.active : ''}`} 
        onClick={closeImageModal}
      >
        {modalImage && (
          <>
            <img 
              src={modalImage} 
              alt="Vista ampliada" 
              className={styles.modalImage} 
              onClick={(e) => e.stopPropagation()} 
            />
            <button 
              className={styles.closeModal} 
              onClick={closeImageModal}
            >
              ×
            </button>
          </>
        )}
      </div>

        {/* Toast */}
  {mounted && typeof document !== 'undefined' && document.body && ReactDOM.createPortal(
          <div
            className={styles.toast}
            data-testid="toast"
            role="status"
            aria-live="polite"
            style={{
              opacity: toast.visible ? 1 : 0,
              transform: toast.visible ? 'translateY(0)' : 'translateY(-8px)',
              pointerEvents: toast.visible ? 'auto' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ flex: 1 }}>{toast.message}</div>
              <button onClick={hideToast} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>×</button>
            </div>
          </div>,
          document.body
        )}

    {/* Inline fallback if portal couldn't mount (helps when testing or during SSR issues) */}
    {!(mounted && typeof document !== 'undefined' && document.body) && toast.visible && (
      <div className={styles.toast} data-testid="toast" role="status" aria-live="polite" style={{ opacity: 1, transform: 'translateY(0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ flex: 1 }}>{toast.message}</div>
          <button onClick={hideToast} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>×</button>
        </div>
      </div>
    )}

    {/* Debug panel for development - remove in production */}
    <div style={{ position: 'fixed', left: 8, top: 8, zIndex: 1400, background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '0.4rem 0.6rem', borderRadius: 6, fontSize: '0.75rem' }}>
      <div>mounted: {mounted ? 'true' : 'false'}</div>
      <div>toast.visible: {toast.visible ? 'true' : 'false'}</div>
      <div style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>msg: {toast.message}</div>
    </div>
    {/* Prominent debug banner to ensure the toast is rendered and visible (temporary) */}
    {toast.visible && (
      <div data-testid="toast-debug-banner" style={{ position: 'fixed', left: '50%', top: '18%', transform: 'translate(-50%, -18%)', background: '#ff5252', color: '#fff', padding: '1.2rem 1.6rem', borderRadius: 10, zIndex: 2147483647, fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.2px', boxShadow: '0 12px 40px rgba(0,0,0,0.6)', maxWidth: '90%', textAlign: 'center' }}>
        {toast.message}
      </div>
    )}
    </div>
  );
};

export default EditarProductos;