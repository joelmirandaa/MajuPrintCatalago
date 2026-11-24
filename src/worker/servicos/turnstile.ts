// Validação do token do Cloudflare Turnstile.
export async function validarTurnstile(segredo: string, token: string, ip: string | undefined): Promise<boolean> {
  const corpo = new FormData();
  corpo.append('secret', segredo);
  corpo.append('response', token);
  if (ip) corpo.append('remoteip', ip);
  try {
    const resposta = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: corpo,
    });
    if (!resposta.ok) return false;
    const dados = (await resposta.json()) as { success?: boolean };
    return dados.success === true;
  } catch (erro) {
    console.error('Falha ao validar Turnstile', erro);
    return false;
  }
}
