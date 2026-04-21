import BcLogo from "../Bclogo/BcLogo";
import "./BcTopbar.css";

export default function BcTopbar({
  title,
  subtitle,
  actionLabel = "Sair",
  actionIcon = null,
  onAction,
}) {
  return (
    <header className="bc-topbar">
      <div className="bc-topbar__inner">
        <div className="bc-topbar__brand">
          <BcLogo size="lg" />

          <div className="bc-topbar__titles">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </div>

        <button className="bc-topbar__action" type="button" onClick={onAction}>
          {actionIcon}
          {actionLabel}
        </button>
      </div>
    </header>
  );
}
