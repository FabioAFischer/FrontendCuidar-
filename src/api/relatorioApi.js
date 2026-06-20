import { montarCabecalhosAutenticacao } from "./authApi";
import { API_BASE_URL } from "./env";

const BASE_URL = API_BASE_URL;

export async function buscarDadosRelatorio() {
  const res = await fetch(`${BASE_URL}/admin/relatorio`, {
    headers: montarCabecalhosAutenticacao(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Erro ao buscar dados do relatório.");
  }

  return res.json();
}