import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, WhatsappLogo } from '@phosphor-icons/react';
import type { PedidoCriadoResposta } from '../../compartilhado/tipos';
import { Mascote } from '../componentes/Estados';
import { useCarrinho } from '../loja/carrinho';
import { CHAVE_ENVIADO } from './Finalizar';

function lerEnviado(): PedidoCriadoResposta | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_ENVIADO);
    return bruto ? (JSON.parse(bruto) as PedidoCriadoResposta) : null;
  } catch {
    return null;
  }
}

export default function Enviado() {
  const limpar = useCarrinho((s) => s.limpar);
  const [pedido] = useState(lerEnviado);

  useEffect(() => {
    if (pedido) limpar();
  }, [pedido, limpar]);

  return (
    <div className="cartao mx-auto flex max-w-xl flex-col items-center gap-4 p-6 text-center md:p-10">
      <div className="relative">
        <Mascote tamanho={130} />
        <Heart size={36} weight="fill" aria-hidden className="absolute -right-3 -top-2 animate-pulsar text-primaria" />
      </div>
      <h1>Pedido recebido!</h1>
      {pedido ? (
        <>
          <p className="text-texto-suave">
            Seu pedido <strong className="text-secundaria">#{pedido.codigo}</strong> foi salvo. Agora é só enviar a
            mensagem no WhatsApp que a gente combina os detalhes, a entrega e o pagamento.
          </p>
          <a
            href={pedido.linkWhatsapp}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-pilula bg-primaria px-8 text-lg font-bold text-secundaria transition-transform hover:-translate-y-0.5 hover:bg-primaria-hover active:scale-[0.97]"
          >
            <WhatsappLogo size={26} weight="bold" aria-hidden />
            Abrir WhatsApp novamente
          </a>
        </>
      ) : (
        <p className="text-texto-suave">Não encontramos um pedido recente neste aparelho.</p>
      )}
      <Link to="/" className="inline-flex h-11 items-center font-bold text-primaria-escura underline">
        Voltar ao catálogo
      </Link>
    </div>
  );
}
