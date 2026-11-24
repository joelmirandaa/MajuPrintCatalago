import type { StatusPedido } from '../../compartilhado/tipos';

export const ROTULO_STATUS: Record<StatusPedido, string> = {
  novo: 'Novo',
  confirmado: 'Confirmado',
  producao: 'Em produção',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const COR_STATUS: Record<StatusPedido, string> = {
  novo: 'bg-destaque text-secundaria',
  confirmado: 'bg-info/15 text-info',
  producao: 'bg-primaria/15 text-primaria-escura',
  entregue: 'bg-sucesso/15 text-sucesso',
  cancelado: 'bg-borda text-texto-suave',
};

const formatoData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
export const formatarData = (ms: number) => formatoData.format(new Date(ms));
