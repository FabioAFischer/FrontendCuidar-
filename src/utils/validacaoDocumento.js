export function somenteNumeros(valor = "") {
  return String(valor).replace(/\D/g, "");
}

export function formatarCPF(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 11);

  return numeros
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatarCNPJ(valor = "") {
  const numeros = somenteNumeros(valor).slice(0, 14);

  return numeros
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function formatarCpfCnpj(valor = "") {
  const numeros = somenteNumeros(valor);
  return numeros.length > 11 ? formatarCNPJ(numeros) : formatarCPF(numeros);
}

export function documentoRepetido(documento = "") {
  const numeros = somenteNumeros(documento);
  return numeros.length > 0 && /^(\d)\1+$/.test(numeros);
}

export function cpfValido(cpf = "") {
  const numeros = somenteNumeros(cpf);

  if (numeros.length !== 11 || documentoRepetido(numeros)) {
    return false;
  }

  const calcularDigito = (base) => {
    let soma = 0;

    for (let i = 0; i < base.length; i += 1) {
      soma += Number(base[i]) * (base.length + 1 - i);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const primeiroDigito = calcularDigito(numeros.slice(0, 9));
  const segundoDigito = calcularDigito(numeros.slice(0, 10));

  return (
    primeiroDigito === Number(numeros[9]) &&
    segundoDigito === Number(numeros[10])
  );
}

export function cnpjValido(cnpj = "") {
  const numeros = somenteNumeros(cnpj);

  if (numeros.length !== 14 || documentoRepetido(numeros)) {
    return false;
  }

  const calcularDigito = (base) => {
    const pesos = base.length === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    const soma = base
      .split("")
      .reduce((total, numero, index) => total + Number(numero) * pesos[index], 0);

    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const primeiroDigito = calcularDigito(numeros.slice(0, 12));
  const segundoDigito = calcularDigito(numeros.slice(0, 13));

  return (
    primeiroDigito === Number(numeros[12]) &&
    segundoDigito === Number(numeros[13])
  );
}

/**
 * Valida número de celular brasileiro (9 dígitos + DDD)
 * Padrão ANATEL:
 * - DDD: 2 dígitos (11 a 99)
 * - Número: 9 dígitos (começa com 9, segundo dígito 6-9)
 * 
 * Exemplos válidos: (48) 99789-7890 | 48 99789-7890 | 4899789-7890
 * Exemplo inválido: 48 90789-7890 (falta o 9, tem apenas 8 dígitos)
 */
export function celularValido(ddd = "", telefone = "") {
  const dddNumeros = somenteNumeros(String(ddd));
  const telNumeros = somenteNumeros(String(telefone));

  // DDD deve ter 2 dígitos
  if (dddNumeros.length !== 2) {
    return false;
  }

  // Celular deve ter exatamente 9 dígitos
  if (telNumeros.length !== 9) {
    return false;
  }

  // Primeiro dígito deve ser 9
  if (telNumeros[0] !== "9") {
    return false;
  }

  // Segundo dígito deve ser 6, 7, 8 ou 9 (padrão ANATEL para celular)
  if (!/[6-9]/.test(telNumeros[1])) {
    return false;
  }

  return true;
}
