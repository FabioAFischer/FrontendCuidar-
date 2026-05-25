import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

async function getErrorMessage(response, fallback) {
  const erro = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return "Sua sessao expirou ou o login nao foi encontrado.";
  }

  if (response.status === 403) {
    return "Seu perfil nao tem permissao para executar esta acao.";
  }

  return erro.message || fallback;
}

async function requestApi(path, { method = "GET", dados, fallback } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: getAuthHeaders(),
    body: dados ? JSON.stringify(dados) : undefined,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, fallback));
  }

  return response.json().catch(() => null);
}

function conteudoPaginado(data) {
  return Array.isArray(data?.content) ? data.content : [];
}

function normalizarRemedio(dados) {
  return {
    id: dados.id,
    nome: dados.nome?.trim(),
    observacao: dados.observacao?.trim() || "",
    status: dados.status || "ATIVO",
  };
}

export async function listarRemedios(page = 0, size = 100) {
  const data = await requestApi(`/remedio/listar_todas?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar remedios.",
  });

  return conteudoPaginado(data);
}

export async function buscarRemedioPorId(id) {
  return requestApi(`/remedio/listar/${id}`, {
    fallback: "Remedio nao encontrado.",
  });
}

export async function cadastrarRemedio(dados) {
  return requestApi("/remedio/cadastrar", {
    method: "POST",
    dados: normalizarRemedio(dados),
    fallback: "Erro ao cadastrar remedio.",
  });
}

export async function atualizarRemedio(id, dados) {
  return requestApi(`/remedio/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarRemedio(dados),
    fallback: "Erro ao atualizar remedio.",
  });
}

export async function inativarRemedio(id) {
  return requestApi(`/remedio/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar remedio.",
  });
}

export const deletarRemedio = inativarRemedio;
