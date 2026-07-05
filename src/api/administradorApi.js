import { montarCabecalhosAutenticacao } from "./authApi";
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

export async function cadastrarInstituicao(dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/cadastrar`, {
    method: "POST",
    headers: montarCabecalhosAutenticacao(),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Erro ao cadastrar instituicao."));
  }

  return response.json().catch(() => null);
}

export async function listarInstituicoes(page = 0, size = 100) {
  const response = await fetch(
    `${API_BASE_URL}/instituicao/listar_todas?page=${page}&size=${size}`,
    {
      headers: montarCabecalhosAutenticacao(),
    }
  );

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Erro ao buscar instituicoes."));
  }

  const data = await response.json();

  return Array.isArray(data.content) ? data.content : [];
}

export async function listarInstituicoesPaginado(page = 0, size = 5, status) {
  const query = new URLSearchParams({ page, size });
  if (status && status !== "TODAS") query.set("status", status);

  const response = await fetch(
    `${API_BASE_URL}/instituicao/listar_todas?${query.toString()}`,
    {
      headers: montarCabecalhosAutenticacao(),
    }
  );

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Erro ao buscar instituicoes."));
  }

  const data = await response.json();
  const itens = Array.isArray(data.content) ? data.content : [];

  return {
    itens,
    totalPaginas: Number.isFinite(data.totalPages) ? data.totalPages : 1,
    totalItens: Number.isFinite(data.totalElements) ? data.totalElements : itens.length,
  };
}

export async function buscarInstituicaoPorId(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/listar/${id}`, {
    headers: montarCabecalhosAutenticacao(),
  });

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Instituicao nao encontrada."));
  }

  return response.json();
}

export async function atualizarInstituicao(id, dados) {
  const response = await fetch(`${API_BASE_URL}/instituicao/atualizar/${id}`, {
    method: "PUT",
    headers: montarCabecalhosAutenticacao(),
    body: JSON.stringify(dados),
  });

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Erro ao atualizar instituicao."));
  }

  return response.json().catch(() => null);
}

export async function excluirInstituicao(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/deletar/${id}`, {
    method: "DELETE",
    headers: montarCabecalhosAutenticacao(),
  });

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Erro ao inativar instituicao."));
  }

  return response.json().catch(() => null);
}

export async function reativarInstituicao(id) {
  const response = await fetch(`${API_BASE_URL}/instituicao/ativar/${id}`, {
    method: "PATCH",
    headers: montarCabecalhosAutenticacao(),
  });

  if (!response.ok) {
    throw new Error(await extrairMensagemErro(response, "Erro ao ativar instituicao."));
  }

  return response.json().catch(() => null);
}