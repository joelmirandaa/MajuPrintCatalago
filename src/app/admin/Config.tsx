import { useEffect, useState, type FormEvent } from 'react';
import type { ConfigCompleta } from '../../compartilhado/tipos';
import { admin } from '../api';
import { Alerta } from '../componentes/Alerta';
import { Botao } from '../componentes/Botao';
import { AreaTexto, Campo } from '../componentes/Campo';
import { Carregando, EstadoErro } from '../componentes/Estados';
import { useCarregar } from '../util/useCarregar';

export default function Config() {
  const { dados, erro, carregando, recarregar } = useCarregar(() => admin.config(), []);
  const [form, setForm] = useState<ConfigCompleta | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (dados) setForm(dados);
  }, [dados]);

  if (carregando && !form) return <Carregando />;
  if (erro || !form) return <EstadoErro mensagem={erro ?? 'Erro'} aoTentarDeNovo={() => void recarregar()} />;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSalvando(true);
    setMensagem(null);
    try {
      setForm(await admin.salvarConfig(form));
      setMensagem({ tipo: 'sucesso', texto: 'Configurações salvas!' });
    } catch (erro) {
      setMensagem({ tipo: 'erro', texto: erro instanceof Error ? erro.message : 'Erro ao salvar' });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1>Configurações</h1>
      <form onSubmit={salvar} className="cartao space-y-4 p-4 md:p-6">
        <Campo rotulo="Nome da loja" value={form.nome_loja} maxLength={80} onChange={(e) => setForm({ ...form, nome_loja: e.target.value })} />
        <Campo
          rotulo="WhatsApp que recebe os pedidos"
          inputMode="tel"
          placeholder="5591912345678"
          ajuda="Com código do país (55) e DDD, só números."
          value={form.whatsapp_numero}
          onChange={(e) => setForm({ ...form, whatsapp_numero: e.target.value.replace(/\D/g, '') })}
        />
        {!form.whatsapp_numero && (
          <Alerta tipo="alerta">Sem número configurado, a cliente precisa escolher o contato ao abrir o WhatsApp.</Alerta>
        )}
        <AreaTexto
          rotulo="Texto de boas-vindas do catálogo"
          maxLength={500}
          value={form.texto_boas_vindas}
          onChange={(e) => setForm({ ...form, texto_boas_vindas: e.target.value })}
        />
        <AreaTexto
          rotulo="Aviso de qualidade da foto"
          maxLength={500}
          value={form.aviso_qualidade}
          onChange={(e) => setForm({ ...form, aviso_qualidade: e.target.value })}
        />
        {mensagem && <Alerta tipo={mensagem.tipo}>{mensagem.texto}</Alerta>}
        <Botao type="submit" carregando={salvando} textoCarregando="Salvando...">
          Salvar
        </Botao>
      </form>
    </div>
  );
}
