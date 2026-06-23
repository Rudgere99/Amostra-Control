export function mapColeta(row) {
  return {
    id: row.id,
    programacaoId: row.programacao_id,
    date: row.data_coleta,
    time: row.hora_programada,
    realTime: row.hora_real,
    plant: row.planta,
    shift: row.turno,
    letter: row.letra,
    sf1: row.pilha_sf1,
    htt1: row.pilha_htt1,
    npo1: row.pilha_npo1,
    sampler: row.amostrador_nome,
    badge: row.cadastro,
    fine: row.contem_fino_agregado,
    fineNpo: row.fino_agregado_npo,
    fineHtt: row.fino_agregado_htt,
    ccco: row.informado_ccco,
    status: row.status,
    notes: row.observacoes,
    createdAt: row.criado_em,
    labReceived: row.laboratorio_recebido,
    labReceivedBy: row.laboratorio_recebido_por,
    labReceiptNotes: row.laboratorio_observacoes,
    labReceivedAt: row.laboratorio_recebido_em,
    updatedAt: row.atualizado_em
  }
}

export function mapProgramacao(row) {
  return {
    id: row.id,
    date: row.data_programada,
    time: row.hora_programada,
    plant: row.planta,
    shift: row.turno,
    letter: row.letra,
    status: row.status,
    createdAt: row.criado_em
  }
}
