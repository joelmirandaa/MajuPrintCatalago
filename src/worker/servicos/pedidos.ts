// Criação do pedido: valida fotos da sessão, recalcula preços no servidor e grava tudo no D1.
import { eq, inArray, isNull, or } from 'drizzle-orm';
import { uploadsDoItem, type EntradaPedido } from '../../compartilhado/esquemas';
import type { Env } from '../env';
import { criarDb, schema } from '../db/client';
import { gerarCodigoPedido } from '../utils/ids';
import { ErroHttp } from '../utils/respostas';
import { montarConfig } from './config';
import { apagarPedidos } from './limpeza';
import { calcularLinha } from './precos';
import { montarLinkWhatsapp, montarMensagem } from './whatsapp';

interface ItemCalculado {
  tipo: 'catalogo' | 'personalizado';
  modeloId: number | null;
  modeloNome: string;
  tamanhoNome: string;
  papelNome: string;
  quantidade: number;
  precoUnitCentavos: number | null;
  subtotalCentavos: number | null;
  descricao: string | null;
  fotos: { uploadId: string; funcao: 'cliente' | 'referencia' }[];
}

export async function criarPedido(env: Env, sessaoId: string, entrada: EntradaPedido, origem: string) {
  const db = criarDb(env.DB);
  const uploadIds = entrada.itens.flatMap(uploadsDoItem);
  const modeloIds = [
    ...new Set(entrada.itens.flatMap((i) => (i.tipo === 'catalogo' ? [i.modeloId] : []))),
  ];

  const [ups, mods, tams, paps, prcs, cfg] = await db.batch([
    db
      .select({ id: schema.uploads.id, sessao: schema.uploads.sessao })
      .from(schema.uploads)
      .where(inArray(schema.uploads.id, uploadIds)),
    db
      .select()
      .from(schema.modelos)
      .where(inArray(schema.modelos.id, modeloIds.length ? modeloIds : [-1])),
    db.select().from(schema.tamanhos),
    db.select().from(schema.papeis),
    db
      .select({
        modeloId: schema.precos.modeloId,
        tamanhoId: schema.precos.tamanhoId,
        papelId: schema.precos.papelId,
        valorCentavos: schema.precos.valorCentavos,
      })
      .from(schema.precos)
      .where(
        or(isNull(schema.precos.modeloId), inArray(schema.precos.modeloId, modeloIds.length ? modeloIds : [-1])),
      ),
    db.select().from(schema.config),
  ]);

  // Fotos: precisam existir e pertencer à mesma sessão.
  const validos = new Set(ups.filter((u) => u.sessao === sessaoId).map((u) => u.id));
  const invalidos = uploadIds.filter((id) => !validos.has(id));
  if (invalidos.length > 0) {
    throw new ErroHttp(409, 'Uma ou mais fotos expiraram. Envie as fotos novamente.', { uploadsInvalidos: invalidos });
  }

  const modeloPorId = new Map(mods.map((m) => [m.id, m]));
  const tamanhoPorId = new Map(tams.filter((t) => t.ativo).map((t) => [t.id, t]));
  const papelPorId = new Map(paps.filter((p) => p.ativo).map((p) => [p.id, p]));

  const itens: ItemCalculado[] = entrada.itens.map((item, indice) => {
    const tamanho = tamanhoPorId.get(item.tamanhoId);
    const papel = papelPorId.get(item.papelId);
    if (!tamanho || !papel) {
      throw new ErroHttp(409, `Item ${indice + 1}: tamanho ou papel não está mais disponível.`);
    }
    if (item.tipo === 'catalogo') {
      const modelo = modeloPorId.get(item.modeloId);
      if (!modelo || !modelo.ativo || !modelo.disponivel) {
        throw new ErroHttp(409, `Item ${indice + 1}: o modelo não está mais disponível.`);
      }
      const r = calcularLinha(prcs, { ...item, modeloId: item.modeloId });
      if (r.subtotalCentavos === null) {
        throw new ErroHttp(409, `Item ${indice + 1}: essa combinação de tamanho e papel não está disponível.`);
      }
      return {
        tipo: 'catalogo',
        modeloId: modelo.id,
        modeloNome: modelo.nome,
        tamanhoNome: tamanho.nome,
        papelNome: papel.nome,
        quantidade: item.quantidade,
        precoUnitCentavos: r.precoUnitCentavos,
        subtotalCentavos: r.subtotalCentavos,
        descricao: null,
        fotos: [{ uploadId: item.uploadId, funcao: 'cliente' }],
      };
    }
    return {
      tipo: 'personalizado',
      modeloId: null,
      modeloNome: 'Personalizado',
      tamanhoNome: tamanho.nome,
      papelNome: papel.nome,
      quantidade: item.quantidade,
      precoUnitCentavos: null,
      subtotalCentavos: null,
      descricao: item.descricao || null,
      fotos: [
        { uploadId: item.uploadIdCliente, funcao: 'cliente' },
        { uploadId: item.uploadIdReferencia, funcao: 'referencia' },
      ],
    };
  });

  const subtotal = itens.reduce((s, i) => s + (i.subtotalCentavos ?? 0), 0);
  const temAOrcar = itens.some((i) => i.subtotalCentavos === null);
  const temPersonalizado = itens.some((i) => i.tipo === 'personalizado');
  const agora = Date.now();
  const { cliente } = entrada;

  // Fase 1 (atômica): pedido + itens. Repete com outro código no caso raro de colisão.
  let codigo = '';
  let itemIds: number[] = [];
  for (let tentativa = 0; ; tentativa++) {
    codigo = gerarCodigoPedido();
    const comandos: D1PreparedStatement[] = [
      env.DB.prepare(
        `INSERT INTO pedidos (codigo, nome, telefone, endereco, pagamento, observacao, subtotal_centavos,
           tem_personalizado, status, criado_em, atualizado_em)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'novo', ?, ?)`,
      ).bind(
        codigo,
        cliente.nome,
        cliente.telefone,
        cliente.endereco,
        cliente.pagamento,
        cliente.observacao || null,
        subtotal,
        temPersonalizado ? 1 : 0,
        agora,
        agora,
      ),
      ...itens.map((i) =>
        env.DB.prepare(
          `INSERT INTO itens (pedido_id, tipo, modelo_id, modelo_nome, tamanho_nome, papel_nome, quantidade,
             preco_unit_centavos, subtotal_centavos, descricao)
           SELECT id, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM pedidos WHERE codigo = ? RETURNING id`,
        ).bind(
          i.tipo,
          i.modeloId,
          i.modeloNome,
          i.tamanhoNome,
          i.papelNome,
          i.quantidade,
          i.precoUnitCentavos,
          i.subtotalCentavos,
          i.descricao,
          codigo,
        ),
      ),
    ];
    try {
      const resultados = await env.DB.batch<{ id: number }>(comandos);
      itemIds = resultados.slice(1).map((r) => {
        const id = r.results[0]?.id;
        if (typeof id !== 'number') throw new Error('Item sem ID');
        return id;
      });
      break;
    } catch (erro) {
      if (tentativa < 3 && String(erro).includes('UNIQUE')) continue;
      throw erro;
    }
  }

  // Fase 2 (atômica): move os uploads para fotos em um único INSERT ... SELECT e apaga os uploads.
  let fotosMovidas = false;
  try {
    const linhas = itens.flatMap((item, i) => item.fotos.map((f) => ({ itemId: itemIds[i]!, ...f })));
    const valores = linhas.map(() => '(?, ?, ?)').join(', ');
    const parametros = linhas.flatMap((l) => [l.itemId, l.funcao, l.uploadId]);
    const marcadores = uploadIds.map(() => '?').join(', ');
    const [insercao] = await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO fotos (item_id, r2_key, funcao, nome_original, tipo_mime, bytes, largura, altura)
         SELECT v.column1, u.r2_key, v.column2, u.nome_original, u.tipo_mime, u.bytes, u.largura, u.altura
         FROM (VALUES ${valores}) AS v JOIN uploads u ON u.id = v.column3 AND u.sessao = ?`,
      ).bind(...parametros, sessaoId),
      env.DB.prepare(`DELETE FROM uploads WHERE sessao = ? AND id IN (${marcadores})`).bind(sessaoId, ...uploadIds),
    ]);
    fotosMovidas = true;
    if ((insercao?.meta.changes ?? 0) !== linhas.length) {
      throw new ErroHttp(409, 'Uma ou mais fotos expiraram. Envie as fotos novamente.');
    }
  } catch (erro) {
    // Desfaz a fase 1 (itens saem em cascata). Se a fase 2 foi gravada, apaga também os arquivos no R2;
    // caso contrário, as fotos continuam em `uploads` e a cliente pode tentar de novo.
    const [pedido] = await db
      .select({ id: schema.pedidos.id })
      .from(schema.pedidos)
      .where(eq(schema.pedidos.codigo, codigo));
    if (pedido) {
      if (fotosMovidas) await apagarPedidos(env, [pedido.id]);
      else await db.delete(schema.pedidos).where(eq(schema.pedidos.id, pedido.id));
    }
    throw erro;
  }

  const config = montarConfig(cfg);
  const mensagem = montarMensagem({
    codigo,
    nome: cliente.nome,
    telefone: cliente.telefone,
    endereco: cliente.endereco,
    pagamento: cliente.pagamento,
    observacao: cliente.observacao,
    subtotalCentavos: subtotal,
    temAOrcar,
    itens,
    linkPainel: `${origem}/admin/pedidos/${codigo}`,
  });
  return { codigo, linkWhatsapp: montarLinkWhatsapp(config.whatsapp_numero, mensagem) };
}
