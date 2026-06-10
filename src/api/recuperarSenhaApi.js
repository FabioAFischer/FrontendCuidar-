import { API_BASE_URL } from "./env";

const BASE_URL = API_BASE_URL;

async function request(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Erro inesperado.");
  }

  return data;
}

export function enviarIdentificador(identificador) {
  return request("/auth/recuperar-senha", { identificador });
}

export function verificarCodigo(email, codigo) {
  return request("/auth/verificar-recuperacao", { email, codigo });
}

export function definirNovaSenha(email, novaSenha) {
  return request("/auth/nova-senha", { email, novaSenha });
}

export function reenviarCodigo2FA({ identificador, perfil }) {
  const PERFIL_BACKEND = {
    administrador: "ADMINISTRADOR",
    instituicao:   "INSTITUICAO",
    cuidador:      "CUIDADOR",
  };

  return request("/auth/reenviar-codigo", {
    identificador,
    perfil: PERFIL_BACKEND[perfil] || perfil,
  });
}