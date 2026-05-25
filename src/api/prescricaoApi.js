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

function normalizarPrescricao(dados) {
  return {
    remedioId: Number(dados.remedioId),
    idosoId: Number(dados.idosoId),
    dataFim: dados.dataFim || null,
    necessarioJejum: Boolean(dados.necessarioJejum),
    instrucao: dados.instrucao?.trim() || "",
    intervalo: Number(dados.intervalo),
    dosagem: dados.dosagem?.trim(),
  };
}

export async function listarPrescricoesPorIdoso(idosoId, page = 0, size = 100) {
  if (!idosoId) {
    return [];
  }

  const data = await requestApi(`/prescricao/idoso/${idosoId}?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar prescricoes.",
  });

  return conteudoPaginado(data);
}

export async function cadastrarPrescricao(dados) {
  return requestApi("/prescricao/cadastrar", {
    method: "POST",
    dados: normalizarPrescricao(dados),
    fallback: "Erro ao cadastrar prescricao.",
  });
}

export async function atualizarPrescricao(id, dados) {
  return requestApi(`/prescricao/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarPrescricao(dados),
    fallback: "Erro ao atualizar prescricao.",
  });
}

export async function inativarPrescricao(id) {
  return requestApi(`/prescricao/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar prescricao.",
  });
}
