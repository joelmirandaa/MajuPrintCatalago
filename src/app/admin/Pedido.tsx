import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, DownloadSimple, FileZip, ImageSquare, WhatsappLogo } from '@phosphor-icons/react';
import { zip } from 'fflate';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import type { FotoPedido, PedidoCompleto, StatusPedido } from '../../compartilhado/tipos';
import { admin } from '../api';
import { Alerta } from '../componentes/Alerta';
import { Botao } from '../componentes/Botao';
import { Carregando, EstadoErro } from '../componentes/Estados';
import { formatarBytes } from '../util/imagem';
import { linkWhatsappCliente, mascararTelefone } from '../util/telefone';
import { useCarregar } from '../util/useCarregar';
import { COR_STATUS, ROTULO_STATUS, formatarData } from './rotulos';

const EXIBIVEIS = ['image/jpeg', 'image/png', 'image/webp'];

function nomeArquivo(codigo: string, itemIndice: number, foto: FotoPedido) {
  return `${codigo}_item${itemIndice + 1}_${foto.funcao}_${foto.nomeOriginal ?? `foto-${foto.id}`}`.replace(/[\\/:*?"<>|]/g, '_');
}

function baixarBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function CartaoFoto({ foto, codigo, indice }: { foto: FotoPedido; codigo: string; indice: number }) {
  const exibivel = foto.tipoMime && EXIBIVEIS.includes(foto.tipoMime);
  return (
    <figure className="overflow-hidden rounded-md border border-borda bg-white">
      <div className="grid aspect-square place-items-center bg-fundo-secao">
        {exibivel ? (
          <img src={admin.urlFoto(foto.id, true)} alt={`Foto ${foto.funcao} do item ${indice + 1}`} loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-texto-suave">
            <ImageSquare size={40} weight="duotone" aria-hidden />
            <span className="text-sm">{foto.tipoMime?.split('/')[1]?.toUpperCase() ?? 'arquivo'}</span>
          </div>
        )}
      </div>
      <figcaption className="space-y-1 p-2 text-sm">
        <span className={`inline-block rounded-pilula px-2 font-bold ${foto.funcao === 'cliente' ? 'bg-destaque/40' : 'bg-info/15 text-info'}`}>
          {foto.funcao === 'cliente' ? 'Foto da cliente' : 'Referência'}
        </span>
        <p className="truncate text-texto-suave" title={foto.nomeOriginal ?? ''}>
          {foto.nomeOriginal}
        </p>
        <p className="text-texto-suave">
          {foto.largura && foto.altura ? `${foto.largura}×${foto.altura} · ` : ''}
          {foto.bytes ? formatarBytes(foto.bytes) : ''}
        </p>
        <a
          href={admin.urlFoto(foto.id)}
          download={nomeArquivo(codigo, indice, foto)}
          className="inline-flex h-11 w-full items-center justify-center gap-1 rounded-pilula border-2 border-secundaria font-bold text-secundaria hover:bg-fundo-secao"
        >
          <DownloadSimple size={18} weight="bold" aria-hidden /> Baixar original
        </a>
      </figcaption>
    </figure>
  );
}

export default function Pedido() {
  const { codigo = '' } = useParams();
  const { dados: pedido, setDados, erro, carregando, recarregar } = useCarregar(() => admin.pedido(codigo), [codigo]);
  const [salvando, setSalvando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [zipando, setZipando] = useState<string | null>(null);

  if (carregando && !pedido) return <Carregando texto="Carregando pedido..." />;
  if (erro || !pedido) return <EstadoErro mensagem={erro ?? 'Pedido não encontrado'} aoTentarDeNovo={() => void recarregar()} />;

  async function mudarStatus(status: StatusPedido) {
    if (!pedido) return;
    setSalvando(true);
    setErroAcao(null);
    try {
      setDados(await admin.mudarStatus(pedido.codigo, status));
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Não foi possível mudar o status');
    } finally {
      setSalvando(false);
    }
  }

  async function baixarTodas(p: PedidoCompleto) {
    setErroAcao(null);
    const fotos = p.itens.flatMap((item, i) => item.fotos.map((f) => ({ f, i })));
    const arquivos: Record<string, Uint8Array> = {};
    try {
      for (const [n, { f, i }] of fotos.entries()) {
        setZipando(`Baixando ${n + 1} de ${fotos.length}...`);
        const r = await fetch(admin.urlFoto(f.id));
        if (!r.ok) throw new Error(`Falha ao baixar a foto ${f.nomeOriginal ?? f.id}`);
        arquivos[nomeArquivo(p.codigo, i, f)] = new Uint8Array(await r.arrayBuffer());
      }
      setZipando('Gerando .zip...');
      // level 0: fotos já são comprimidas; só empacota (rápido e sem perder qualidade).
      const dadosZip = await new Promise<Uint8Array>((ok, falha) =>
        zip(arquivos, { level: 0 }, (e, d) => (e ? falha(e) : ok(d))),
      );
      baixarBlob(new Blob([dadosZip as Uint8Array<ArrayBuffer>], { type: 'application/zip' }), `pedido_${p.codigo}.zip`);
    } catch (e) {
      setErroAcao(e instanceof Error ? e.message : 'Falha ao gerar o .zip');
    } finally {
      setZipando(null);
    }
  }

  const totalFotos = pedido.itens.reduce((s, i) => s + i.fotos.length, 0);

  return (
    <div className="space-y-4">
      <Link to="/admin" className="inline-flex h-11 items-center gap-1 font-bold text-primaria-escura">
        <ArrowLeft size={20} weight="bold" aria-hidden /> Pedidos
      </Link>
      <div className="flex flex-wrap items-center gap-3">
        <h1>Pedido #{pedido.codigo}</h1>
        <span className={`rounded-pilula px-3 py-1 font-bold ${COR_STATUS[pedido.status]}`}>{ROTULO_STATUS[pedido.status]}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <section className="cartao space-y-2 p-4 md:p-6" aria-labelledby="t-cliente">
            <h2 id="t-cliente" className="text-xl md:text-2xl">
              Cliente
            </h2>
            <p className="text-lg font-bold text-secundaria">{pedido.nome}</p>
            <p>{mascararTelefone(pedido.telefone)}</p>
            <p className="whitespace-pre-line text-texto-suave">{pedido.endereco}</p>
            <p>
              <strong>Pagamento:</strong> {pedido.pagamento === 'pix' ? 'Pix' : 'Cartão'}
            </p>
            {pedido.observacao && (
              <p className="whitespace-pre-line">
                <strong>Observação:</strong> {pedido.observacao}
              </p>
            )}
            <p className="text-sm text-texto-suave">Recebido em {formatarData(pedido.criadoEm)}</p>
            <a
              href={linkWhatsappCliente(pedido.telefone)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex h-12 items-center gap-2 rounded-pilula bg-primaria px-6 font-bold text-secundaria hover:bg-primaria-hover"
            >
              <WhatsappLogo size={22} weight="bold" aria-hidden /> Chamar no WhatsApp
            </a>
          </section>

          <section className="cartao p-4 md:p-6" aria-labelledby="t-itens">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="t-itens" className="text-xl md:text-2xl">
                Itens e fotos
              </h2>
              <Botao
                variante="secundario"
                tamanho="pequeno"
                icone={<FileZip size={20} weight="bold" aria-hidden />}
                carregando={zipando !== null}
                textoCarregando={zipando ?? ''}
                onClick={() => void baixarTodas(pedido)}
                disabled={totalFotos === 0}
              >
                Baixar todas ({totalFotos})
              </Botao>
            </div>
            <ol className="mt-3 space-y-5">
              {pedido.itens.map((item, i) => (
                <li key={item.id} className="border-t border-borda pt-4">
                  <div className="flex flex-wrap justify-between gap-2">
                    <p className="font-bold text-secundaria">
                      {i + 1}) {item.modeloNome} — {item.tamanhoNome} — {item.papelNome} — {item.quantidade} un.
                    </p>
                    <span className="font-bold text-primaria-escura">
                      {item.subtotalCentavos === null ? 'a orçar' : formatarCentavos(item.subtotalCentavos)}
                    </span>
                  </div>
                  {item.descricao && <p className="mt-1 whitespace-pre-line text-texto-suave">Obs.: {item.descricao}</p>}
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {item.fotos.map((f) => (
                      <CartaoFoto key={f.id} foto={f} codigo={pedido.codigo} indice={i} />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-baseline justify-between border-t border-borda pt-3">
              <span className="font-bold">Subtotal</span>
              <span className="font-titulo text-2xl font-semibold text-primaria-escura">
                {formatarCentavos(pedido.subtotalCentavos)}
                {pedido.temPersonalizado && <span className="ml-1 text-base text-texto-suave">+ a orçar</span>}
              </span>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <section className="cartao space-y-3 p-4 lg:sticky lg:top-16" aria-labelledby="t-status">
            <h2 id="t-status" className="text-xl md:text-2xl">
              Status
            </h2>
            <label htmlFor="status" className="sr-only">
              Status do pedido
            </label>
            <select
              id="status"
              className="campo"
              value={pedido.status}
              disabled={salvando}
              onChange={(e) => void mudarStatus(e.target.value as StatusPedido)}
            >
              {(Object.keys(ROTULO_STATUS) as StatusPedido[]).map((s) => (
                <option key={s} value={s}>
                  {ROTULO_STATUS[s]}
                </option>
              ))}
            </select>
            {pedido.apagarEm && (
              <Alerta tipo="alerta">
                As fotos e os dados serão apagados em 24 h ({formatarData(pedido.apagarEm)}). Baixe tudo antes disso.
              </Alerta>
            )}
            {erroAcao && <Alerta tipo="erro">{erroAcao}</Alerta>}
          </section>
        </aside>
      </div>
    </div>
  );
}
