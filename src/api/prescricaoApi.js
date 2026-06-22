import { montarCabecalhosAutenticacao, buscarTokenAutenticacao } from "./authApi";
import { API_BASE_URL } from "./env";

async function extrairMensagemErro(response, fallback) {
  const erro = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return "Sua sessao expirou ou o login nao foi encontrado.";
  }

  if (response.status === 403) {
    return "Seu perfil nao tem permissao para executar esta acao.";
  }

  return erro.message || fallback;
}

async function executarRequisicaoApi(path, { method = "GET", dados, fallback } = {}) {
  if (!buscarTokenAutenticacao()) {
    throw new Error("Sua sessao expirou ou o login nao foi encontrado.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: montarCabecalhosAutenticacao(),
    body: dados ? JSON.stringify(dados) : undefined,
  });

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, fallback));
  }

  return response.json().catch(() => null);
}

function extrairConteudoPaginado(data) {
  return Array.isArray(data?.content) ? data.content : [];
}

function normalizarDadosPrescricao(dados) {
  return {
    remedioId: Number(dados.remedioId),
    idosoId: Number(dados.idosoId),
    dataFim: dados.dataFim || null,
    necessarioJejum: Boolean(dados.necessarioJejum),
    instrucao: dados.instrucao || "",
    intervalo: Number(dados.intervalo),
    dosagem: dados.dosagem?.trim(),
  };
}

export async function listarPrescricoesPorIdoso(idosoId, page = 0, size = 100) {
  if (!idosoId) {
    return [];
  }

  const data = await executarRequisicaoApi(`/prescricao/idoso/${idosoId}?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar prescricoes.",
  });

  return extrairConteudoPaginado(data);
}

export async function cadastrarPrescricao(dados) {
  return executarRequisicaoApi("/prescricao/cadastrar", {
    method: "POST",
    dados: normalizarDadosPrescricao(dados),
    fallback: "Erro ao cadastrar prescricao.",
  });
}

export async function atualizarPrescricao(id, dados) {
  return executarRequisicaoApi(`/prescricao/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarDadosPrescricao(dados),
    fallback: "Erro ao atualizar prescricao.",
  });
}

export async function inativarPrescricao(id) {
  return executarRequisicaoApi(`/prescricao/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar prescricao.",
  });
}
