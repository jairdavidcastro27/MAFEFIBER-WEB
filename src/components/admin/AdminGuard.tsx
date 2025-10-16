import { useEffect, useState } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || !user.id_admin) {
      window.location.href = "/login";
    } else {
      setChecked(true);
    }
  }, []);

  if (!checked) return <div style={{color:"#fff",textAlign:"center",padding:"2rem"}}>Verificando acceso...</div>;
  return <>{children}</>;
}