const BASE_URL = "http://localhost:8080/api";

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