import BcBotao from "../BcBotao/BcBotao";
import "./BcSecaoVazia.css";

export default function BcSecaoVazia({
  icon,
  title,
  count,
  buttonLabel,
  onAction,
  emptyIcon,
  emptyText,
  tone = "primary",
}) {
  return (
    <section className="bc-empty-section">
      <div className="bc-empty-section__header">
        <div className="bc-empty-section__titleWrap">
          <span className={`bc-empty-section__titleIcon bc-empty-section__titleIcon--${tone}`}>
            {icon}
          </span>
          <h2>
            {title} ({count})
          </h2>
        </div>

        <BcBotao onClick={onAction} fullWidth={false}>
          <span className="bc-empty-section__plus">+</span>
          {buttonLabel}
        </BcBotao>
      </div>

      <div className="bc-empty-section__content">
        <div className="bc-empty-section__emptyIcon">{emptyIcon}</div>
        <p>{emptyText}</p>
      </div>
    </section>
  );
}
