// Essa função faz a mesclagem de 2 objetos em um único objeto
// Se houver conflito de chaves, o valor do segundo objeto é priorizado

export function deepMerge(obj1: Record<any, any>, obj2: Record<any, any>) {
  const result = { ...obj1 }; // Copia o primeiro objeto

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      // Se a chave também está presente no obj1 e ambos são objetos, realiza a mesclagem recursiva
      if (
        typeof obj2[key] === 'object' &&
        obj2[key] !== null &&
        !Array.isArray(obj2[key]) &&
        typeof obj1[key] === 'object' &&
        obj1[key] !== null &&
        !Array.isArray(obj1[key])
      ) {
        result[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        // Caso contrário, usa o valor do obj2
        result[key] = obj2[key];
      }
    }
  }

  return result;
}
