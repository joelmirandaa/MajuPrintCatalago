// Utilitários de imagem executados no navegador (nada de processamento pesado no Worker).
import { LIMITES } from '../../compartilhado/esquemas';

const EXTENSOES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
};

/** Tipo MIME do arquivo; alguns celulares mandam HEIC sem tipo, então usamos a extensão. */
export function tipoDoArquivo(arquivo: File): string | null {
  const tipo = arquivo.type.toLowerCase();
  if ((LIMITES.tiposFoto as readonly string[]).includes(tipo)) return tipo;
  const ext = arquivo.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSOES[ext] ?? null;
}

function carregarImagem(arquivo: Blob): Promise<HTMLImageElement> {
  return new Promise((resolver, rejeitar) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolver(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejeitar(new Error('Não foi possível ler a imagem'));
    };
    img.src = url;
  });
}

export interface InfoImagem {
  largura: number | null;
  altura: number | null;
  /** Miniatura pequena em data URL (persiste no carrinho mesmo após recarregar). */
  miniatura: string | null;
}

/** Lê dimensões e gera uma miniatura. Formatos que o navegador não decodifica (ex.: HEIC no Chrome) → nulos. */
export async function lerInfoImagem(arquivo: File, ladoMiniatura = 200): Promise<InfoImagem> {
  try {
    const img = await carregarImagem(arquivo);
    const escala = Math.min(1, ladoMiniatura / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { largura: img.naturalWidth, altura: img.naturalHeight, miniatura: canvas.toDataURL('image/jpeg', 0.7) };
  } catch {
    return { largura: null, altura: null, miniatura: null };
  }
}

/** Comprime para WebP com lado máximo de 1600 px (imagem do modelo no admin). */
export async function comprimirParaWebp(arquivo: File, ladoMaximo = 1600, qualidade = 0.82): Promise<Blob> {
  const img = await carregarImagem(arquivo);
  const escala = Math.min(1, ladoMaximo / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * escala);
  canvas.height = Math.round(img.naturalHeight * escala);
  canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', qualidade));
  if (!blob || blob.type !== 'image/webp') {
    throw new Error('Este navegador não gera WebP. Use o Chrome ou o Edge para enviar imagens de modelos.');
  }
  return blob;
}

export function formatarBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
