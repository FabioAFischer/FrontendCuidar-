/**
 * BcInput — Campo de texto reutilizável do BomCuidado
 *
 * Props:
 *   label       : string   — rótulo do campo
 *   name        : string   — name/id do input
 *   type        : string   — "text" | "email" | "tel" | "password" (default: "text")
 *   placeholder : string
 *   value       : string
 *   onChange    : fn
 *   maxLength   : number
 *   autoComplete: string
 *   inputMode   : string   — modo do teclado virtual
 *   suffix      : ReactNode — elemento no canto direito (ex: botão de olho)
 *   hint        : ReactNode — mensagem abaixo do input (ex: força da senha)
 *   error       : string   — mensagem de erro inline
 */
import "./BcInput.css";

export default function BcInput({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  maxLength,
  autoComplete,
  inputMode,
  suffix,
  hint,
  error,
}) {
  return (
    <div className="bc-input-group">
      {label && <label htmlFor={name} className="bc-input-label">{label}</label>}
      <div className={`bc-input-wrap ${error ? "bc-input-wrap--error" : ""}`}>
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className="bc-input"
        />
        {suffix && <div className="bc-input-suffix">{suffix}</div>}
      </div>
      {hint && <div className="bc-input-hint">{hint}</div>}
      {error && <span className="bc-input-error">{error}</span>}
    </div>
  );
}
