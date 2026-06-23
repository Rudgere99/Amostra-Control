# Ajustes realizados no projeto Amostra-Control

## Backend

- Criada validação centralizada de datas, horários, status e planta.
- Criada trava no servidor para impedir:
  - lançamento em data futura;
  - lançamento do dia anterior após 01:00;
  - lançamento de faixa horária antes da liberação da hora seguinte.
- Corrigido uso de data local com timezone `America/Sao_Paulo` no backend.
- Corrigido dashboard para calcular o total com base na tabela `programacao_amostragem`, em vez de assumir sempre 24 horas por planta.
- Adicionada validação de programação diária para data e planta.
- Evitada duplicidade no lançamento por data, faixa e planta: quando já existe lançamento para o mesmo slot, a rota de criação atualiza o registro existente.
- Criada base de tabela de auditoria `auditoria_coletas` no schema.
- Incluídos índices adicionais para melhorar consulta por data, planta e hora.

## Frontend

- Corrigido relatório que contava realizadas usando status antigo `Realizada`; agora usa o status real `coletado`.
- Corrigido `today()` em Relatórios e Histórico para usar data local do navegador, evitando erro de UTC.
- Corrigido Histórico para respeitar o filtro de status.
- Adicionado filtro de status na tela de Histórico.
- Ajustados textos do Histórico para não limitar a tela apenas a coletas realizadas.

## Validação

- Build do frontend executado com sucesso usando `npm run build`.
- Arquivos JavaScript do backend verificados com `node --check`.

## Observação

A autenticação com senha/PIN e token ainda não foi implementada para evitar alteração grande no fluxo de login atual. O projeto agora está mais seguro nas regras operacionais, mas a próxima evolução recomendada continua sendo autenticação real no backend.
