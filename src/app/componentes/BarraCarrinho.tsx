// Barra fixa inferior no celular: "3 itens · R$ 45,00 · Ver carrinho".
import { ShoppingBag } from '@phosphor-icons/react';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import { totalCarrinho, useCarrinho } from '../loja/carrinho';
import { selecionarPrecos, useCatalogo } from '../loja/catalogo';

export function BarraCarrinho() {
  const itens = useCarrinho((s) => s.itens);
  const abrir = useCarrinho((s) => s.abrirGaveta);
  const precos = useCatalogo(selecionarPrecos);
  if (itens.length === 0) return null;
  const total = totalCarrinho(itens, precos);
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-white/95 p-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={abrir}
        className="flex h-14 w-full items-center justify-between gap-3 rounded-pilula bg-primaria px-5 font-bold text-secundaria shadow-cartao active:scale-[0.98]"
      >
        <span className="flex items-center gap-2">
          <ShoppingBag size={24} weight="bold" aria-hidden />
          {itens.length} {itens.length === 1 ? 'item' : 'itens'} · {formatarCentavos(total.subtotalCentavos)}
          {total.temAOrcar ? '+' : ''}
        </span>
        <span>Ver carrinho</span>
      </button>
    </div>
  );
}
