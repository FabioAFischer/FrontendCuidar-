/**
 * BcForcaSenha — Barra de força de senha
 *
 * Props:
 *   password : string
 */
import "./BcForcaSenha.css";

function calcularForcaSenha(s) {
  if (!s) return null;
  let score = 0;
  if (s.length >= 8) score++;
  if (/[A-Z]/.test(s)) score++;
  if (/[0-9]/.test(s)) score++;
  if (/[^A-Za-z0-9]/.test(s)) score++;
  const levels = [
    { label: "Fraca",    color: "#e05252", pct: 25 },
    { label: "Razoável", color: "#e09a2e", pct: 50 },
    { label: "Boa",      color: "#5aab3f", pct: 75 },
    { label: "Forte",    color: "#0d9e8a", pct: 100 },
  ];
  return levels[Math.max(0, score - 1)];
}

export default function BcForcaSenha({ password }) {
  const s = calcularForcaSenha(password);
  if (!s) return null;
  return (
    <div className="bc-ps">
      <div className="bc-ps-bar">
        <div
          className="bc-ps-fill"
          style={{ width: `${s.pct}%`, background: s.color }}
        />
      </div>
      <span className="bc-ps-label" style={{ color: s.color }}>{s.label}</span>
    </div>
  );
}