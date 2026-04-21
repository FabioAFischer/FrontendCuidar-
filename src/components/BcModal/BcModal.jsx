/**
 * BcModal — Modal reutilizável do BomCuidado
 *
 * Props:
 *   aberto    : boolean
 *   onFechar  : fn
 *   children  : ReactNode
 */
import "./BcModal.css";

export default function BcModal({ aberto, onFechar, children }) {
  if (!aberto) return null;

  return (
    <div className="bcmodal-overlay" onClick={onFechar}>
      <div
        className="bcmodal-content"
        onClick={e => e.stopPropagation()}
      >
        <button className="bcmodal-fechar" onClick={onFechar} aria-label="Fechar modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}