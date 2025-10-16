import { useState } from "react";
import styles from "./css/Auth.module.css";
import axios from "axios";
import { API_BASE } from "../../api";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState(''); 
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try{
            await axios.post(`${API_BASE}/forgot-password`,{email});
            setSuccess('Si el correo existe, se ha enviado un enlace para restablecer la contraseña.');
            setEmail('');
        }catch(err:any){
            setError(err?.response?.data?.error || 'Error al enviar el correo');

        }finally{
            setLoading(false);
        }

    };

    return (
      <div className={styles.authFormContainer}>
        <h2>Recuperar contraseña</h2>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className={styles.formGroup}>
                <label htmlFor="email">Correo electrónico:</label>
                <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    placeholder="ejemplo@correo.com"
                />
       </div>
         <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
          </button>

          <div className={styles.authLinks}>
            <a href="/login">Volver a iniciar sesión</a>
            </div>
        </form>
      </div>
        );
    }