import React, { useEffect, useRef, useState } from "react";
import "./WhatsAppFloat.css";

type Message = { id: number; text: string; from: "bot" | "user"; link?: string; highlight?: boolean };

const WA_NUMBER = "51956025773";

const WhatsAppFloat: React.FC = () => {
  const [open, setOpen] = useState(false);
  // badge state: true means show notification dot
  const [hasNotification, setHasNotification] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, text: "Hola 👋 ¿En qué puedo ayudarte?", from: "bot" },
  ]);
  const [input, setInput] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const idRef = useRef(1);

  useEffect(() => {
    // keep scroll at bottom when messages change (use rAF + small timeout to ensure DOM updated)
    const el = messagesRef.current;
    if (!el) return;
    // wait for DOM paint, then scroll
    requestAnimationFrame(() => {
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 30);
    });
  }, [messages, open]);

  useEffect(() => {
    // Only keep Escape key handler now; outside clicks handled by overlay element.
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    // capture-phase click listener as a fallback to ensure outside clicks are detected
    function onDocClickCapture(e: MouseEvent) {
      try { console.debug('WhatsAppFloat: doc click (capture)', e.target); } catch {}
      if (!open) return;
      const float = document.getElementById('whatsapp-float');
      if (!float) return;
      const path = (e as any).composedPath ? (e as any).composedPath() : null;
      const clickedInside = path ? path.indexOf(float) >= 0 : (e.target instanceof Node ? float.contains(e.target) : false);
      if (!clickedInside) {
        try { console.debug('WhatsAppFloat: outside click detected - closing'); } catch {}
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClickCapture, true);
    return () => document.removeEventListener('click', onDocClickCapture, true);
  }, [open]);

  function closeChat(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    // helpful console logs during debugging
    try { console.debug('WhatsAppFloat: closeChat called'); } catch (err) {}
    setOpen(false);
  }

  function appendMessage(text: string, from: "bot" | "user", link?: string, highlight?: boolean) {
    const id = idRef.current++;
    setMessages((m) => [...m, { id, text, from, link, highlight }]);
  }

  function handleQuick(key: string) {
    if (!key) return;
    if (key === "instalacion") {
      appendMessage("¿La instalación es gratis?", "user");
      setTimeout(() =>
        appendMessage(
          "Sí, la instalación es completamente gratis en la mayoría de zonas.",
          "bot"
        )
      , 500);
    } else if (key === "horarios") {
      appendMessage("¿Qué horarios están disponibles?", "user");
      setTimeout(() => appendMessage("Atención de lunes a sábado de 8:00 a 20:00.", "bot"), 500);
    } else if (key === "hablar") {
      // build the exact prefixed message we want to send when opening WhatsApp
      const base = 'Buenas le escribo desde su pagina mi consulta es:';
      const extra = input && input.trim() ? ` ${input.trim()}` : '';
      const fullMessage = `${base}${extra}`;
      // append the prefixed message as a highlighted user message in the widget
      appendMessage(fullMessage, "user", undefined, true);
      // clear the input since we used its content
      setInput("");
      setTimeout(() => {
        appendMessage("Abriendo chat de WhatsApp...", "bot");
        const payload = encodeURIComponent(fullMessage);
        window.open(`https://wa.me/${WA_NUMBER}?text=${payload}`, "_blank");
      }, 500);
    } else if (key === "productos") {
      appendMessage("¿Venden productos para mi PC?", "user");
      setTimeout(() =>
        appendMessage("Sí, claro — aquí están nuestros productos:", "bot", "/products"),
      500);
    }
  }

  function handleSend() {
    const v = input.trim();
    if (!v) return;
    // prefix messages as requested and open WhatsApp to the real number with the prefixed text
    const prefixed = `Buenas le escribo desde su pagina mi consulta es: ${v}`;
    // append locally so the user sees their message in the widget
    appendMessage(prefixed, "user");
    setInput("");
    // open WhatsApp web/mobile with the prefilled message
    try {
      const payload = encodeURIComponent(prefixed);
      window.open(`https://wa.me/${WA_NUMBER}?text=${payload}`, "_blank");
    } catch (err) {
      console.error('Failed to open WhatsApp link', err);
    }
    // default bot reply
    setTimeout(() => appendMessage("Gracias por tu mensaje. Te responderemos por WhatsApp en breve.", "bot"), 700);
  }

  return (
    <div id="whatsapp-float">
      {/* overlay catches outside clicks */}
  {open ? <div className="wa-overlay" onClick={(e) => closeChat(e as any)} aria-hidden /> : null}
      <div id="wa-faq-chat" className={open ? "wa-open" : "wa-hidden"} role="dialog" aria-label="Chat de WhatsApp">
        <div className="wa-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="wa-avatar" aria-hidden>
              {/* small circular avatar with WA gradient */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0" stopColor="#25D366" />
                    <stop offset="1" stopColor="#128C7E" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="12" r="12" fill="url(#g1)" />
                <path d="M17.47 14.37c-.28-.14-1.65-.82-1.9-.91-.25-.09-.43-.14-.61.14-.19.28-.73.91-.89 1.1-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.25-1.39-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.12-.12.28-.32.42-.48.14-.16.19-.28.28-.47.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.02-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.36-.25.28-.96.94-.96 2.3 0 1.36.98 2.67 1.12 2.86.14.19 1.93 3.02 4.68 4.24 3.2 1.4 3.2 0.84 3.78 0.78.58-.06 1.87-.76 2.14-1.49.28-.73.28-1.36.19-1.49-.09-.13-.33-.21-.61-.35z" fill="#fff" />
              </svg>
              <span className="wa-online" />
            </div>
            <div>
              <div className="wa-title">MafeFiber</div>
              <div className="wa-sub">En línea · Lun-Sáb 8:00–20:00</div>
            </div>
          </div>
          <button className="wa-close" aria-label="Cerrar" onClick={(e) => closeChat(e)}>✕</button>
        </div>

        <div className="wa-quick">
          <button className="wa-quick-btn" onClick={() => handleQuick("instalacion")}>¿La instalación es gratis?</button>
          <button className="wa-quick-btn" onClick={() => handleQuick("horarios")}>¿Qué horarios tienen?</button>
          <button className="wa-quick-btn" onClick={() => handleQuick("hablar")}>Hablar con el proveedor</button>
          <button className="wa-quick-btn" onClick={() => handleQuick("productos")}>¿Venden productos para mi PC?</button>
        </div>

        <div id="wa-messages" ref={messagesRef} className="wa-messages">
          {messages.map((m) => (
            <div key={m.id} className={`wa-bubble ${m.from === "bot" ? "wa-bubble--bot" : "wa-bubble--user"} ${m.highlight ? 'wa-bubble--highlight' : ''}`}>
              {m.text}
              {m.link ? (
                <div style={{ marginTop: 8 }}>
                  <a href={m.link.startsWith("/") ? window.location.origin + m.link : m.link} target="_blank" rel="noreferrer">Ver productos</a>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="wa-actions">
          <input id="wa-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribe tu pregunta..." aria-label="Escribir mensaje" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }} />
          <button id="wa-send" onClick={handleSend} aria-label="Enviar">Enviar</button>
        </div>
      </div>

      <button id="wa-chat-btn" aria-label="Abrir chat de WhatsApp" onClick={(e) => { e.stopPropagation(); try { console.debug('WhatsAppFloat: toggle clicked'); } catch(_){}; setOpen((s) => { const next = !s; if (next) setHasNotification(false); return next }); }}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" />
        {/* notification badge */}
        {hasNotification ? <span className="wa-badge" aria-hidden /> : null}
      </button>
    </div>
  );
};

export default WhatsAppFloat;