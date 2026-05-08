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
