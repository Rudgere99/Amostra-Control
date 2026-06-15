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
    fineNpo: row.fino_agregado_npo ?? row.contem_fino_agregado ?? false,
    fineHtt: row.fino_agregado_htt ?? row.contem_fino_agregado ?? false,
    ccco: row.informado_ccco,
    status: row.status,
    notes: row.observacoes,
    createdAt: row.criado_em,
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

export function mapLog(row) {
  return {
    id: row.id,
    collectionId: row.coleta_id,
    action: row.acao,
    date: row.data_coleta,
    time: row.hora_programada,
    plant: row.planta,
    shift: row.turno,
    letter: row.letra,
    sampler: row.amostrador_nome,
    badge: row.cadastro,
    status: row.status,
    fineNpo: row.fino_agregado_npo,
    fineHtt: row.fino_agregado_htt,
    notes: row.observacoes,
    createdAt: row.criado_em
  }
}
