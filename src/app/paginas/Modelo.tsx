import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ShoppingBagOpen } from '@phosphor-icons/react';
import { calcularLinha } from '../../compartilhado/calculo';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import { Alerta } from '../componentes/Alerta';
import { AvisoQualidade, TextoQualidade } from '../componentes/AvisoQualidade';
import { Botao } from '../componentes/Botao';
import { ImagemModelo } from '../componentes/CardModelo';
import { EstadoErro } from '../componentes/Estados';
import { SeletorOpcoes } from '../componentes/SeletorOpcoes';
import { UploadFoto } from '../componentes/UploadFoto';
import { useCarrinho, type FotoEnviada } from '../loja/carrinho';
import { useCatalogo } from '../loja/catalogo';
import { useOpcoes } from '../util/opcoes';

export default function Modelo() {
  const { id } = useParams();
  const dados = useCatalogo((s) => s.dados);
  const adicionar = useCarrinho((s) => s.adicionar);
  const abrirGaveta = useCarrinho((s) => s.abrirGaveta);
  const modelo = dados?.modelos.find((m) => m.id === Number(id));
  const opcoes = useOpcoes(dados, modelo?.id ?? null, true);
  const [foto, setFoto] = useState<FotoEnviada | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [adicionado, setAdicionado] = useState(false);

  if (!dados) return null;
  if (!modelo) {
    return (
      <div>
        <EstadoErro mensagem="Esse modelo não existe ou não está mais disponível." />
        <div className="text-center">
          <Link to="/" className="font-bold text-primaria-escura underline">
            Voltar ao catálogo
          </Link>
        </div>
      </div>
    );
  }

  const tamanho = dados.tamanhos.find((t) => t.id === opcoes.tamanhoId);
  const preco =
    opcoes.tamanhoId !== null && opcoes.papelId !== null
      ? calcularLinha(dados.precos, {
          tipo: 'catalogo',
          modeloId: modelo.id,
          tamanhoId: opcoes.tamanhoId,
          papelId: opcoes.papelId,
          quantidade: opcoes.quantidade,
        })
      : null;
  const podeAdicionar = modelo.disponivel && !!foto && !enviando && preco?.subtotalCentavos != null;

  function aoAdicionar() {
    if (!podeAdicionar || !foto || !modelo || opcoes.tamanhoId === null || opcoes.papelId === null) return;
    adicionar({
      tipo: 'catalogo',
      modeloId: modelo.id,
      modeloNome: modelo.nome,
      tamanhoId: opcoes.tamanhoId,
      papelId: opcoes.papelId,
      quantidade: opcoes.quantidade,
      foto,
    });
    setFoto(null);
    opcoes.reiniciar();
    setAdicionado(true);
    if (window.matchMedia('(max-width: 1023px)').matches) abrirGaveta();
  }

  return (
    <article className="space-y-4">
      <Link to="/" className="inline-flex h-11 items-center gap-1 font-bold text-primaria-escura">
        <ArrowLeft size={20} weight="bold" aria-hidden /> Catálogo
      </Link>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <div className="cartao self-start overflow-hidden p-2">
          <ImagemModelo modelo={modelo} className="aspect-square w-full rounded-md" />
        </div>
        <div className="cartao space-y-5 p-4 md:p-6">
          <div>
            <h1 className="text-[26px] md:text-[34px]">{modelo.nome}</h1>
            {modelo.descricao && <p className="mt-2 text-texto-suave">{modelo.descricao}</p>}
          </div>

          {!modelo.disponivel ? (
            <Alerta tipo="alerta">Esse modelo está esgotado no momento. Volte em breve!</Alerta>
          ) : (
            <>
              <SeletorOpcoes
                tamanhos={dados.tamanhos}
                papeis={dados.papeis}
                tamanhoId={opcoes.tamanhoId}
                papelId={opcoes.papelId}
                quantidade={opcoes.quantidade}
                aoMudarTamanho={opcoes.mudarTamanho}
                aoMudarPapel={opcoes.setPapelId}
                aoMudarQuantidade={opcoes.setQuantidade}
                papelDisponivel={opcoes.papelDisponivel}
              />
              <div className="space-y-3">
                <UploadFoto
                  rotulo="Sua foto"
                  ajuda="JPG, PNG, HEIC ou WEBP · até 25 MB"
                  valor={foto}
                  aoMudar={(f) => {
                    setFoto(f);
                    setAdicionado(false);
                  }}
                  aoMudarEnviando={setEnviando}
                />
                <TextoQualidade texto={dados.config.avisoQualidade} />
                {foto && <AvisoQualidade largura={foto.largura} altura={foto.altura} tamanho={tamanho} />}
              </div>
              <div className="flex items-baseline justify-between border-t border-borda pt-4">
                <span className="font-bold text-secundaria">Total do item</span>
                <span className="font-titulo text-[28px] font-semibold text-primaria-escura" aria-live="polite">
                  {preco?.subtotalCentavos != null ? formatarCentavos(preco.subtotalCentavos) : 'indisponível'}
                </span>
              </div>
              <Botao
                larguraTotal
                tamanho="destaque"
                icone={<ShoppingBagOpen size={24} weight="bold" aria-hidden />}
                disabled={!podeAdicionar}
                onClick={aoAdicionar}
              >
                {enviando ? 'Aguarde a foto subir...' : foto ? 'Adicionar ao carrinho' : 'Envie sua foto para adicionar'}
              </Botao>
              {adicionado && (
                <Alerta tipo="sucesso">
                  Adicionado ao carrinho! Quer outra cópia com outra foto? É só enviar de novo.
                </Alerta>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}
