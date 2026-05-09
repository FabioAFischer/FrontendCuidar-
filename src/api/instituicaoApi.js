import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

function getInstituicaoId() {
  return Number(localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId"));
}

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

function normalizarCuidador(dados) {
  return {
    nome: dados.nome?.trim(),
    cpf: somenteNumeros(dados.cpf),
    email: dados.email?.trim(),
    login: dados.login?.trim(),
    senha: dados.senha,
    instituicaoId: dados.instituicaoId || getInstituicaoId(),
    contato: dados.contato || {
      ddd: somenteNumeros(dados.ddd),
      telefone: somenteNumeros(dados.telefone),
    },
  };
}

function normalizarIdoso(dados) {
  return {
    nome: dados.nome,
    cpf: somenteNumeros(dados.cpf),
    observacoes: dados.observacoes,
    instituicaoId: dados.instituicaoId || getInstituicaoId(),
    contatoId: dados.contatoId,
  };
}

function normalizarContato(dados) {
  const contato = {
    id: dados.contatoId || dados.contato?.id,
    ddd: somenteNumeros(dados.contato?.ddd || dados.ddd),
    telefone: somenteNumeros(dados.contato?.telefone || dados.telefone),
    cuidadorId: dados.cuidadorId,
  };

  if (dados.idosos) {
    contato.idosos = dados.idosos;
  }

  return contato;
}

export async function listarCuidadores(page = 0, size = 100) {
  const data = await requestApi(`/cuidador/listar_todos?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar cuidadores.",
  });

  return conteudoPaginado(data);
}

export async function cadastrarCuidador(dados) {
  return requestApi("/cuidador/cadastrar", {
    method: "POST",
    dados: normalizarCuidador(dados),
    fallback: "Erro ao cadastrar cuidador.",
  });
}

export async function atualizarCuidador(id, dados) {
  return requestApi(`/cuidador/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarCuidador(dados),
    fallback: "Erro ao atualizar cuidador.",
  });
}

export async function deletarCuidador(id) {
  return requestApi(`/cuidador/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar cuidador.",
  });
}

export async function listarIdosos(page = 0, size = 100) {
  const data = await requestApi(`/idoso/listar_todos?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar idosos.",
  });

  return conteudoPaginado(data);
}

export async function cadastrarContato(dados) {
  return requestApi("/contato/cadastrar", {
    method: "POST",
    dados: normalizarContato(dados),
    fallback: "Erro ao cadastrar contato.",
  });
}

export async function atualizarContato(id, dados) {
  return requestApi(`/contato/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarContato(dados),
    fallback: "Erro ao atualizar contato.",
  });
}

export async function deletarContato(id) {
  return requestApi(`/contato/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar contato.",
  });
}

async function salvarContatoDoIdoso(dados) {
  if (dados.contatoId) {
    return atualizarContato(dados.contatoId, dados);
  }

  return cadastrarContato(dados);
}

async function salvarIdoso(dados) {
  return requestApi("/idoso/cadastrar", {
    method: "POST",
    dados: normalizarIdoso(dados),
    fallback: "Erro ao cadastrar idoso.",
  });
}

async function cadastrarIdosoComContato(dados) {
  const contato = await cadastrarContato(dados);

  try {
    return await salvarIdoso({
      ...dados,
      contatoId: contato?.id,
    });
  } catch (erro) {
    if (contato?.id) {
      await deletarContato(contato.id).catch(() => null);
    }

    throw erro;
  }
}

export async function atualizarIdoso(id, dados) {
  const contato = await salvarContatoDoIdoso(dados);

  return requestApi(`/idoso/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarIdoso({
      ...dados,
      contatoId: contato?.id || dados.contatoId,
    }),
    fallback: "Erro ao atualizar idoso.",
  });
}

export async function cadastrarIdoso(dados) {
  return cadastrarIdosoComContato(dados);
}

export async function deletarIdoso(id) {
  return requestApi(`/idoso/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar idoso.",
  });
}
