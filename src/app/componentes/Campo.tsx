import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { EXEMPLO_CELULAR, mascararCelular, validarCelular } from '../../compartilhado/telefone';

interface Base {
  rotulo: string;
  erro?: string | null;
  ajuda?: ReactNode;
}

function Mensagens({ id, erro, ajuda }: { id: string; erro?: string | null; ajuda?: ReactNode }) {
  return (
    <>
      {ajuda && !erro && (
        <p id={`${id}-ajuda`} className="mt-1 text-sm text-texto-suave">
          {ajuda}
        </p>
      )}
      {erro && (
        <p id={`${id}-erro`} className="mt-1 flex items-center gap-1 text-sm text-erro">
          <WarningCircle size={18} weight="bold" aria-hidden />
          {erro}
        </p>
      )}
    </>
  );
}

function descritoPor(id: string, erro?: string | null, ajuda?: ReactNode) {
  return erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined;
}

export function Campo({ rotulo, erro, ajuda, className = '', ...resto }: Base & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-bold text-secundaria">
        {rotulo}
      </label>
      <input
        id={id}
        className={`campo ${erro ? 'campo-erro' : ''}`}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, erro, ajuda)}
        {...resto}
      />
      <Mensagens id={id} erro={erro} ajuda={ajuda} />
    </div>
  );
}

export function AreaTexto({
  rotulo,
  erro,
  ajuda,
  className = '',
  ...resto
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block font-bold text-secundaria">
        {rotulo}
      </label>
      <textarea
        id={id}
        className={`campo min-h-[120px] py-3 ${erro ? 'campo-erro' : ''}`}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descritoPor(id, erro, ajuda)}
        {...resto}
      />
      <Mensagens id={id} erro={erro} ajuda={ajuda} />
    </div>
  );
}

/**
 * Campo de celular padrão do sistema: máscara (DD) 9XXXX-XXXX enquanto digita, só números,
 * no máximo 11 dígitos e validação ao sair do campo. `valor` é o texto mascarado.
 * Use `digitosCelular` (compartilhado/telefone) ou os esquemas Zod para obter só os dígitos.
 */
export function CampoCelular({
  rotulo,
  valor,
  aoMudar,
  erro,
  ajuda,
  className = '',
  autoComplete = 'tel-national',
}: {
  rotulo: string;
  valor: string;
  aoMudar: (mascarado: string) => void;
  erro?: string | null;
  ajuda?: ReactNode;
  className?: string;
  autoComplete?: string;
}) {
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  return (
    <Campo
      rotulo={rotulo}
      type="tel"
      inputMode="numeric"
      autoComplete={autoComplete}
      placeholder={EXEMPLO_CELULAR}
      value={valor}
      onChange={(e) => {
        const mascarado = mascararCelular(e.target.value);
        aoMudar(mascarado);
        // Some o erro assim que o número fica válido.
        if (erroLocal && !validarCelular(mascarado)) setErroLocal(null);
      }}
      // Vazio só é cobrado no envio do formulário; aqui avisamos sobre número incompleto ou inválido.
      onBlur={() => setErroLocal(valor === '' ? null : validarCelular(valor))}
      erro={erro ?? erroLocal}
      ajuda={ajuda}
      className={className}
    />
  );
}
