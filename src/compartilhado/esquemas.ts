// Esquemas Zod de toda entrada da API (estrutura.md, seção 11: limites).
import { z } from 'zod';

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

export const esquemaItemPersonalizado = z.object({
  tipo: z.literal('personalizado'),
  tamanhoId: id,
  papelId: id,
  quantidade: z.number().int().min(1).max(LIMITES.quantidadeMaxima),
  uploadIdCliente: uploadId,
  uploadIdReferencia: uploadId,
  descricao: texto(1000).optional(),
});

export const esquemaItemPedido = z.discriminatedUnion('tipo', [esquemaItemCatalogo, esquemaItemPersonalizado]);

/** IDs de upload usados por um item, na ordem (cliente, referência). */
export function uploadsDoItem(item: z.infer<typeof esquemaItemPedido>): string[] {
  return item.tipo === 'catalogo' ? [item.uploadId] : [item.uploadIdCliente, item.uploadIdReferencia];
}

export const esquemaTelefone = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().regex(/^\d{10,13}$/, 'Informe um WhatsApp válido com DDD'));

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
  whatsapp_numero: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .pipe(z.string().regex(/^(\d{12,13})?$/, 'Use o formato com país e DDD, ex.: 5591912345678')),
  texto_boas_vindas: texto(500),
  aviso_qualidade: texto(500),
});
