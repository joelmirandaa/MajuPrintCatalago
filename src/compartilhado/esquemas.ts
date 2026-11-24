// Esquemas Zod de toda entrada da API (estrutura.md, seção 11: limites).
import { z } from 'zod';
import { LIMITE_CM, mensagemLimite, OPCOES_MODELO } from './personalizado';
import { digitosCelular, validarCelular } from './telefone';

export const LIMITES = {
  bytesPorFoto: 25 * 1024 * 1024,
  fotosPorPedido: 20,
  itensPorPedido: 30,
  quantidadeMaxima: 999,
  tiposFoto: ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp'] as const,
} as const;

const texto = (max: number) => z.string().trim().max(max);
const textoObrigatorio = (max: number, mensagem: string) => z.string().trim().min(1, mensagem).max(max);
const id = z.number().int().positive();
const uploadId = z.string().regex(/^[A-Za-z0-9_-]{16,64}$/, 'Foto inválida');

export const esquemaSessao = z.object({
  turnstileToken: z.string().min(1).max(4096),
  tokenAnterior: z.string().max(1024).optional(),
});

export const esquemaItemCatalogo = z.object({
  tipo: z.literal('catalogo'),
  modeloId: id,
  tamanhoId: id,
  papelId: id,
  quantidade: z.number().int().min(1).max(LIMITES.quantidadeMaxima),
  uploadId,
});

const medidaCm = (eixo: keyof typeof LIMITE_CM) =>
  z
    .number({ message: 'Informe a medida em centímetros' })
    .positive('A medida deve ser maior que zero')
    .max(LIMITE_CM[eixo], mensagemLimite(eixo));

/**
 * Item "Modelo personalizado". O tamanho é um dos predefinidos (`tamanhoId`) OU medidas livres em cm
 * (`larguraCm` ≤ 21 + `alturaCm` ≤ 29,7). `opcaoModelo` diz se a cliente manda referência ou só a própria foto.
 */
export const esquemaItemPersonalizado = z
  .object({
    tipo: z.literal('personalizado'),
    opcaoModelo: z.enum(OPCOES_MODELO, { message: 'Escolha se vai enviar um modelo de referência' }),
    tamanhoId: id.optional(),
    larguraCm: medidaCm('largura').optional(),
    alturaCm: medidaCm('altura').optional(),
    papelId: id,
    quantidade: z.number().int().min(1).max(LIMITES.quantidadeMaxima),
    uploadIdCliente: uploadId,
    uploadIdReferencia: uploadId.optional(),
    descricao: texto(1000).optional(),
  })
  .superRefine((item, ctx) => {
    const temMedidas = item.larguraCm !== undefined || item.alturaCm !== undefined;
    if (item.tamanhoId !== undefined && temMedidas) {
      ctx.addIssue({ code: 'custom', message: 'Escolha um tamanho predefinido ou o tamanho personalizado, não os dois' });
    } else if (item.tamanhoId === undefined && (item.larguraCm === undefined || item.alturaCm === undefined)) {
      ctx.addIssue({ code: 'custom', message: 'Informe a largura e a altura em centímetros' });
    }
    if (item.opcaoModelo === 'referencia' && item.uploadIdReferencia === undefined) {
      ctx.addIssue({ code: 'custom', message: 'Envie a foto do modelo de referência' });
    }
    if (item.opcaoModelo === 'apenas_foto' && item.uploadIdReferencia !== undefined) {
      ctx.addIssue({ code: 'custom', message: 'Com "Apenas minha foto" não há foto de referência' });
    }
  });

export const esquemaItemPedido = z.discriminatedUnion('tipo', [esquemaItemCatalogo, esquemaItemPersonalizado]);

/** IDs de upload usados por um item, na ordem (cliente, referência). */
export function uploadsDoItem(item: z.infer<typeof esquemaItemPedido>): string[] {
  if (item.tipo === 'catalogo') return [item.uploadId];
  return item.uploadIdReferencia ? [item.uploadIdCliente, item.uploadIdReferencia] : [item.uploadIdCliente];
}

