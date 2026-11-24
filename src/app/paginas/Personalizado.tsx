import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBagOpen } from '@phosphor-icons/react';
import { Alerta } from '../componentes/Alerta';
import { AvisoQualidade, TextoQualidade } from '../componentes/AvisoQualidade';
import { AreaTexto } from '../componentes/Campo';
import { Botao } from '../componentes/Botao';
import { SeletorOpcoes } from '../componentes/SeletorOpcoes';
import { UploadFoto } from '../componentes/UploadFoto';
import { useCarrinho, type FotoEnviada } from '../loja/carrinho';
import { useCatalogo } from '../loja/catalogo';
import { useOpcoes } from '../util/opcoes';

export default function Personalizado() {
  const dados = useCatalogo((s) => s.dados);
  const adicionar = useCarrinho((s) => s.adicionar);
  const abrirGaveta = useCarrinho((s) => s.abrirGaveta);
  const opcoes = useOpcoes(dados, null, false);
  const [foto, setFoto] = useState<FotoEnviada | null>(null);
  const [referencia, setReferencia] = useState<FotoEnviada | null>(null);
  const [descricao, setDescricao] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [enviandoRef, setEnviandoRef] = useState(false);
  const [adicionado, setAdicionado] = useState(false);

  if (!dados) return null;
  const tamanho = dados.tamanhos.find((t) => t.id === opcoes.tamanhoId);
  const enviando = enviandoFoto || enviandoRef;
  const podeAdicionar = !!foto && !!referencia && !enviando && opcoes.tamanhoId !== null && opcoes.papelId !== null;

  function aoAdicionar() {
    if (!podeAdicionar || !foto || !referencia || opcoes.tamanhoId === null || opcoes.papelId === null) return;
    adicionar({
      tipo: 'personalizado',
      modeloId: null,
      modeloNome: 'Personalizado',
      tamanhoId: opcoes.tamanhoId,
      papelId: opcoes.papelId,
      quantidade: opcoes.quantidade,
      foto,
      fotoReferencia: referencia,
      descricao: descricao.trim() || undefined,
    });
    setFoto(null);
    setReferencia(null);
    setDescricao('');
    opcoes.reiniciar();
    setAdicionado(true);
    if (window.matchMedia('(max-width: 1023px)').matches) abrirGaveta();
  }

  return (
    <article className="space-y-4">
      <Link to="/" className="inline-flex h-11 items-center gap-1 font-bold text-primaria-escura">
        <ArrowLeft size={20} weight="bold" aria-hidden /> Catálogo
      </Link>
      <div className="cartao mx-auto max-w-2xl space-y-5 p-4 md:p-6">
        <div>
          <h1 className="text-[26px] md:text-[34px]">Modelo personalizado</h1>
          <p className="mt-2 text-texto-suave">
            Viu um modelo que não está aqui? Envie sua foto e a foto do modelo. O valor é combinado pelo WhatsApp.
          </p>
        </div>
        <div className="space-y-3">
          <UploadFoto
            rotulo="1. Sua foto"
            ajuda="A foto que vai ser impressa"
            valor={foto}
            aoMudar={(f) => {
              setFoto(f);
              setAdicionado(false);
            }}
            aoMudarEnviando={setEnviandoFoto}
          />
          <TextoQualidade texto={dados.config.avisoQualidade} />
          {foto && <AvisoQualidade largura={foto.largura} altura={foto.altura} tamanho={tamanho} />}
        </div>
        <UploadFoto
          rotulo="2. Foto do modelo de referência"
          ajuda="Print ou foto do modelo que você quer"
          valor={referencia}
          aoMudar={setReferencia}
          aoMudarEnviando={setEnviandoRef}
        />
        <SeletorOpcoes
          tamanhos={dados.tamanhos}
          papeis={dados.papeis}
          tamanhoId={opcoes.tamanhoId}
          papelId={opcoes.papelId}
          quantidade={opcoes.quantidade}
          aoMudarTamanho={opcoes.mudarTamanho}
          aoMudarPapel={opcoes.setPapelId}
          aoMudarQuantidade={opcoes.setQuantidade}
        />
        <AreaTexto
          rotulo="Observação (opcional)"
          placeholder="Ex.: quero igual ao modelo, com fundo rosa"
          maxLength={1000}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        <div className="flex items-baseline justify-between border-t border-borda pt-4">
          <span className="font-bold text-secundaria">Valor</span>
          <span className="font-titulo text-[28px] font-semibold text-primaria-escura">a orçar</span>
        </div>
        <Botao
          larguraTotal
          tamanho="destaque"
          icone={<ShoppingBagOpen size={24} weight="bold" aria-hidden />}
          disabled={!podeAdicionar}
          onClick={aoAdicionar}
        >
          {enviando ? 'Aguarde as fotos subirem...' : 'Adicionar ao carrinho'}
        </Botao>
        {adicionado && <Alerta tipo="sucesso">Adicionado ao carrinho!</Alerta>}
      </div>
    </article>
  );
}
