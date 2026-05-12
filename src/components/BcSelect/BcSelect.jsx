import "./BcSelect.css";

export default function BcSelect({
  value,
  onChange,
  options = [],
  placeholder,
  className = "",
}) {
  return (
    <select
      className={`bc-select ${className}`}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}