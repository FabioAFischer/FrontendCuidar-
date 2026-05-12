import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

const MOCK_TOKEN = "mock-cuidador-token";
const MOCK_PRESCRICOES_KEY = "prescricoesMockadas";

function getAuthTokenAtual() {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

function usandoCuidadorMockado() {
  return getAuthTokenAtual() === MOCK_TOKEN;
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

function listarPrescricoesMockadas() {
  const dados = JSON.parse(localStorage.getItem(MOCK_PRESCRICOES_KEY) || "[]");
  return Array.isArray(dados) ? dados : [];
}

function salvarPrescricoesMockadas(prescricoes) {
  localStorage.setItem(MOCK_PRESCRICOES_KEY, JSON.stringify(prescricoes));
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

function normalizarPrescricaoMock(dados) {
  return {
    ...normalizarPrescricao(dados),
    id: dados.id ? Number(dados.id) : Date.now(),
    remedioNome: dados.remedioNome || "",
    idosoNome: dados.idosoNome || "",
    dataCriacao: dados.dataCriacao || new Date().toISOString(),
    status: dados.status || "ATIVO",
  };
}

export async function listarPrescricoesPorIdoso(idosoId, page = 0, size = 100) {
  if (!idosoId) {
    return [];
  }

  if (usandoCuidadorMockado()) {
    return listarPrescricoesMockadas().filter((prescricao) =>
      Number(prescricao.idosoId) === Number(idosoId) && prescricao.status !== "INATIVO"
    );
  }

  const data = await requestApi(`/prescricao/idoso/${idosoId}?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar prescricoes.",
  });

  return conteudoPaginado(data);
}

export async function cadastrarPrescricao(dados) {
  if (usandoCuidadorMockado()) {
    const prescricoes = listarPrescricoesMockadas();
    const prescricao = normalizarPrescricaoMock(dados);
    salvarPrescricoesMockadas([prescricao, ...prescricoes]);
    return prescricao;
  }

  return requestApi("/prescricao/cadastrar", {
    method: "POST",
    dados: normalizarPrescricao(dados),
    fallback: "Erro ao cadastrar prescricao.",
  });
}

export async function atualizarPrescricao(id, dados) {
  if (usandoCuidadorMockado()) {
    const prescricoes = listarPrescricoesMockadas();
    const existente = prescricoes.find((prescricao) => Number(prescricao.id) === Number(id));
    const prescricaoAtualizada = normalizarPrescricaoMock({
      ...existente,
      ...dados,
      id,
      status: dados.status || existente?.status || "ATIVO",
    });

    salvarPrescricoesMockadas(
      prescricoes.map((prescricao) =>
        Number(prescricao.id) === Number(id) ? prescricaoAtualizada : prescricao
      )
    );

    return prescricaoAtualizada;
  }

  return requestApi(`/prescricao/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarPrescricao(dados),
    fallback: "Erro ao atualizar prescricao.",
  });
}

export async function inativarPrescricao(id) {
  if (usandoCuidadorMockado()) {
    const prescricoes = listarPrescricoesMockadas();
    salvarPrescricoesMockadas(
      prescricoes.map((prescricao) =>
        Number(prescricao.id) === Number(id) ? { ...prescricao, status: "INATIVO" } : prescricao
      )
    );
    return null;
  }

  return requestApi(`/prescricao/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar prescricao.",
  });
}
