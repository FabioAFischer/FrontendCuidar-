import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

export async function buscarDadosRelatorioInstituicao() {
  const res = await fetch(`${API_BASE_URL}/instituicao/relatorio`, {
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Erro ao buscar dados do relatório.");
  }

  return data;
}