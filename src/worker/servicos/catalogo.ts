import { asc, eq } from 'drizzle-orm';
import type { CatalogoAdminResposta, CatalogoResposta } from '../../compartilhado/tipos';
import type { Db } from '../db/client';
import { schema } from '../db/client';
import { montarConfig } from './config';

const { categorias, modelos, tamanhos, papeis, precos, config } = schema;

/** Tudo que o site precisa em uma única leitura (batch = uma ida ao D1). */
export async function catalogoPublico(db: Db, turnstileSiteKey: string): Promise<CatalogoResposta> {
  const [cats, mods, tams, paps, prcs, cfg] = await db.batch([
    db.select().from(categorias).where(eq(categorias.ativo, true)).orderBy(asc(categorias.ordem), asc(categorias.id)),
    db.select().from(modelos).where(eq(modelos.ativo, true)).orderBy(asc(modelos.ordem), asc(modelos.id)),
    db.select().from(tamanhos).where(eq(tamanhos.ativo, true)).orderBy(asc(tamanhos.ordem), asc(tamanhos.id)),
    db.select().from(papeis).where(eq(papeis.ativo, true)).orderBy(asc(papeis.ordem), asc(papeis.id)),
    db
      .select({
        modeloId: precos.modeloId,
        tamanhoId: precos.tamanhoId,
        papelId: precos.papelId,
        valorCentavos: precos.valorCentavos,
      })
      .from(precos),
    db.select().from(config),
  ]);
  const c = montarConfig(cfg);
  return {
    categorias: cats,
    modelos: mods.map(({ criadoEm: _c, ...m }) => m),
    tamanhos: tams,
    papeis: paps,
    precos: prcs,
    config: { nomeLoja: c.nome_loja, textoBoasVindas: c.texto_boas_vindas, avisoQualidade: c.aviso_qualidade },
    turnstileSiteKey,
  };
}

export async function catalogoAdmin(db: Db): Promise<CatalogoAdminResposta> {
  const [cats, mods, tams, paps, prcs] = await db.batch([
    db.select().from(categorias).orderBy(asc(categorias.ordem), asc(categorias.id)),
    db.select().from(modelos).orderBy(asc(modelos.ordem), asc(modelos.id)),
    db.select().from(tamanhos).orderBy(asc(tamanhos.ordem), asc(tamanhos.id)),
    db.select().from(papeis).orderBy(asc(papeis.ordem), asc(papeis.id)),
    db
      .select({
        modeloId: precos.modeloId,
        tamanhoId: precos.tamanhoId,
        papelId: precos.papelId,
        valorCentavos: precos.valorCentavos,
      })
      .from(precos),
  ]);
  return { categorias: cats, modelos: mods.map(({ criadoEm: _c, ...m }) => m), tamanhos: tams, papeis: paps, precos: prcs };
}
