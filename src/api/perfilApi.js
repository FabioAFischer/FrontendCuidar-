import { montarCabecalhosAutenticacao } from "./authApi";
import { API_BASE_URL } from "./env";

async function executarRequisicaoGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: montarCabecalhosAutenticacao(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Erro ao buscar dados do perfil.");
  }

  return data;
}

export function buscarPerfilUsuario() {
  const id     = localStorage.getItem("usuarioId")    || sessionStorage.getItem("usuarioId");
  const perfil = localStorage.getItem("perfil")       || sessionStorage.getItem("perfil");

  switch (perfil) {
    case "INSTITUICAO":
      return executarRequisicaoGet(`/instituicao/listar/${id}`);
    case "CUIDADOR":
      return executarRequisicaoGet(`/cuidador/listar/${id}`);
    case "ADMINISTRADOR":
      return executarRequisicaoGet(`/administrador/listar/${id}`);
    default:
      return Promise.reject(new Error("Perfil não identificado."));
  }
}