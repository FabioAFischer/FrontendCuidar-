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

function normalizarDadosRemedio(dados) {
  return {
    id: dados.id,
    nome: dados.nome?.trim(),
    observacao: dados.observacao || "",
    status: dados.status || "ATIVO",
  };
}

export async function listarRemedios(page = 0, size = 100) {
  const data = await executarRequisicaoApi(`/remedio/listar_todas?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar remedios.",
  });

  return extrairConteudoPaginado(data);
}

export async function buscarRemedioPorId(id) {
  return executarRequisicaoApi(`/remedio/listar/${id}`, {
    fallback: "Remedio nao encontrado.",
  });
}

export async function cadastrarRemedio(dados) {
  return executarRequisicaoApi("/remedio/cadastrar", {
    method: "POST",
    dados: normalizarDadosRemedio(dados),
    fallback: "Erro ao cadastrar remedio.",
  });
}

export async function atualizarRemedio(id, dados) {
  return executarRequisicaoApi(`/remedio/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarDadosRemedio(dados),
    fallback: "Erro ao atualizar remedio.",
  });
}

export async function inativarRemedio(id) {
  return executarRequisicaoApi(`/remedio/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar remedio.",
  });
}

export const excluirRemedio = inativarRemedio;
