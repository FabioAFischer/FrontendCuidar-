import BcLogo from "../Bclogo/BcLogo";
import "./BcFormModal.css";

export default function BcFormModal({
  title,
  subtitle,
  error,
  children,
  onSubmit,
  noValidate = true,
  className = "",
}) {
  const classes = ["bc-form-modal", className].filter(Boolean).join(" ");

  return (
    <section className={classes}>
      <div className="bc-form-modal__header">
        <BcLogo size="md" />
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>

      <form className="bc-form-modal__form" onSubmit={onSubmit} noValidate={noValidate}>
        {error ? <div className="bc-form-modal__error" role="alert">{error}</div> : null}
        {children}
      </form>
    </section>
  );
}

export function BcFormModalRow({ children, className = "" }) {
  const classes = ["bc-form-modal__row", className].filter(Boolean).join(" ");
  return <div className={classes}>{children}</div>;
}

export function BcFormModalTextarea({
  id,
  label,
  name,
  placeholder,
  value,
  onChange,
}) {
  return (
    <div className="bc-form-modal__textareaGroup">
      <label htmlFor={id} className="bc-form-modal__label">{label}</label>
      <textarea
        id={id}
        name={name}
        className="bc-form-modal__textarea"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}
