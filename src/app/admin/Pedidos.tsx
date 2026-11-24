import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkle } from '@phosphor-icons/react';
import { formatarCentavos } from '../../compartilhado/dinheiro';
import type { PedidoResumo, StatusPedido } from '../../compartilhado/tipos';
import { admin } from '../api';
import { Botao } from '../componentes/Botao';
import { Carregando, EstadoErro, EstadoVazio } from '../componentes/Estados';
import { COR_STATUS, ROTULO_STATUS, formatarData } from './rotulos';

const ABAS: { status: StatusPedido; rotulo: string }[] = [
  { status: 'novo', rotulo: 'Novos' },
  { status: 'confirmado', rotulo: 'Confirmados' },
  { status: 'producao', rotulo: 'Em produção' },
  { status: 'entregue', rotulo: 'Entregues' },
  { status: 'cancelado', rotulo: 'Cancelados' },
];

export default function Pedidos() {
  const [aba, setAba] = useState<StatusPedido>('novo');
  const [pedidos, setPedidos] = useState<PedidoResumo[]>([]);
  const [pagina, setPagina] = useState(1);
  const [temMais, setTemMais] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [contagem, setContagem] = useState<Partial<Record<StatusPedido, number>>>({});

  async function carregar(status: StatusPedido, p: number) {
    setCarregando(true);
    setErro(null);
    try {
      const r = await admin.pedidos(status, p);
      setPedidos((atual) => (p === 1 ? r.pedidos : [...atual, ...r.pedidos]));
      setPagina(p);
      setTemMais(r.temMais);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar pedidos');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar(aba, 1);
  }, [aba]);

  useEffect(() => {
    admin.contagem().then(setContagem).catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4">
      <h1>Pedidos</h1>
      <div role="tablist" aria-label="Status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {ABAS.map((a) => (
          <button
            key={a.status}
            role="tab"
            type="button"
            aria-selected={aba === a.status}
            onClick={() => setAba(a.status)}
            className={`chip ${aba === a.status ? 'chip-ativo' : 'bg-white'}`}
          >
            {a.rotulo}
            {contagem[a.status] ? <span className="ml-2 rounded-pilula bg-white/70 px-2 text-sm">{contagem[a.status]}</span> : null}
          </button>
        ))}
      </div>

      {erro ? (
        <EstadoErro mensagem={erro} aoTentarDeNovo={() => void carregar(aba, 1)} />
      ) : carregando && pedidos.length === 0 ? (
        <Carregando texto="Carregando pedidos..." />
      ) : pedidos.length === 0 ? (
        <EstadoVazio titulo="Nenhum pedido aqui por enquanto" />
      ) : (
        <>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {pedidos.map((p) => (
              <li key={p.codigo}>
                <Link
                  to={`/admin/pedidos/${p.codigo}`}
                  className="cartao flex flex-col gap-1 p-4 transition-shadow hover:shadow-elevado"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-titulo text-lg font-semibold text-secundaria">#{p.codigo}</span>
                    <span className={`rounded-pilula px-3 py-0.5 text-sm font-bold ${COR_STATUS[p.status]}`}>
                      {ROTULO_STATUS[p.status]}
                    </span>
                  </div>
                  <span className="font-bold text-secundaria">{p.nome}</span>
                  <span className="text-sm text-texto-suave">{formatarData(p.criadoEm)}</span>
                  <span className="flex items-center gap-2 font-bold text-primaria-escura">
                    {formatarCentavos(p.subtotalCentavos)}
                    {p.temPersonalizado && (
                      <span className="inline-flex items-center gap-1 text-sm font-normal text-texto-suave">
                        <Sparkle size={16} weight="fill" aria-hidden /> + personalizado
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {temMais && (
            <div className="text-center">
              <Botao variante="secundario" carregando={carregando} textoCarregando="Carregando..." onClick={() => void carregar(aba, pagina + 1)}>
                Carregar mais
              </Botao>
            </div>
          )}
        </>
      )}
    </div>
  );
}
