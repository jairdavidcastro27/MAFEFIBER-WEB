import { useEffect } from 'react';
import './CartModal.css';

declare global {
  interface Window { openCartModal?: () => void }
}

function readCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]'); }catch(e){ return []; } }
function saveCart(c:any){ localStorage.setItem('cart', JSON.stringify(c)); window.dispatchEvent(new CustomEvent('cart-updated')); }
function formatPrice(v:any){ return 'S/ ' + (Number(v)||0).toFixed(2); }

export default function CartModal(){
  useEffect(()=>{
    // Build DOM structure only once
    if (typeof document === 'undefined') return;

    let root = document.getElementById('cart-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'cart-modal-root';
      root.setAttribute('role','dialog');
      root.setAttribute('aria-modal','true');
      root.setAttribute('aria-hidden','true');
      root.innerHTML = `
        <div id="cart-modal-overlay"></div>
        <div id="cart-modal">
          <header>
            <div>
              <h3 style="margin:0">Carrito de compras</h3>
              <div class="subtitle">Revisa tus productos antes de pagar</div>
            </div>
            <button id="cart-modal-close" aria-label="Cerrar carrito" style="background:transparent;border:0;color:#fff;font-size:18px;cursor:pointer">✕</button>
          </header>
          <div class="body">
            <div id="cm-empty" class="cm-empty">Tu carrito está vacío</div>
            <ul id="cm-list" class="cm-list" role="list"></ul>
          </div>
          <footer>
            <div class="cm-footer-left">
              <div style="font-size:12px;color:var(--muted)">Resumen</div>
              <div class="cm-footer-total">Total: <span id="cm-total">S/ 0.00</span></div>
            </div>
            <div class="cm-actions">
              <button id="cm-clear" class="cm-btn cm-btn--danger">Vaciar</button>
              <button id="cm-checkout" class="cm-btn cm-btn--primary">Pagar</button>
            </div>
          </footer>
        </div>
      `;
      document.body.appendChild(root);
    }

    const overlay = document.getElementById('cart-modal-overlay');
    const closeBtn = document.getElementById('cart-modal-close');
    const listEl = document.getElementById('cm-list');
    const emptyEl = document.getElementById('cm-empty');
    const totalEl = document.getElementById('cm-total');
    const clearBtn = document.getElementById('cm-clear');
    const checkoutBtn = document.getElementById('cm-checkout');
    const headerEl = document.querySelector('#cart-modal header') as HTMLElement | null;

    function render(){
      const items = readCart() || [];
      if (!listEl || !emptyEl || !totalEl) return;
      listEl.innerHTML = '';
      if (!items.length) { emptyEl.style.display = 'block'; } else { emptyEl.style.display = 'none'; }
      // build items with DOM APIs to support image onerror and better structure
      function normalizeImageField(imgField:any){
        // handle falsy
        if (!imgField) return '/img/test-image.jpg';
        // if array, pick first usable
        if (Array.isArray(imgField) && imgField.length>0) {
          const first = imgField[0];
          // if string
          if (typeof first === 'string') return first;
          // if object, try to extract url/src/path
          if (typeof first === 'object') {
            return normalizeImageField(first.url || first.src || first.path || first.image || first.filename || first.file || Object.values(first)[0]);
          }
        }
        // if object, try known fields
        if (typeof imgField === 'object') {
          const candidate = imgField.url || imgField.src || imgField.path || imgField.image || imgField.filename || imgField.file || Object.values(imgField)[0];
          return normalizeImageField(candidate);
        }
        const s = String(imgField || '');
        if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/') || s.startsWith('data:')) return s;
        // fallback: try to prefix with '/'
        return s.startsWith('.') ? s.replace(/^[.\/]+/, '/') : '/' + s;
      }

      for (let i=0;i<items.length;i++){
        const it = items[i];
        const li = document.createElement('li'); li.className='cm-item';

        // Image
  const imgWrap = document.createElement('div');
  imgWrap.className = 'thumb';
        const img = document.createElement('img');
  img.loading = 'lazy';
  const src = normalizeImageField(it.image || it.images || it.picture || it.photos);
  img.src = src;
  img.alt = it.name || 'Producto';
  // visual sizing is handled by CSS .thumb img
  img.style.objectFit = 'cover';
  img.onerror = function(this:any){ this.onerror = null; this.src = '/img/test-image.jpg'; };
  imgWrap.appendChild(img);

        // Meta
        const meta = document.createElement('div'); meta.className = 'meta';
        const nameEl = document.createElement('div'); nameEl.className = 'name'; nameEl.textContent = it.name || '';
        meta.appendChild(nameEl);
        const descText = it.description || it.short_description || '';
        if (descText) { const descEl = document.createElement('div'); descEl.className = 'desc'; descEl.textContent = descText; meta.appendChild(descEl); }
        const priceEl = document.createElement('div'); priceEl.className = 'price'; priceEl.textContent = 'S/ ' + ((parseFloat(it.price)||0).toFixed(2)); meta.appendChild(priceEl);

        // Actions
        const actions = document.createElement('div'); actions.className = 'actions';
        const qty = document.createElement('div'); qty.className = 'cm-qty'; qty.setAttribute('role','group'); qty.setAttribute('aria-label','Cantidad');
        const btnDec = document.createElement('button'); btnDec.setAttribute('aria-label','Disminuir'); btnDec.setAttribute('data-action','dec'); btnDec.setAttribute('data-idx', String(i)); btnDec.textContent = '−';
        const count = document.createElement('div'); count.className = 'count'; count.textContent = String(it.quantity || 0);
        const btnInc = document.createElement('button'); btnInc.setAttribute('aria-label','Aumentar'); btnInc.setAttribute('data-action','inc'); btnInc.setAttribute('data-idx', String(i)); btnInc.textContent = '+';
        qty.appendChild(btnDec); qty.appendChild(count); qty.appendChild(btnInc);
        actions.appendChild(qty);

        const subtotal = document.createElement('div'); subtotal.style.marginTop = '6px'; subtotal.style.fontWeight = '700'; subtotal.textContent = formatPrice((parseFloat(it.price)||0) * (it.quantity||0)); actions.appendChild(subtotal);
        const removeBtn = document.createElement('button'); removeBtn.className = 'cm-remove'; removeBtn.setAttribute('data-action','remove'); removeBtn.setAttribute('data-idx', String(i)); removeBtn.textContent = 'Eliminar'; actions.appendChild(removeBtn);

  // Compose: append image wrapper first
  li.appendChild(imgWrap);
        li.appendChild(meta);
        li.appendChild(actions);
        listEl.appendChild(li);
      }
      let total = 0;
      const cartData = readCart();
      for (let j=0;j<cartData.length;j++) total += (parseFloat(cartData[j].price) || 0) * cartData[j].quantity;
      if (totalEl) totalEl.textContent = formatPrice(total);
        // ensure first item is not hidden under the header when header is sticky (mobile)
        try {
          if (headerEl && listEl) {
            const computed = window.getComputedStyle(headerEl).position || '';
            const isSticky = computed.indexOf('sticky') !== -1 || computed.indexOf('fixed') !== -1;
            if (isSticky || window.innerWidth <= 640) {
              const h = Math.ceil(headerEl.getBoundingClientRect().height);
              listEl.style.paddingTop = (h + 8) + 'px';
            } else {
              // desktop: remove the extra padding to avoid large empty space
              listEl.style.paddingTop = '';
            }
          }
        } catch(e) { /* ignore */ }
    }

    function open(){ if (!root) return; root.classList.add('open'); root.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; render(); }
    function close(){ if (!root) return; root.classList.remove('open'); root.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

    overlay && overlay.addEventListener('click', close);
    closeBtn && closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && root && root.classList.contains('open')) close(); });

    if (listEl) {
      listEl.addEventListener('click', function(e){
        const t = e.target as Element;
        if (!t) return;
        const action = t.getAttribute('data-action');
        const idxStr = t.getAttribute('data-idx');
        if (!action) return;
        const idx = idxStr ? parseInt(idxStr, 10) : -1;
        if (idx < 0) return;
        const cart = readCart();
        if (action === 'inc') { cart[idx].quantity = (cart[idx].quantity||0) + 1; saveCart(cart); render(); return; }
        if (action === 'dec') { cart[idx].quantity = Math.max(1, (cart[idx].quantity||1) - 1); saveCart(cart); render(); return; }
        if (action === 'remove') { cart.splice(idx, 1); saveCart(cart); render(); return; }
      });
    }

    if (clearBtn) clearBtn.addEventListener('click', function(){ localStorage.removeItem('cart'); window.dispatchEvent(new CustomEvent('cart-updated')); render(); });
    if (checkoutBtn) checkoutBtn.addEventListener('click', function(){
      const cart = readCart();
      if(!cart || cart.length === 0){ alert('El carrito está vacío'); return; }
      // Build a friendly WhatsApp message with products and totals
      try {
        const waNumber = '51956025773'; // change this number if needed
        const header = 'Buenas tardes señor Americo, vengo de la pagina y deseo comprar los siguientes productos. Espero su respuesta.';
        const lines: string[] = [header, ''];
        let total = 0;
        for (let i = 0; i < cart.length; i++) {
          const it = cart[i];
          const qty = Number(it.quantity) || 1;
          const price = Number(it.price) || 0;
          const subtotal = (qty * price) || 0;
          total += subtotal;
          lines.push(`${i+1}. ${it.name || 'Producto'} - Cantidad: ${qty} - Precio unit.: S/ ${price.toFixed(2)} - Subtotal: S/ ${subtotal.toFixed(2)}`);
        }
        lines.push('');
        lines.push(`Total: S/ ${total.toFixed(2)}`);
        const message = lines.join('\n');
        const payload = encodeURIComponent(message);
        const url = `https://wa.me/${waNumber}?text=${payload}`;
        window.open(url, '_blank');
      } catch (err) {
        console.error('Error building WhatsApp message', err);
        // fallback to checkout page if something goes wrong
        window.location.href = '/checkout';
      }
    });

    // Keep compatibility with previous inline code: listen to global events
    window.addEventListener('open-cart-modal', open as EventListener);
    window.addEventListener('cart-updated', render as EventListener);
    window.addEventListener('storage', function(e:any){ if (e.key === 'cart') render(); });

      // Adjust spacing when header size changes (use ResizeObserver if available)
      let _ro: any = null;
      function adjustSpacing(){
        try {
          if (headerEl && listEl) {
            const computed = window.getComputedStyle(headerEl).position || '';
            const isSticky = computed.indexOf('sticky') !== -1 || computed.indexOf('fixed') !== -1;
            if (isSticky || window.innerWidth <= 640) {
              const h = Math.ceil(headerEl.getBoundingClientRect().height);
              listEl.style.paddingTop = (h + 8) + 'px';
            } else {
              listEl.style.paddingTop = '';
            }
          }
        } catch(e){}
      }
      if (window.ResizeObserver && headerEl) {
        _ro = new ResizeObserver(adjustSpacing);
        _ro.observe(headerEl);
      }
      window.addEventListener('resize', adjustSpacing);

    // Expose helper for manual open
    window.openCartModal = open;

    // If element exists already, render once
    render();

    return () => {
      try {
        window.removeEventListener('open-cart-modal', open as any);
        window.removeEventListener('cart-updated', render as any);
        if (_ro && headerEl) _ro.disconnect();
        window.removeEventListener('resize', adjustSpacing);
      } catch(e){}
    };
  }, []);

  return null; // component only manages DOM injected into body
}
