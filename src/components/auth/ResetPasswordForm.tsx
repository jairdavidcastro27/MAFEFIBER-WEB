import { useState, useEffect } from "react";
import styles from "./css/Auth.module.css";
import axios from "axios";
import { API_BASE } from "../../api";

export default function ResetPasswordForm() {
    const [token, setToken] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tokenParam = params.get("token");
        if (tokenParam) setToken(tokenParam);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }

        try {
            await axios.post(`${API_BASE}/reset-password`, {
                token,
                new_password: password
            });
            setSuccess("Contraseña restablecida correctamente");
            setTimeout(() => { window.location.href = "/login"; }, 2000);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Error al restablecer la contraseña");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authFormContainer}>
            <h2>Restablecer Contraseña</h2>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}
            <form onSubmit={handleSubmit} className={styles.authForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="password">Nueva contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Ingresa tu nueva contraseña"
                        minLength={6}
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="confirmPassword">Confirmar contraseña:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Confirma tu nueva contraseña"
                        minLength={6}
                    />
                </div>
                <button type="submit" className={styles.submitButton} disabled={loading || !token}>
                    {loading ? "Restableciendo..." : "Restablecer contraseña"}
                </button>
                <div className={styles.authLinks}>
                    <a href="/login">Volver al inicio de sesión</a>
                </div>
            </form>
        </div>
    );
}