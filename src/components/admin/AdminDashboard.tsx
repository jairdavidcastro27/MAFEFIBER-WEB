import React from "react";
import styles from "./css/AdminDashboard.module.css";

const AdminDashboard = () => {
  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Panel de Administración</h1>
      <p className={styles.subtitle}>
        Bienvenido al dashboard de admin. Administra usuarios, planes y consulta
        reportes.
      </p>

      <div className={styles.cardsContainer}>
        {/* Usuarios */}
        <section className={`${styles.card} ${styles.cardUsuarios}`}>
          <h2 className={styles.cardTitle}>Usuarios</h2>
          <p className={styles.cardText}>
            Gestión de usuarios y Clientes.
          </p>
           <a
            href="admin/clientes/clientes"
            className={styles.cardButton}
          >
            Gestionar usuarios
          </a>
        </section>

        {/* Planes */}
        <section className={`${styles.card} ${styles.cardPlanes}`}>
          <h2 className={styles.cardTitle}>Planes</h2>
          <p className={styles.cardText}>
            Administrar planes y promociones.
          </p>
          <a
            href="admin/planes/planes"
            className={styles.cardButton}
          >
            Gestionar planes
          </a>
        </section>

        {/* Productos */}
        <section className={`${styles.card} ${styles.cardReportes}`}>
          <h2 className={styles.cardTitle}>Productos</h2>
          <p className={styles.cardText}>
            Gestionar Productos
          </p>
		  <a
            href="/admin/productos/productos"
            className={styles.cardButton}
          >
            Gestionar productos
          </a>
        </section>
      </div>
    </div>
  );
};

export default AdminDashboard;
