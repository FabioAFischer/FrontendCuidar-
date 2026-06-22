import { montarCabecalhosAutenticacao } from "./authApi";
import { API_BASE_URL } from "./env";
import { extrairSomenteNumeros } from "../utils/validacaoDocumento";

function buscarInstituicaoIdAtual() {
  return Number(localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId"));
}

function buscarUsuarioIdAtual() {
  return Number(localStorage.getItem("usuarioId") || sessionStorage.getItem("usuarioId"));
}

async function extrairMensagemErro(response, fallback) {
  const erro = await response.json().catch(() => ({}));
  if (response.status === 401) return "Sua sessao expirou ou o login nao foi encontrado.";
  if (response.status === 403) return "Seu perfil nao tem permissao para executar esta acao.";
  return erro.message || fallback;
}

async function executarRequisicaoApi(path, { method = "GET", dados, fallback } = {}) {
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

export async function obterSenhaAcessoIdoso(idosoId, senhaCuidador) {
  const response = await fetch(`${API_BASE_URL}/idoso/${idosoId}/senha-acesso`, {
    method: "POST",
    headers: montarCabecalhosAutenticacao(),
    body: JSON.stringify({ senha: senhaCuidador }),
  });

  if (!response.ok) {
    const erro = await response.json().catch(() => ({}));
    throw new Error(erro.message || "Erro ao obter senha de acesso do idoso.");
  }

  return response.json().catch(() => null);
}

function extrairConteudoPaginado(data) {
  return Array.isArray(data?.content) ? data.content : Array.isArray(data) ? data : [];
}

function normalizarDadosCuidador(dados) {
  const cuidador = {
    nome: dados.nome?.trim(),
    cpf: extrairSomenteNumeros(dados.cpf),
    email: dados.email?.trim(),
    instituicaoId: dados.instituicaoId || buscarInstituicaoIdAtual(),
    contato: dados.contato || {
      id: dados.contatoId || dados.contato?.id,
      ddd: extrairSomenteNumeros(dados.ddd),
      telefone: extrairSomenteNumeros(dados.telefone),
    },
  };
  if (dados.senha?.trim()) cuidador.senha = dados.senha;
  return cuidador;
}

function normalizarDadosIdoso(dados) {
  return {
    nome: dados.nome,
    cpf: extrairSomenteNumeros(dados.cpf),
    observacoes: dados.observacoes,
    instituicaoId: dados.instituicaoId || buscarInstituicaoIdAtual(),
    contatoId: dados.contatoId,
  };
}

function normalizarDadosContato(dados) {
  const contato = {
    id: dados.contatoId || dados.contato?.id,
    ddd: extrairSomenteNumeros(dados.contato?.ddd || dados.ddd),
    telefone: extrairSomenteNumeros(dados.contato?.telefone || dados.telefone),
    cuidadorId: dados.cuidadorId,
  };
  if (dados.idosos) contato.idosos = dados.idosos;
  return contato;
}

/* ── Cuidadores ── */

export async function listarCuidadores(page = 0, size = 100) {
  const data = await executarRequisicaoApi(`/cuidador/listar_todos?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar cuidadores.",
  });
  const instituicaoId = buscarInstituicaoIdAtual();
  return extrairConteudoPaginado(data).filter((c) => Number(c.instituicaoId) === instituicaoId);
}

export async function cadastrarCuidador(dados) {
  return executarRequisicaoApi("/cuidador/cadastrar", {
    method: "POST",
    dados: normalizarDadosCuidador(dados),
    fallback: "Erro ao cadastrar cuidador.",
  });
}

export async function atualizarCuidador(id, dados) {
  return executarRequisicaoApi(`/cuidador/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarDadosCuidador(dados),
    fallback: "Erro ao atualizar cuidador.",
  });
}

export async function reativarCuidador(id, dados) {
  return executarRequisicaoApi(`/cuidador/reativar/${id}`, {
    method: "PUT",
    dados: normalizarDadosCuidador(dados),
    fallback: "Erro ao reativar cuidador.",
  });
}

export async function excluirCuidador(id) {
  return executarRequisicaoApi(`/cuidador/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar cuidador.",
  });
}

/* ── Idosos ── */

export async function listarIdosos(page = 0, size = 100) {
  const data = await executarRequisicaoApi(`/idoso/listar_todos?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar idosos.",
  });
  return extrairConteudoPaginado(data);
}

