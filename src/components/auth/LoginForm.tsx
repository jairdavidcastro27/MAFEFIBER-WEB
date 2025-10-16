import { useState } from "react";
import styles from "./css/Auth.module.css";
import axios from "axios";
import { API_BASE } from "../../api";

interface LoginResponse {
    token: string;
    expires_at: string;
    user:{
        id:number;
        username:string;
        email:string;
        full_name:string;
        id_admin:boolean;
        is_active:boolean;
        created_at:string | null;
    };
}

export default function LoginForm() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try{
            const response =  await axios.post<LoginResponse>(`${API_BASE}/auth/login`,{
                usernameOrEmail:email,
                password:password
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));   

            // Redirige según el tipo de usuario
            if (response.data.user.id_admin) {
                window.location.href = '/admin';
            } else {
                window.location.href = '/'; // O la página principal del cliente
            }

        } catch(err:any) {
            setError(err?.response?.data?.error || 'Error al iniciar sesión');
        }

        finally{
            setLoading(false);
        }
    };

    return (
        <div className={styles.authFormContainer}>
        <h2>Iniciar sesión </h2>
        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
                <label htmlFor="email">Correo electrónico:</label>      
                <input
                 type="email"
                 id="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 required
                 disabled={loading}
                 placeholder="ejemplo@correo.com"
                 
                 />
             </div>
            <div className={styles.formGroup}>
                <label htmlFor="password">Contraseña:</label>
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="tu contraseña"
                />
            </div>

            <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
            >
                {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
            <div className={styles.authLinks}>
                <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
             <a href="/register">Registrarse</a> {/* Enlace agregado */}
            </div> 
        </form>
    </div>        

    );

}