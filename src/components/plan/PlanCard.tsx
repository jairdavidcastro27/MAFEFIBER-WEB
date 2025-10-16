import React from "react";
import type { Plan } from "./PlanList";
import styles from "./css/PlanCard.module.css";

function PlanCard({ name, price, speed_mbps, description, image_url, features }: Plan) {
  const whatsappNumber = "51956025773";

  const getWhatsappMessage = () => {
    let msg = `Buenas, vengo por su página web y deseo contratar sus servicios de internet. 
Plan: ${name}
Velocidad: ${speed_mbps} Mbps
Precio: S/ ${price}/mes`;
    if (description) msg += `\nDetalles: ${description}`;
    return encodeURIComponent(msg);
  };

  const handleActivateClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const url = `https://wa.me/${whatsappNumber}?text=${getWhatsappMessage()}`;
    window.open(url, "_blank");
  };

  // Procesar features desde la base de datos
  const featureList = features
    ? features.split(",").map((f: string) => f.trim()).filter((f: string) => f.length > 0)
    : [];

  return (
    <div className={styles.card}>
      {image_url && (
        <img
          src={image_url}
          alt={`Logo de ${name}`}
          className={styles.logo}
        />
      )}
        <h3>📡 {name}</h3>
      <div className={styles.speed}>
        
        <span className={styles.speedIcon}>⚜</span>
        <span>{speed_mbps} Mbps</span>
      </div>
   
      <h3>S/ {price}/mes</h3>
      
      <ul className={styles.features}>
        {featureList.length > 0
          ? featureList.map((f, i) => <li key={i}>{f}</li>)
          : <li>No hay características registradas</li>
        }
      </ul>
      {description && <p className={styles.desc}>📋 {description}</p>}
      <a
        href="#"
        className={styles["activate-btn"]}
        onClick={handleActivateClick}
      >
        🔥 ACTIVAR {name}
      </a>
    </div>
  );
}

export default PlanCard;