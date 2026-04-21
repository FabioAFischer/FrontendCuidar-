/**
 * BcLogo — Logo do BomCuidado com ícone SVG + nome
 *
 * Props:
 *   size : "sm" | "md" | "lg" (default: "md")
 */
import "./BcLogo.css";

const sizes = {
  sm: { icon: 28, text: 18 },
  md: { icon: 38, text: 24 },
  lg: { icon: 52, text: 32 },
};

export default function BcLogo({ size = "md" }) {
  const s = sizes[size];
  return (
    <div className="bc-logo">
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 38 38"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Cabeça */}
        <circle cx="19" cy="10" r="6" fill="#0d9e8a" />
        {/* Corpo / pin de localização */}
        <path
          d="M19 16 C11 16 6 22 6 27 L32 27 C32 22 27 16 19 16Z"
          fill="#0d9e8a"
        />
        {/* Pino */}
        <path
          d="M19 37 C19 37 11 28 11 22.5 C11 18.36 14.69 15 19 15 C23.31 15 27 18.36 27 22.5 C27 28 19 37 19 37Z"
          fill="#0d9e8a"
        />
        {/* Círculo interior do pino */}
        <circle cx="19" cy="22.5" r="3.5" fill="#fff" opacity="0.7" />
        {/* Brilho da cabeça */}
        <circle cx="19" cy="10" r="3" fill="#fff" opacity="0.35" />
        {/* Linhas laterais decorativas (ondas de sinal) */}
        <path
          d="M9 18 C7 20 7 24 9 26"
          stroke="#0d9e8a"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M29 18 C31 20 31 24 29 26"
          stroke="#0d9e8a"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="bc-logo-nome" style={{ fontSize: s.text }}>
        BomCuidado
      </span>
    </div>
  );
}