/** Celular no formato (DD) 9XXXX-XXXX; sai normalizado só com os 11 dígitos. */
export const esquemaTelefone = z
  .string()
  .superRefine((v, ctx) => {
    // Recusa mais de 11 dígitos (exceto o 55 do país) em vez de cortar em silêncio.
    const brutos = v.replace(/\D/g, '');
    const semPais = brutos.length > 11 && brutos.startsWith('55') ? brutos.slice(2) : brutos;
    const erro = semPais.length > 11 ? 'Número com dígitos demais' : validarCelular(v);
    if (erro) ctx.addIssue({ code: 'custom', message: erro });
  })
  .transform(digitosCelular);

export const esquemaCliente = z.object({
  nome: textoObrigatorio(120, 'Informe seu nome'),
  telefone: esquemaTelefone,
  endereco: textoObrigatorio(400, 'Informe o endereço de entrega'),
  pagamento: z.enum(['pix', 'cartao'], { message: 'Escolha a forma de pagamento' }),
  observacao: texto(1000).optional(),
});

export const esquemaPedido = z
  .object({
    cliente: esquemaCliente,
    itens: z.array(esquemaItemPedido).min(1, 'O carrinho está vazio').max(LIMITES.itensPorPedido),
  })
  .superRefine((pedido, ctx) => {
    const ids = pedido.itens.flatMap(uploadsDoItem);
    if (ids.length > LIMITES.fotosPorPedido) {
      ctx.addIssue({ code: 'custom', message: `Máximo de ${LIMITES.fotosPorPedido} fotos por pedido` });
    }
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'A mesma foto foi usada em mais de um item' });
    }
  });

export type EntradaPedido = z.infer<typeof esquemaPedido>;
export type EntradaItemPedido = z.infer<typeof esquemaItemPedido>;

// ---------- Admin ----------

export const esquemaStatus = z.object({
  status: z.enum(['novo', 'confirmado', 'producao', 'entregue', 'cancelado']),
});

export const esquemaCategoria = z.object({
  nome: textoObrigatorio(80, 'Informe o nome'),
  ordem: z.number().int().min(0).max(10000).default(0),
  ativo: z.boolean().default(true),
});

export const esquemaModelo = z.object({
  categoriaId: id.nullable(),
  nome: textoObrigatorio(120, 'Informe o nome'),
  descricao: texto(1000).nullable().optional(),
  disponivel: z.boolean().default(true),
  ativo: z.boolean().default(true),
  ordem: z.number().int().min(0).max(10000).default(0),
});

export const esquemaOrdemModelos = z.object({
  ids: z.array(id).max(1000),
});

export const esquemaTamanho = z.object({
  nome: textoObrigatorio(40, 'Informe o nome'),
  larguraCm: z.number().positive().max(500).nullable(),
  alturaCm: z.number().positive().max(500).nullable(),
  ordem: z.number().int().min(0).max(10000).default(0),
  ativo: z.boolean().default(true),
});

export const esquemaPapel = z.object({
  nome: textoObrigatorio(60, 'Informe o nome'),
  ordem: z.number().int().min(0).max(10000).default(0),
  ativo: z.boolean().default(true),
});

export const esquemaPrecos = z.object({
  precos: z
    .array(
      z.object({
        modeloId: id.nullable(),
        tamanhoId: id,
        papelId: id,
        valorCentavos: z.number().int().min(0).max(100_000_00),
      }),
    )
    .max(1000),
});

export const esquemaConfig = z.object({
  nome_loja: textoObrigatorio(80, 'Informe o nome da loja'),
  // Vazio (sem número) ou celular válido; gravado como 55 + DDD + número para o link wa.me.
  whatsapp_numero: z.string().transform((v, ctx) => {
    if (v.replace(/\D/g, '') === '') return '';
    const r = esquemaTelefone.safeParse(v);
    if (!r.success) {
      ctx.addIssue({ code: 'custom', message: r.error.issues[0]?.message ?? 'Número inválido' });
      return z.NEVER;
    }
    return `55${r.data}`;
  }),
  texto_boas_vindas: texto(500),
  aviso_qualidade: texto(500),
});
