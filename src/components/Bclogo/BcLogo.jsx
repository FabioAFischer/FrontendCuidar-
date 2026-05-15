import "./BcLogo.css";
import logo from "../../assets/logo.svg";

const sizes = {
  sm: { icon: 28, text: 18 },
  md: { icon: 38, text: 24 },
  lg: { icon: 52, text: 32 },
};

export default function BcLogo({ size = "md" }) {
  const s = sizes[size];

  return (
    <div className="bc-logo">
      <img
        src={logo}
        alt="BomCuidado"
        style={{
          width: s.icon,
          height: s.icon,
        }}
      />

      <span
        className="bc-logo-nome"
        style={{ fontSize: s.text }}
      >
        BomCuidado
      </span>
    </div>
  );
}