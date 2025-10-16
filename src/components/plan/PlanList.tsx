import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../api";
import PlanCard from "./PlanCard";
import styles from "./css/PlanCard.module.css";

export interface Plan {
  id: number;
  name: string;
  speed_mbps: number;
  price: number;
  description?: string | null;
  image_url?: string;
  features?: string | null;
}

// Tipo para la respuesta de la galería
type GalleryImage = {
  id: number;
  urls: string[];
  alt_text?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
};

function PlanList() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [galleryImage, setGalleryImage] = useState<string>("");
  const [galleryImageSinTV, setGalleryImageSinTV] = useState<string>("");

  useEffect(() => {
    axios.get<Plan[]>(`${API_BASE}/plans`)
      .then(res => setPlans(res.data))
      .catch(() => setPlans([]));

    // Tipar la respuesta de la galería
    // Imagen para planes con TV (id 4)
    axios.get<GalleryImage>(`${API_BASE}/gallery-images/4`)
      .then(res => {
        if (res.data && res.data.urls && res.data.urls.length > 0) {
          setGalleryImage(res.data.urls[0]);
        }
      })
      .catch(() => setGalleryImage(""));

    // Imagen para planes sin TV (id 1)
    axios.get<GalleryImage>(`${API_BASE}/gallery-images/3`)
      .then(res => {
        if (res.data && res.data.urls && res.data.urls.length > 0) {
          setGalleryImageSinTV(res.data.urls[0]);
        }
      })
      .catch(() => setGalleryImageSinTV(""));
  }, []);

  if (plans.length === 0) return <p>No hay planes disponibles en este momento.</p>;

  return (
    <div className={styles["plans-grid"]}>
      {plans.map(plan => {
        // Si el nombre del plan incluye "TV" usa la imagen de TV, si no, la de sin TV
        const isTV = plan.name.toLowerCase().includes("tv");
        const img = plan.image_url || (isTV ? galleryImage : galleryImageSinTV);
        return (
          <PlanCard
            key={plan.id}
            {...plan}
            image_url={img}
          />
        );
      })}
    </div>
  );
}

export default PlanList;