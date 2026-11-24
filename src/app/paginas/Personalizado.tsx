import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBagOpen } from '@phosphor-icons/react';
import {
  LIMITE_CM,
  NOME_ITEM_PERSONALIZADO,
  OPCOES_MODELO,
  ROTULO_OPCAO_MODELO,
  TEXTO_LIMITE,
  lerMedidaCm,
  validarMedida,
  type OpcaoModelo,
} from '../../compartilhado/personalizado';
import { removerFoto } from '../api';
import { Alerta } from '../componentes/Alerta';
import { AreaTexto, Campo } from '../componentes/Campo';
import { Botao } from '../componentes/Botao';
import { SeletorOpcoes } from '../componentes/SeletorOpcoes';
import { UploadFoto } from '../componentes/UploadFoto';
import { useCarrinho, type FotoEnviada } from '../loja/carrinho';
import { useCatalogo } from '../loja/catalogo';
import { useOpcoes } from '../util/opcoes';

/** Aceita só dígitos e um separador decimal enquanto a cliente digita. */
function filtrarMedida(texto: string): string {
  const limpo = texto.replace(/[^\d,.]/g, '');
  const [inteiro = '', ...resto] = limpo.split(/[,.]/);
  return (resto.length ? `${inteiro},${resto.join('').slice(0, 1)}` : inteiro).slice(0, 5);
}

const AJUDA_OPCAO: Record<OpcaoModelo, string> = {
  referencia: 'Anexe uma imagem para orientar a produção',
  apenas_foto: 'Seguimos só com a sua foto, sem referência',
};

