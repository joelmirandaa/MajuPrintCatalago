-- DADOS DE EXEMPLO — somente para desenvolvimento local.
-- Nomes, tamanhos e valores são fictícios e devem ser substituídos pelos reais no painel.
INSERT INTO categorias (id, nome, ordem) VALUES
  (1, 'Polaroid', 1), (2, 'Porta-retrato', 2), (3, 'Adesivos', 3);

INSERT INTO tamanhos (id, nome, largura_cm, altura_cm, ordem) VALUES
  (1, '10×15', 10, 15, 1), (2, '15×21', 15, 21, 2), (3, '20×30', 20, 30, 3);

INSERT INTO papeis (id, nome, ordem) VALUES
  (1, 'Fotográfico', 1), (2, 'Adesivo', 2), (3, 'Comum', 3);

INSERT INTO modelos (id, categoria_id, nome, descricao, disponivel, ordem, criado_em) VALUES
  (1, 1, 'Polaroid Clássica (exemplo)', 'Moldura branca com espaço para legenda.', 1, 1, 0),
  (2, 1, 'Polaroid Corações (exemplo)', 'Moldura com corações nos cantos.', 1, 2, 0),
  (3, 2, 'Retrato Família (exemplo)', 'Moldura creme com borda arredondada.', 1, 3, 0),
  (4, 3, 'Adesivo Redondo (exemplo)', 'Adesivos recortados em círculo.', 0, 4, 0);

INSERT INTO precos (modelo_id, tamanho_id, papel_id, valor_centavos) VALUES
  (NULL, 1, 1, 500), (NULL, 1, 2, 600), (NULL, 1, 3, 300),
  (NULL, 2, 1, 1000), (NULL, 2, 2, 1200), (NULL, 2, 3, 600),
  (NULL, 3, 1, 2000), (NULL, 3, 2, 2400), (NULL, 3, 3, 1200),
  (3, 1, 1, 700);

INSERT OR REPLACE INTO config (chave, valor) VALUES ('whatsapp_numero', '5591900000000');
