import type { ConfigCompleta } from '../../compartilhado/tipos';
import type { Db } from '../db/client';
import { schema } from '../db/client';

export const CONFIG_PADRAO: ConfigCompleta = {
  nome_loja: 'Maju Print',
  whatsapp_numero: '',
  texto_boas_vindas: '',
  aviso_qualidade: '',
};

export function montarConfig(linhas: { chave: string; valor: string }[]): ConfigCompleta {
  const config: ConfigCompleta = { ...CONFIG_PADRAO };
  for (const { chave, valor } of linhas) {
    if (chave in config) config[chave as keyof ConfigCompleta] = valor;
  }
  return config;
}

export async function lerConfig(db: Db): Promise<ConfigCompleta> {
  return montarConfig(await db.select().from(schema.config));
}
