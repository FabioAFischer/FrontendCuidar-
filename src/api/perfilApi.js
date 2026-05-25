import { getAuthHeaders } from "./authApi";
import { API_BASE_URL } from "./env";

async function requestGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: getAuthHeaders(),
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
      return requestGet(`/instituicao/listar/${id}`);
    case "CUIDADOR":
      return requestGet(`/cuidador/listar/${id}`);
    case "ADMINISTRADOR":
      return requestGet(`/administrador/listar/${id}`);
    default:
      return Promise.reject(new Error("Perfil não identificado."));
  }
}