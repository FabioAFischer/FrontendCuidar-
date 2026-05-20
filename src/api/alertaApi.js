import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

async function getErrorMessage(response, fallback) {
  const erro = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return "Sessao expirada. Faca login novamente.";
  }

  if (response.status === 403) {
    return "Apenas cuidadores podem acessar alertas.";
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
    const erro = new Error(await getErrorMessage(response, fallback));
    erro.status = response.status;
    throw erro;
  }

  return response.json().catch(() => null);
}

function conteudoPaginado(data) {
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
}

function formatarDataAgendada(valor) {
  if (!valor) return "";
  return String(valor).length === 16 ? `${valor}:00` : valor;
}

function normalizarAlerta(dados) {
  const alerta = {
    idosoId: Number(dados.idosoId),
    tipoAlerta: dados.tipoAlerta,
    dataAgendada: formatarDataAgendada(dados.dataAgendada),
  };

  if (dados.statusAlertas) {
    alerta.statusAlertas = dados.statusAlertas;
  }

  return alerta;
}

export async function cadastrarAlerta(dados) {
  return requestApi("/alertas/cadastrar", {
    method: "POST",
    dados: normalizarAlerta(dados),
    fallback: "Erro ao cadastrar alerta.",
  });
}

export async function listarAlertas() {
  const data = await requestApi("/alertas/listar_todos", {
    fallback: "Erro ao buscar alertas.",
  });

  return conteudoPaginado(data);
}

export async function listarAlertasPorIdoso(idosoId) {
  if (!idosoId) return [];

  const data = await requestApi(`/alertas/idoso/${idosoId}`, {
    fallback: "Erro ao buscar alertas do idoso.",
  });

  return conteudoPaginado(data);
}

export async function atualizarAlerta(id, dados) {
  return requestApi(`/alertas/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarAlerta(dados),
    fallback: "Erro ao atualizar alerta.",
  });
}

export async function cancelarAlerta(id) {
  return requestApi(`/alertas/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao cancelar alerta.",
  });
}
