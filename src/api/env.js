// Configurações globais do ambiente
// Futuramente substituir pelo valor de process.env.REACT_APP_API_URL
// Exemplo: const API_BASE_URL = process.env.REACT_APP_API_URL;

export const API_BASE_URL = "http://localhost:8080/api";

export const MOCK_2FA_ENABLED = false;
export const MOCK_2FA_USER = {
  id: 1,
  nome: "Instituicao Mock",
  perfil: "INSTITUICAO",
  token: "mock-2fa-token",
  tipo: "Bearer",
};
