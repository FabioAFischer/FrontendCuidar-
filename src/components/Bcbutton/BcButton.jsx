/**
 * BcButton — Botão principal do BomCuidado
 *
 * Props:
 *   children  : ReactNode
 *   onClick   : fn
 *   type      : "button" | "submit" | "reset" (default: "button")
 *   disabled  : boolean
 *   loading   : boolean  — substitui o texto por "Carregando..."
 *   variant   : "primary" | "ghost" (default: "primary")
 *   fullWidth : boolean  (default: true)
 */
import "./BcButton.css";

export default function BcButton({
  children,
  onClick,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  fullWidth = true,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`bc-button bc-button--${variant} ${fullWidth ? "bc-button--full" : ""}`}
    >
      {loading ? (
        <span className="bc-button-spinner" aria-label="Carregando" />
      ) : null}
      {loading ? "Carregando..." : children}
    </button>
  );
}