export async function listarIdososDoCuidador(cuidadorId = buscarUsuarioIdAtual(), page = 0, size = 100) {
  const vinculosData = await executarRequisicaoApi(`/vinculo/cuidador/${cuidadorId}?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar vinculos do cuidador.",
  });
  const vinculos = extrairConteudoPaginado(vinculosData);
  if (vinculos.length === 0) return [];

  const idosos = await listarIdosos(0, 100);
  const idsVinculados = new Set(vinculos.map((v) => Number(v.idosoId)));
  return idosos
    .filter((i) => idsVinculados.has(Number(i.id)))
    .map((i) => ({ ...i, vinculo: vinculos.find((v) => Number(v.idosoId) === Number(i.id)) }));
}

export async function buscarIdosoPorCpf(cpf) {
  const cpfLimpo = extrairSomenteNumeros(cpf);
  if (cpfLimpo.length !== 11) return null;

  const response = await fetch(`${API_BASE_URL}/idoso/trazerdados/${cpfLimpo}`, {
    method: "GET",
    headers: montarCabecalhosAutenticacao(),
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(await extrairMensagemErro(response, "Erro ao buscar idoso pelo CPF."));
  return response.json().catch(() => null);
}

/* ── Contatos ── */

export async function cadastrarContato(dados) {
  return executarRequisicaoApi("/contato/cadastrar", {
    method: "POST",
    dados: normalizarDadosContato(dados),
    fallback: "Erro ao cadastrar contato.",
  });
}

export async function atualizarContato(id, dados) {
  return executarRequisicaoApi(`/contato/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarDadosContato(dados),
    fallback: "Erro ao atualizar contato.",
  });
}

export async function excluirContato(id) {
  return executarRequisicaoApi(`/contato/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar contato.",
  });
}

async function salvarContatoVinculadoAoIdoso(dados) {
  if (dados.contatoId) return atualizarContato(dados.contatoId, dados);
  return cadastrarContato(dados);
}

async function cadastrarIdosoSimples(dados) {
  return executarRequisicaoApi("/idoso/cadastrar", {
    method: "POST",
    dados: normalizarDadosIdoso(dados),
    fallback: "Erro ao cadastrar idoso.",
  });
}

async function cadastrarIdosoComContatoInicial(dados) {
  const contato = await cadastrarContato(dados);
  try {
    return await cadastrarIdosoSimples({ ...dados, contatoId: contato?.id });
  } catch (erro) {
    if (contato?.id) await excluirContato(contato.id).catch(() => null);
    throw erro;
  }
}

export async function atualizarIdoso(id, dados) {
  const contato = await salvarContatoVinculadoAoIdoso(dados);
  return executarRequisicaoApi(`/idoso/atualizar/${id}`, {
    method: "PUT",
    dados: normalizarDadosIdoso({ ...dados, contatoId: contato?.id || dados.contatoId }),
    fallback: "Erro ao atualizar idoso.",
  });
}

export async function cadastrarIdoso(dados) {
  return cadastrarIdosoComContatoInicial(dados);
}

export async function excluirIdoso(id) {
  return executarRequisicaoApi(`/idoso/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar idoso.",
  });
}

/* ── Vínculos ── */

export async function listarVinculos(page = 0, size = 100) {
  const data = await executarRequisicaoApi(`/vinculo/listar_todos?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar vínculos.",
  });
  return extrairConteudoPaginado(data);
}

export async function listarVinculosPorIdoso(idosoId, page = 0, size = 100) {
  const data = await executarRequisicaoApi(`/vinculo/idoso/${idosoId}?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar vínculos do idoso.",
  });
  return extrairConteudoPaginado(data);
}

export async function listarVinculosPorCuidador(cuidadorId, page = 0, size = 100) {
  const data = await executarRequisicaoApi(`/vinculo/cuidador/${cuidadorId}?page=${page}&size=${size}`, {
    fallback: "Erro ao buscar vínculos do cuidador.",
  });
  return extrairConteudoPaginado(data);
}

export async function criarVinculo({ cuidadorId, idosoId }) {
  return executarRequisicaoApi("/vinculo/cadastrar", {
    method: "POST",
    dados: { cuidadorId, idosoId },
    fallback: "Erro ao criar vínculo.",
  });
}

export async function excluirVinculo(id) {
  return executarRequisicaoApi(`/vinculo/deletar/${id}`, {
    method: "DELETE",
    fallback: "Erro ao deletar vínculo.",
  });
}

export async function definirVinculoEmergencia(vinculoId) {
  return executarRequisicaoApi(`/vinculo/${vinculoId}/emergencia`, {
    method: "PUT",
    fallback: "Erro ao definir vínculo de emergência.",
  });
}
