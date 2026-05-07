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

function normalizarCuidador(dados) {
  return {
    nome: dados.nome,
    cpf: somenteNumeros(dados.cpf),
    login: dados.login,
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
  return {
    id: dados.contatoId || dados.contato?.id,
    ddd: somenteNumeros(dados.contato?.ddd || dados.ddd),
    telefone: somenteNumeros(dados.contato?.telefone || dados.telefone),
    cuidadorId: dados.cuidadorId,
    idosos: dados.idosos || [],
  };
}

export async function listarCuidadores(page = 0, size = 100) {
  const response = await fetch(
    `${API_BASE_URL}/cuidador/listar_todos?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao buscar cuidadores."));
  }

  const data = await response.json();
  return Array.isArray(data.content) ? data.content : [];
}

export async function cadastrarCuidador(dados) {
  const response = await fetch(`${API_BASE_URL}/cuidador/cadastrar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizarCuidador(dados)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao cadastrar cuidador."));
  }

  return response.json().catch(() => null);
}

export async function atualizarCuidador(id, dados) {
  const response = await fetch(`${API_BASE_URL}/cuidador/atualizar/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizarCuidador(dados)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao atualizar cuidador."));
  }

  return response.json().catch(() => null);
}

export async function deletarCuidador(id) {
  const response = await fetch(`${API_BASE_URL}/cuidador/deletar/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao deletar cuidador."));
  }

  return response.json().catch(() => null);
}

export async function listarIdosos(page = 0, size = 100) {
  const response = await fetch(
    `${API_BASE_URL}/idoso/listar_todos?page=${page}&size=${size}`,
    { headers: getAuthHeaders() }
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao buscar idosos."));
  }

  const data = await response.json();
  return Array.isArray(data.content) ? data.content : [];
}

export async function cadastrarContato(dados) {
  const response = await fetch(`${API_BASE_URL}/contato/cadastrar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizarContato(dados)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao cadastrar contato."));
  }

  return response.json().catch(() => null);
}

export async function atualizarContato(id, dados) {
  const response = await fetch(`${API_BASE_URL}/contato/atualizar/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizarContato(dados)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao atualizar contato."));
  }

  return response.json().catch(() => null);
}

export async function deletarContato(id) {
  const response = await fetch(`${API_BASE_URL}/contato/deletar/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao deletar contato."));
  }

  return response.json().catch(() => null);
}

async function salvarContatoDoIdoso(dados) {
  if (dados.contatoId) {
    return atualizarContato(dados.contatoId, dados);
  }

  return cadastrarContato(dados);
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

async function salvarIdoso(dados) {
  const response = await fetch(`${API_BASE_URL}/idoso/cadastrar`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizarIdoso(dados)),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao cadastrar idoso."));
  }

  return response.json().catch(() => null);
}

export async function atualizarIdoso(id, dados) {
  const contato = await salvarContatoDoIdoso(dados);

  const response = await fetch(`${API_BASE_URL}/idoso/atualizar/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(normalizarIdoso({
      ...dados,
      contatoId: contato?.id || dados.contatoId,
    })),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao atualizar idoso."));
  }

  return response.json().catch(() => null);
}

export async function cadastrarIdoso(dados) {
  return cadastrarIdosoComContato(dados);
}

export async function deletarIdoso(id) {
  const response = await fetch(`${API_BASE_URL}/idoso/deletar/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Erro ao deletar idoso."));
  }

  return response.json().catch(() => null);
}
