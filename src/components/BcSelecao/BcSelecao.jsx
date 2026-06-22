import "./BcSelecao.css";

const IconeSeta = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

export default function BcSelecao({
  value,
  onChange,
  options = [],
}) {
  return (
    <div className="bc-select">
      <select
        className="bc-select__field"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <span className="bc-select__icon">
        <IconeSeta />
      </span>
    </div>
  );
}