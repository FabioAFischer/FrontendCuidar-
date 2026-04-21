// Serviços da API — Administrador
// Agrupa todas as chamadas relacionadas às ações do usuário administrador

import { API_BASE_URL } from "./env";

/* ── Instituição ── */

export async function cadastrarInstituicao(dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/cadastrar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.message || "Erro ao cadastrar instituição.");
  }

  return response.json().catch(() => null);
}

export async function listarInstituicoes(page = 0, size = 100) {
  const response = await fetch(
    `${API_BASE_URL}/instituicao/listar_todas?page=${page}&size=${size}`
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar instituições.");
  }

  // O backend retorna objeto paginado — as instituições ficam em data.content
  const data = await response.json();
  return Array.isArray(data.content) ? data.content : [];
}

export async function buscarInstituicaoPorId(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/listar/${id}`);

  if (!response.ok) {
    throw new Error("Instituição não encontrada.");
  }

  return response.json();
}

export async function atualizarInstituicao(id, dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/atualizar/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.message || "Erro ao atualizar instituição.");
  }

  return response.json().catch(() => null);
}

export async function deletarInstituicao(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/deletar/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Erro ao deletar instituição.");
  }

  return response.json().catch(() => null);
}