import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../../api";
import "./css/ProductGrid.css";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  specs: string[];
  images?: string[];
  is_active: boolean;
};

type CartItem = Product & { quantity: number };


const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(9);
  const [isPageChanging, setIsPageChanging] = useState(false);
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  
  const searchDebounce = React.useRef<number | null>(null);

  useEffect(() => {
    loadProducts();
    // Cargar carrito desde localStorage (para que el botón funcione y sincronice con navbar)
    try {
      const stored = localStorage.getItem('cart');
      if (stored) setCart(JSON.parse(stored));
    } catch (e) { console.warn('No se pudo leer el carrito de localStorage', e); }
    return () => {
      if (searchDebounce.current) window.clearTimeout(searchDebounce.current);
    };
  }, []);

  const loadProducts = async (q?: string) => {
    try {
      const url = q && q.trim() !== "" ? `${API_BASE}/products?search=${encodeURIComponent(q)}` : `${API_BASE}/products`;
      const res = await axios.get<Product[]>(url);
      setProducts(res.data);
      setCurrentPage(1);
    } catch (err) {
      console.error('Error fetching products', err);
      setProducts([]);
    }
  };

  function handleSearchChange(value: string) {
    setQuery(value);
    if (searchDebounce.current) { window.clearTimeout(searchDebounce.current); searchDebounce.current = null; }
    searchDebounce.current = window.setTimeout(() => { loadProducts(value); }, 350) as unknown as number;
  }

  useEffect(() => {
    const getProductsPerPage = () => (window.innerWidth < 768 ? 3 : 9);
    setProductsPerPage(getProductsPerPage());

    const handleResize = () => {
      setProductsPerPage(getProductsPerPage());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // No cart, checkout or related functions here anymore

  // Carrito: solo agregar (el panel del carrito está en el navbar)
  const addToCart = (product: Product) => {
    setCart(prev => {
      const next = prev.some(item => item.id === product.id)
        ? prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...prev, { ...product, quantity: 1 }];
      try { localStorage.setItem('cart', JSON.stringify(next)); } catch(e){}
      window.dispatchEvent(new CustomEvent('cart-updated'));
      // also dispatch an explicit open-cart request so the navbar can open the dropdown immediately
      try {
        window.dispatchEvent(new CustomEvent('open-cart'));
        // extra fallback: dispatch again shortly after to avoid timing issues
        setTimeout(() => { try { window.dispatchEvent(new CustomEvent('open-cart')); } catch(e){} }, 120);
      } catch(e) {}
      return next;
    });
  };

  // Paginación solo para productos activos
  const activeProducts = products.filter(p => p.is_active);
  const indexOfLast = currentPage * productsPerPage;
  const indexOfFirst = indexOfLast - productsPerPage;
  const currentProducts = activeProducts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(activeProducts.length / productsPerPage);

  const handlePageChange = (page: number) => {
    setIsPageChanging(true);
    setCurrentPage(page);
    setTimeout(() => {
      const firstCard = document.querySelector(".products-grid .product-card");
      if (firstCard) firstCard.scrollIntoView({ behavior: "auto", block: "start" });
      setIsPageChanging(false);
    }, 100);
  };

  return (
    <div className="cyberpunk-bg">
      <section className="products-section">
        <div className="header-glow">
          <h1 className="section-title">
            <span className="glitch-text" data-text="NUESTROS PRODUCTOS">
              NUESTROS PRODUCTOS
            </span>
          </h1>
          <p className="subtitle">Tecnología futurista al alcance de tus manos</p>
          <div className="search-row">
            <input
              className="search-input"
              placeholder="Buscar por nombre o descripción..."
              value={query}
              onChange={e => handleSearchChange(e.target.value)}
              aria-label="Buscar productos"
            />
            <div className="search-actions">
              <button className="btn-search" onClick={() => loadProducts(query)}>Buscar</button>
              <button className="btn-clear" onClick={() => { setQuery(''); loadProducts(); }}>Limpiar</button>
            </div>
          </div>
        </div>

        {/* (carrito eliminado de esta vista) */}

        {isPageChanging && (
          <div className="page-loader">
            Cambiando de página...
          </div>
        )}
        <div className="products-grid">
          {currentProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} delay={index * 100} addToCart={addToCart} />
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={currentPage === i + 1 ? "active" : ""}
                onClick={() => handlePageChange(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

type ProductCardProps = {
  product: Product;
  delay: number;
  addToCart: (product: Product) => void;
};

const ProductCard: React.FC<ProductCardProps> = ({ product, delay, addToCart }) => {
  const images = product.images && product.images.length > 0 ? product.images : [""];
  const [selectedImage, setSelectedImage] = useState(images[0]);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  return (
    <div className="product-card" data-aos="fade-up" data-aos-delay={delay}>
      <div
        className="product-image-zoom-container"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={e => {
          const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
          setZoomPosition({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
          });
        }}
      >
        <img
          src={selectedImage}
          alt={product.name}
          className={`product-image${isZoomed ? " zoomed" : ""}`}
          style={
            isZoomed
              ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` }
              : undefined
          }
        />
      </div>


     
      <div className="gallery-thumbs">
        {(product.images || []).map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`${product.name} ${i}`}
            className={`thumb ${img === selectedImage ? "active" : ""}`}
            onClick={() => setSelectedImage(img)}
          />
        ))}
      </div>
      <div className="product-content">
        <h2 className="product-name">{product.name}</h2>
        <p className="product-description">{product.description}</p>
        <ul className="specs-list">
          {(product.specs || []).map((spec, i) => (
            <li key={i} className="spec-item">
              ⚡ {spec}
            </li>
          ))}
        </ul>
        <div className="price-section">
          <span className="product-price">S/ {product.price}</span>
        </div>
        <button className="product-button" onClick={() => addToCart(product)}>
          <span>AGREGAR AL CARRITO</span>
          <div className="button-scan"></div>
        </button>
      </div>
      <div className="card-border"></div>
    </div>
  );
};

export default Products;