export default function Personalizado() {
  const dados = useCatalogo((s) => s.dados);
  const adicionar = useCarrinho((s) => s.adicionar);
  const abrirGaveta = useCarrinho((s) => s.abrirGaveta);
  const opcoes = useOpcoes(dados, null, false);
  const idOpcaoModelo = useId();
  const [foto, setFoto] = useState<FotoEnviada | null>(null);
  const [referencia, setReferencia] = useState<FotoEnviada | null>(null);
  const [descricao, setDescricao] = useState('');
  const [opcaoModelo, setOpcaoModelo] = useState<OpcaoModelo | null>(null);
  const [medidaLivre, setMedidaLivre] = useState(false);
  const [larguraTexto, setLarguraTexto] = useState('');
  const [alturaTexto, setAlturaTexto] = useState('');
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [enviandoRef, setEnviandoRef] = useState(false);
  const [adicionado, setAdicionado] = useState(false);

  if (!dados) return null;
  const comReferencia = opcaoModelo === 'referencia';

  // Validação em tempo real: cada campo tem o seu limite (largura 21 cm, altura 29,7 cm).
  const erroLargura = validarMedida('largura', larguraTexto);
  const erroAltura = validarMedida('altura', alturaTexto);
  const larguraCm = erroLargura ? null : lerMedidaCm(larguraTexto);
  const alturaCm = erroAltura ? null : lerMedidaCm(alturaTexto);
  const medidasValidas = larguraCm !== null && alturaCm !== null;

  // A referência só conta (e só pode travar o botão) quando a cliente escolheu enviá-la.
  const enviando = enviandoFoto || (comReferencia && enviandoRef);
  const tamanhoOk = medidaLivre ? medidasValidas : opcoes.tamanhoId !== null;
  const referenciaOk = opcaoModelo === 'apenas_foto' || (comReferencia && !!referencia);
  const podeAdicionar = !!foto && referenciaOk && !enviando && tamanhoOk && opcoes.papelId !== null;
  const pendencias = [
    !foto && 'sua foto',
    opcaoModelo === null && 'escolher a opção de modelo',
    comReferencia && !referencia && 'a imagem de referência',
    !tamanhoOk && (medidaLivre ? `largura e altura em cm (até ${TEXTO_LIMITE})` : 'o tamanho'),
  ].filter(Boolean);

  function escolherOpcao(opcao: OpcaoModelo) {
    setOpcaoModelo(opcao);
    setAdicionado(false);
  }

  function aoAdicionar() {
    if (!podeAdicionar || !foto || !opcaoModelo || opcoes.papelId === null) return;
    if (medidaLivre ? larguraCm === null || alturaCm === null : opcoes.tamanhoId === null) return;
    // Uma referência enviada e depois descartada ("Apenas minha foto") é apagada do servidor.
    if (!comReferencia && referencia) removerFoto(referencia.uploadId).catch(() => undefined);
    adicionar({
      tipo: 'personalizado',
      modeloId: null,
      modeloNome: NOME_ITEM_PERSONALIZADO[opcaoModelo],
      opcaoModelo,
      tamanhoId: medidaLivre ? null : opcoes.tamanhoId,
      medidas: medidaLivre && larguraCm !== null && alturaCm !== null ? { larguraCm, alturaCm } : undefined,
      papelId: opcoes.papelId,
      quantidade: opcoes.quantidade,
      foto,
      fotoReferencia: comReferencia && referencia ? referencia : undefined,
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
            Envie sua foto, escolha o modelo e o tamanho, inclusive com medidas sob medida. O valor é combinado pelo
            WhatsApp.
          </p>
        </div>
        <div className="space-y-2">
          <UploadFoto
            rotulo="1. Foto para impressão"
            ajuda="A foto que vai ser impressa"
            valor={foto}
            aoMudar={(f) => {
              setFoto(f);
              setAdicionado(false);
            }}
            aoMudarEnviando={setEnviandoFoto}
          />
          <p className="text-sm text-texto-suave">
            Envie sua foto na melhor qualidade possível, preferencialmente em HD, para garantir um bom resultado na
            impressão.
          </p>
        </div>
        <fieldset className="space-y-3">
          <legend id={idOpcaoModelo} className="mb-2 font-bold text-secundaria">
            2. Modelo
          </legend>
          <div role="radiogroup" aria-labelledby={idOpcaoModelo} aria-required="true" className="grid gap-2 sm:grid-cols-2">
            {OPCOES_MODELO.map((opcao) => {
              const ativa = opcaoModelo === opcao;
              return (
                <button
                  key={opcao}
                  type="button"
                  role="radio"
                  aria-checked={ativa}
                  onClick={() => escolherOpcao(opcao)}
                  className={`flex min-h-14 flex-col items-start justify-center rounded-md border-2 px-4 py-2 text-left transition-colors duration-200 ${
                    ativa ? 'border-primaria bg-primaria/10' : 'border-borda bg-white hover:border-primaria'
                  }`}
                >
                  <span className="font-bold text-secundaria">{ROTULO_OPCAO_MODELO[opcao]}</span>
                  <span className="text-sm text-texto-suave">{AJUDA_OPCAO[opcao]}</span>
                </button>
              );
            })}
          </div>
          {/* Fica montado (só oculto) para um envio em andamento não se perder ao trocar de opção. */}
          <div hidden={!comReferencia}>
            <UploadFoto
              rotulo="Imagem de referência"
              ajuda="Print ou foto do modelo que você quer"
              valor={referencia}
              aoMudar={setReferencia}
              aoMudarEnviando={setEnviandoRef}
            />
          </div>
        </fieldset>
        <SeletorOpcoes
          tamanhos={dados.tamanhos}
          papeis={dados.papeis}
          tamanhoId={opcoes.tamanhoId}
          papelId={opcoes.papelId}
          quantidade={opcoes.quantidade}
          aoMudarTamanho={(id) => {
            setMedidaLivre(false);
            opcoes.mudarTamanho(id);
          }}
          tamanhoPersonalizado={{
            ativo: medidaLivre,
            aoSelecionar: () => setMedidaLivre(true),
            campos: (
              <div className="rounded-md border-[1.5px] border-borda bg-fundo-secao p-3 md:p-4">
                <p className="mb-3 text-sm text-texto-suave">
                  Informe as medidas exatas em <strong className="text-secundaria">centímetros (cm)</strong>. Máximo:{' '}
                  {LIMITE_CM.largura} cm de largura × {LIMITE_CM.altura.toLocaleString('pt-BR')} cm de altura (A4).
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Campo
                    rotulo="Largura (cm)"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={`Até ${LIMITE_CM.largura}`}
                    value={larguraTexto}
                    onChange={(e) => setLarguraTexto(filtrarMedida(e.target.value))}
                    erro={erroLargura}
                  />
                  <Campo
                    rotulo="Altura (cm)"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder={`Até ${LIMITE_CM.altura.toLocaleString('pt-BR')}`}
                    value={alturaTexto}
                    onChange={(e) => setAlturaTexto(filtrarMedida(e.target.value))}
                    erro={erroAltura}
                  />
                </div>
              </div>
            ),
          }}
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
        {!enviando && !adicionado && pendencias.length > 0 && (
          <p className="text-center text-sm text-texto-suave">Para continuar, falta: {pendencias.join(', ')}.</p>
        )}
        {adicionado && <Alerta tipo="sucesso">Adicionado ao carrinho!</Alerta>}
      </div>
    </article>
  );
}
