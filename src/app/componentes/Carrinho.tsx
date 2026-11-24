// Carrinho: gaveta lateral no celular / coluna fixa no desktop (≥ 1024 px).
import { useNavigate } from 'react-router-dom';
import { ImageSquare, ShoppingBag, Trash, WarningCircle } from '@phosphor-icons/react';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import { removerFoto } from '../api';
import { fotoVencida, totalCarrinho, useCarrinho, type ItemCarrinho } from '../loja/carrinho';
import { selecionarPrecos, useCatalogo } from '../loja/catalogo';
import { Botao } from './Botao';
import { Modal } from './Modal';
import { SeletorQuantidade } from './SeletorOpcoes';

function LinhaItem({ item, valor }: { item: ItemCarrinho; valor: number | null }) {
  const catalogo = useCatalogo((s) => s.dados);
  const remover = useCarrinho((s) => s.remover);
  const alterarQuantidade = useCarrinho((s) => s.alterarQuantidade);
  const tamanho = catalogo?.tamanhos.find((t) => t.id === item.tamanhoId)?.nome ?? '—';
  const papel = catalogo?.papeis.find((p) => p.id === item.papelId)?.nome ?? '—';
  const vencida = fotoVencida(item);

  function aoRemover() {
    const removido = remover(item.idLocal);
    if (!removido) return;
    removerFoto(removido.foto.uploadId).catch(() => undefined);
    if (removido.fotoReferencia) removerFoto(removido.fotoReferencia.uploadId).catch(() => undefined);
  }

  return (
    <li className="flex gap-3 py-3">
      <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-fundo-secao">
        {item.foto.miniatura ? (
          <img src={item.foto.miniatura} alt="Sua foto" className="h-full w-full object-cover" />
        ) : (
          <ImageSquare size={28} weight="duotone" className="text-texto-suave" aria-hidden />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold leading-tight text-secundaria">{item.modeloNome}</p>
          <button
            type="button"
            onClick={aoRemover}
            aria-label={`Remover ${item.modeloNome}`}
            className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-texto-suave hover:bg-erro/10 hover:text-erro"
          >
            <Trash size={20} weight="bold" />
          </button>
        </div>
        <p className="text-sm text-texto-suave">
          {tamanho} · {papel}
        </p>
        {vencida && (
          <p className="mt-1 flex items-center gap-1 text-sm text-erro">
            <WarningCircle size={16} weight="bold" aria-hidden />A foto expirou. Remova e adicione de novo.
          </p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <SeletorQuantidade
            compacto
            rotulo={`Quantidade de ${item.modeloNome}`}
            valor={item.quantidade}
            aoMudar={(n) => alterarQuantidade(item.idLocal, n)}
          />
          <span className="font-bold text-primaria-escura">{valor === null ? 'a orçar' : formatarCentavos(valor)}</span>
        </div>
      </div>
    </li>
  );
}

function ConteudoCarrinho({ aoFinalizar }: { aoFinalizar: () => void }) {
  const itens = useCarrinho((s) => s.itens);
  const precos = useCatalogo(selecionarPrecos);
  const total = totalCarrinho(itens, precos);
  const algumaVencida = itens.some((i) => fotoVencida(i));

  if (itens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
        <ShoppingBag size={40} weight="duotone" className="text-primaria" aria-hidden />
        <p className="font-bold text-secundaria">Seu carrinho está vazio</p>
        <p className="text-sm text-texto-suave">Escolha um modelo e envie sua foto para começar.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 divide-y divide-borda overflow-y-auto px-4">
        {itens.map((item, i) => (
          <LinhaItem key={item.idLocal} item={item} valor={total.linhas[i]?.subtotalCentavos ?? null} />
        ))}
      </ul>
      <div className="space-y-3 border-t border-borda bg-white p-4">
        <div className="flex items-baseline justify-between">
          <span className="font-bold text-secundaria">Subtotal</span>
          <span className="font-titulo text-2xl font-semibold text-primaria-escura">
            {formatarCentavos(total.subtotalCentavos)}
          </span>
        </div>
        {total.temAOrcar && <p className="text-sm text-texto-suave">+ itens personalizados a orçar pelo WhatsApp</p>}
        <Botao larguraTotal tamanho="destaque" onClick={aoFinalizar} disabled={algumaVencida}>
          Finalizar
        </Botao>
      </div>
    </div>
  );
}

export function CarrinhoLateral() {
  const navegar = useNavigate();
  const quantidade = useCarrinho((s) => s.itens.length);
  return (
    <section aria-labelledby="titulo-carrinho" className="cartao flex h-full flex-col overflow-hidden">
      <h2 id="titulo-carrinho" className="border-b border-borda px-4 py-3 text-xl md:text-2xl">
        Carrinho {quantidade > 0 && <span className="text-texto-suave">({quantidade})</span>}
      </h2>
      <div className="min-h-0 flex-1">
        <ConteudoCarrinho aoFinalizar={() => navegar('/finalizar')} />
      </div>
    </section>
  );
}

export function CarrinhoGaveta() {
  const navegar = useNavigate();
  const aberta = useCarrinho((s) => s.gavetaAberta);
  const fechar = useCarrinho((s) => s.fecharGaveta);
  return (
    <Modal aberto={aberta} aoFechar={fechar} titulo="Seu carrinho" formato="lateral">
      <ConteudoCarrinho
        aoFinalizar={() => {
          fechar();
          navegar('/finalizar');
        }}
      />
    </Modal>
  );
}
