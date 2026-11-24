/** Link wa.me para falar com a cliente (assume Brasil se vier sem o 55). */
export function linkWhatsappCliente(digitos: string): string {
  const d = digitos.replace(/\D/g, '');
  return `https://wa.me/${d.length <= 11 ? `55${d}` : d}`;
}
