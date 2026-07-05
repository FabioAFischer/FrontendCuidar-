import { montarCabecalhosAutenticacao } from "./authApi";
import { API_BASE_URL } from "./env";

async function extrairMensagemErro(response, fallback) {
  const erro = await response.json().catch(() => ({}));

  if (response.status === 401) {
    return "Sessao expirada. Faca login novamente.";
  }

  if (response.status === 403) {
    return "Apenas cuidadores podem acessar alertas.";
  }

  return erro.message || fallback;
}

async function executarRequisicaoApi(path, { method = "GET", dados, fallback } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: montarCabecalhosAutenticacao(),
    body: dados ? JSON.stringify(dados) : undefined,
  });

  if (!response.ok) {
    const erro = new Error(await extrairMensagemErro(response, fallback));
    erro.status = response.status;
    throw erro;
  }

  return response.json().catch(() => null);
}

function extrairConteudoPaginado(data) {
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
}

function montarParametrosPaginacao(page, size, sort) {
  const parametros = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (sort) {
    parametros.set("sort", sort);
  }

  return parametros.toString();
}

async function listarConteudoPaginadoCompleto(path, { size = 100, sort = "data_agendade,asc", fallback } = {}) {
  const itens = [];
  let page = 0;
  let totalPages = 1;

  do {
    const separador = path.includes("?") ? "&" : "?";
    const data = await executarRequisicaoApi(
      `${path}${separador}${montarParametrosPaginacao(page, size, sort)}`,
      { fallback }
    );

    itens.push(...extrairConteudoPaginado(data));
    totalPages = Number.isFinite(Number(data?.totalPages)) ? Number(data.totalPages) : 1;
    page += 1;
  } while (page < totalPages);

  return itens;
}

function formatarDataAgendada(valor) {
  if (!valor) return "";
  return String(valor).length === 16 ? `${valor}:00` : valor;
}

function normalizarDadosAlerta(dados) {
  const alerta = {
    idosoId: Number(dados.idosoId),
    tipoAlerta: dados.tipoAlerta,
    dataAgendada: formatarDataAgendada(dados.dataAgendada),
  };

  if (dados.statusAlertas) {
    alerta.statusAlertas = dados.statusAlertas;
  }

  if (dados.prescricaoId) {
    alerta.prescricaoId = Number(dados.prescricaoId);
  }

  if (dados.medico) {
    alerta.medico = dados.medico.trim();
  }

  if (dados.especialidade) {
    alerta.especialidade = dados.especialidade.trim();
  }

  if (dados.local) {
    alerta.local = dados.local.trim();
  }

  if (dados.observacoes) {
    alerta.observacoes = dados.observacoes.trim();
  }

  return alerta;
}

export async function cadastrarAlerta(dados) {
  return executarRequisicaoApi("/alertas/cadastrar", {
    method: "POST",
    dados: normalizarDadosAlerta(dados),
    fallback: "Erro ao cadastrar alerta.",
  });
}

export async function listarAlertas(page = 0, size = 100) {
  if (page === 0) {
    return listarConteudoPaginadoCompleto("/alertas/listar_todos", {
      size,
      sort: "data_agendade,asc",
      fallback: "Erro ao buscar alertas.",
    });
  }

  const data = await executarRequisicaoApi(
    `/alertas/listar_todos?${montarParametrosPaginacao(page, size, "data_agendade,asc")}`,
    {
    fallback: "Erro ao buscar alertas.",
    }
  );

  return extrairConteudoPaginado(data);
}

export async function listarAlertasPorIdoso(idosoId, page = 0, size = 100) {
  if (!idosoId) return [];

  if (page === 0) {
    return listarConteudoPaginadoCompleto(`/alertas/idoso/${idosoId}`, {
      size,
      sort: "data_agendade,asc",
      fallback: "Erro ao buscar alertas do idoso.",
    });
  }

  const data = await executarRequisicaoApi(
    `/alertas/idoso/${idosoId}?${montarParametrosPaginacao(page, size, "data_agendade,asc")}`,
    {
    fallback: "Erro ao buscar alertas do idoso.",
    }
  );

  return extrairConteudoPaginado(data);
}

export async function atualizarAlerta(id, dados) {
  return executarRequisicaoApi(`/alertas/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarDadosAlerta(dados),
    fallback: "Erro ao atualizar alerta.",
  });
}

export async function cancelarAlerta(id) {
  return executarRequisicaoApi(`/alertas/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao cancelar alerta.",
  });
}
