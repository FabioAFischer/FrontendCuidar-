import { getAuthHeaders } from "./authApi";

const BASE_URL = "http://localhost:8080/api";

async function listarTodos(path) {
  const res = await fetch(`${BASE_URL}${path}?size=9999`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Erro ao buscar ${path}`);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : [];
}

export async function buscarDadosRelatorio() {
  const [instituicoes, cuidadores, idosos] = await Promise.all([
    listarTodos("/instituicao/listar_todas"),
    listarTodos("/cuidador/listar_todos"),
    listarTodos("/idoso/listar_todos"),
  ]);

  return { instituicoes, cuidadores, idosos };
}