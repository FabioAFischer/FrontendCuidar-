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

export async function cadastrarInstituicao(dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/cadastrar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao cadastrar instituicao."));
  }

  return response.json().catch(() => null);
}

export async function listarInstituicoes(page = 0, size = 100) {
  const response = await fetch(
    `${API_BASE_URL}/instituicao/listar_todas?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao buscar instituicoes."));
  }

  const data = await response.json();
  return Array.isArray(data.content) ? data.content : [];
}

export async function buscarInstituicaoPorId(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/listar/${id}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Instituicao nao encontrada."));
  }

  return response.json();
}

export async function atualizarInstituicao(id, dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/atualizar/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao atualizar instituicao."));
  }

  return response.json().catch(() => null);
}

export async function deletarInstituicao(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/deletar/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao deletar instituicao."));
  }

  return response.json().catch(() => null);
}
