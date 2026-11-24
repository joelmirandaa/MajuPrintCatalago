import { useCallback, useEffect, useState } from 'react';

/** Carrega dados assíncronos com estados de carregamento e erro. */
export function useCarregar<T>(buscar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const executar = useCallback(buscar, deps);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setDados(await executar());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar');
    } finally {
      setCarregando(false);
    }
  }, [executar]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { dados, setDados, erro, carregando, recarregar };
}
