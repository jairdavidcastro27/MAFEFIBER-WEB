import { useState } from "react";
import styles from "./css/Auth.module.css";
import axios from "axios";
import { API_BASE } from "../../api";

export default function RegisterForm() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Submit ejecutado");
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            console.log("Enviando datos:", { username, email, password, full_name: fullName });
            const response = await axios.post(`${API_BASE}/auth/register`, {
                username,
                email,
                password,
                full_name: fullName,
            });
            console.log("Respuesta de registro:", response);
            setSuccess("Cuenta creada exitosamente. Ahora puedes iniciar sesión.");
            setUsername("");
            setEmail("");
            setPassword("");
            setFullName("");
        } catch (err: any) {
            console.error("Error al crear la cuenta:", err);
            setError(err?.response?.data?.error || "Error al crear la cuenta");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authFormContainer}>
            <h2>Crear cuenta</h2>
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <form onSubmit={handleSubmit} className={styles.authForm}>
                <div className={styles.formGroup}>
                    <label htmlFor="username">Nombre de usuario:</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading}
                        placeholder="Tu nombre de usuario"
                    />
                </div>
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
                        placeholder="Tu contraseña"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="fullName">Nombre completo (opcional):</label>
                    <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={loading}
                        placeholder="Tu nombre completo"
                    />
                </div>

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                >
                    {loading ? "Creando cuenta..." : "Crear cuenta"}
                </button>
                <div className={styles.authLinks}>
                    <a href="/login">¿Ya tienes una cuenta? Inicia sesión</a>
                </div>
            </form>
        </div>
    );
}