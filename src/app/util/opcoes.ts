// Hook com o estado de tamanho/papel/quantidade, escolhendo automaticamente a primeira combinação com preço.
import { useEffect, useState } from 'react';
import { precoUnitario } from '../../compartilhado/calculo';
import type { CatalogoResposta } from '../../compartilhado/tipos';

export function useOpcoes(dados: CatalogoResposta | null, modeloId: number | null, exigirPreco: boolean) {
  const [tamanhoId, setTamanhoId] = useState<number | null>(null);
  const [papelId, setPapelId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState(1);

  const temPreco = (t: number, p: number) =>
    !exigirPreco || (dados ? precoUnitario(dados.precos, modeloId, t, p) !== null : false);

  // Seleção inicial: primeira combinação válida.
  useEffect(() => {
    if (!dados || tamanhoId !== null) return;
    for (const t of dados.tamanhos) {
      const papel = dados.papeis.find((p) => temPreco(t.id, p.id));
      if (papel) {
        setTamanhoId(t.id);
        setPapelId(papel.id);
        return;
      }
    }
  }, [dados, modeloId]);

  function mudarTamanho(id: number) {
    setTamanhoId(id);
    if (papelId === null || !temPreco(id, papelId)) {
      setPapelId(dados?.papeis.find((p) => temPreco(id, p.id))?.id ?? null);
    }
  }

  return {
    tamanhoId,
    papelId,
    quantidade,
    mudarTamanho,
    setPapelId,
    setQuantidade,
    papelDisponivel: (p: number) => tamanhoId !== null && temPreco(tamanhoId, p),
    reiniciar: () => setQuantidade(1),
  };
}
