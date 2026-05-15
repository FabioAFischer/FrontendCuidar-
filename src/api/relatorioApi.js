import { getAuthHeaders } from "./authApi";

const BASE_URL = "http://localhost:8080/api";

export async function buscarDadosRelatorio() {
  const res = await fetch(`${BASE_URL}/admin/relatorio`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Erro ao buscar dados do relatório.");
  }

  return res.json();
}