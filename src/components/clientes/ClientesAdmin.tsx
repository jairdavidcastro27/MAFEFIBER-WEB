import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../api";
import "./css/ClientesAdmin.css";

type User = {
  id: number;
  username: string;
  email: string;
  full_name: string;
  id_admin: boolean;
  is_active: boolean;
  created_at?: string;
};

const UsuariosAdmin: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; msg: string }>({ visible: false, msg: "" });

  const [query, setQuery] = useState<string>("");
  const searchDebounce = useRef<number | null>(null);

  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    fetchUsers();
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);
async function fetchUsers(q?: string) {
  try {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    const url = q && q.trim() !== "" ? `${API_BASE}/auth/users/search?q=${encodeURIComponent(q)}` : `${API_BASE}/auth/users`;
    const res = await axios.get<User[]>(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data: any = res.data;
    if (Array.isArray(data)) setUsers(data);
    else if (Array.isArray(data.users)) setUsers(data.users);
    else { setUsers([]); showToast(data?.error || "Error cargando usuarios"); }
  } catch (e: any) {
    console.error("Error cargando usuarios:", e);
    setUsers([]);
    if (e?.response?.status === 401) {
      showToast('Sesión expirada');
      localStorage.removeItem('token');
      setTimeout(() => { window.location.href = '/login'; }, 800);
      return;
    }
    showToast("Error cargando usuarios");
  } finally {
    setIsLoading(false);
  }
}

function handleSearchChange(value: string) {
  setQuery(value);
  if (searchDebounce.current) { window.clearTimeout(searchDebounce.current); searchDebounce.current = null; }
  searchDebounce.current = window.setTimeout(() => { fetchUsers(value); }, 350) as unknown as number;
}

  async function deactivateUser(id: number) {
    if (!confirm("¿Desactivar este usuario?")) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/auth/users/${id}/deactivate`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showToast("Usuario desactivado");
      await fetchUsers(query);
      const totalPages = Math.max(1, Math.ceil((users.length - 1) / ITEMS_PER_PAGE));
      setPage(p => Math.min(p, totalPages));
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (e) {
      console.error("Error al desactivar usuario:", e);
      showToast("Error al desactivar usuario");
    } finally {
      setIsLoading(false);
    }
  }

  async function activateUser(id: number) {
    if (!confirm("¿Activar este usuario?")) return;
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      await axios.patch(`${API_BASE}/auth/users/${id}/activate`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      showToast("Usuario activado");
      await fetchUsers(query);
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (e) {
      console.error("Error al activar usuario:", e);
      showToast("Error al activar usuario");
    } finally {
      setIsLoading(false);
    }
  }

  function showToast(msg: string, duration = 3000) {
    setToast({ visible: true, msg });
    if (toastTimer.current) {
      window.clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    toastTimer.current = window.setTimeout(() => {
      setToast({ visible: false, msg: "" });
      toastTimer.current = null;
    }, duration) as unknown as number;
  }

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const indexOfLast = page * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const pageUsers = Array.isArray(users) ? users.slice(indexOfFirst, indexOfLast) : [];
  const startItem = users.length === 0 ? 0 : indexOfFirst + 1;
  const endItem = indexOfFirst + pageUsers.length;

  function handlePageChange(p: number) {
    setPage(p);
    setTimeout(() => {
      const first = document.querySelector(".cards-grid .user-card");
      if (first) (first as HTMLElement).scrollIntoView({ behavior: "auto", block: "start" });
    }, 50);
  }

  return (
    <div className="clientes-admin">
      <h2>Usuarios</h2>

      <div className="clientes-grid">
        <div className="search-row">
          <div className="search-inner">
            <input
              type="search"
              className="search-input"
              placeholder="Buscar por usuario, email o nombre..."
              value={query}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label="Buscar usuarios"
            />
            <div className="search-actions">
              <button className="btn btn-search" onClick={() => fetchUsers(query)} aria-label="Buscar ahora">Buscar</button>
              <button className="btn btn-clear" onClick={() => { setQuery(''); fetchUsers(); }} aria-label="Limpiar búsqueda">Limpiar</button>
            </div>
          </div>
        </div>

        {isLoading && <div className="loader">Cargando...</div>}

        <div className="cards-grid">
          {pageUsers.map(u => (
            <div key={u.id} className={`user-card ${u.is_active ? '' : 'inactive'}`}>
              <div className="user-card-header"><strong>{u.username}</strong> {u.id_admin && <span className="badge">Admin</span>}</div>
              <div className="user-card-body">
                <div className="user-line"><small>Email:</small> {u.email}</div>
                <div className="user-line"><small>Nombre:</small> {u.full_name || '-'}</div>
                <div className="user-line"><small>Activo:</small> {u.is_active ? 'Sí' : 'No'}</div>
              </div>
              <div className="user-card-actions">
                {u.is_active ? (
                  <button className="btn btn-deactivate" onClick={() => deactivateUser(u.id)}>
                    <span className="icon">🔒</span>
                    <span>Desactivar</span>
                  </button>
                ) : (
                  <button className="btn btn-activate" onClick={() => activateUser(u.id)}>
                    <span className="icon">🔓</span>
                    <span>Activar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
          {pageUsers.length === 0 && !isLoading && <div className="empty">No hay usuarios.</div>}
        </div>

        <div className="pagination">
          <button onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1}>Anterior</button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} className={page === i + 1 ? 'active' : ''} onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
          ))}
          <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Siguiente</button>
        </div>
      </div>

      {toast.visible && (
        <div className="clientes-toast" role="status" aria-live="polite" data-testid="clientes-toast">
          {toast.msg}
          <button className="close" onClick={() => { setToast({ visible: false, msg: "" }); if (toastTimer.current) { window.clearTimeout(toastTimer.current); toastTimer.current = null; } }}>×</button>
        </div>
      )}
    </div>
  );
};

export default UsuariosAdmin;