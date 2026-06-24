# Ajustes realizados no projeto Amostra-Control

## Backend

- Criada validacao centralizada de datas, horarios, status e planta.
- Criada trava no servidor para impedir:
  - lancamento em data futura;
  - lancamento do dia anterior apos 01:00;
  - lancamento de faixa horaria antes da liberacao da hora seguinte.
- Corrigido uso de data local com timezone `America/Sao_Paulo` no backend.
- Corrigido dashboard para calcular o total com base na tabela `programacao_amostragem`, em vez de assumir sempre 24 horas por planta.
- Adicionada validacao de programacao diaria para data e planta.
- Evitada duplicidade no lancamento por data, faixa e planta.
- Criada base de tabela de auditoria `auditoria_coletas` no schema.
- Incluidos indices adicionais para melhorar consulta por data, planta e hora.

## Frontend

- Corrigido relatorio que contava realizadas usando status antigo `Realizada`; agora usa o status real `coletado`.
- Corrigido `today()` em Relatorios e Historico para usar data local do navegador.
- Corrigido Historico para respeitar o filtro de status.
- Adicionado filtro de status na tela de Historico.
- Ajustados textos do Historico para nao limitar a tela apenas a coletas realizadas.

## Validacao

- Build do frontend executado com sucesso usando `npm run build`.
- Arquivos JavaScript do backend verificados com `node --check`.
