import React from 'react'
import PageHeader from '../components/PageHeader.jsx'

const practices = [
  'Realizar as coletas de amostras, sempre que possível, dentro dos horários estabelecidos no plano de amostragem.',
  'Quando a coleta não puder ser realizada por qualquer motivo operacional, registrar a ocorrência como "Não Coletado", informando obrigatoriamente a justificativa no campo de observações.',
  'Manter a veracidade e a confiabilidade de todas as informações lançadas no sistema, registrando fielmente as atividades executadas em campo.',
  'Comunicar imediatamente ao CCO qualquer intercorrência que impeça ou dificulte a realização das coletas programadas.',
  'Informar falhas, erros de sistema ou oportunidades de melhoria identificadas durante a utilização da ferramenta de lançamento das amostras.',
  'Comunicar prontamente qualquer lançamento incorreto realizado, para que as devidas correções possam ser efetuadas.'
]

export default function BestPractices() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Orientações operacionais"
        title="Boas práticas para amostradores"
        description="Instruções para manter a rastreabilidade, a confiabilidade e a comunicação adequada durante as coletas de amostras."
      />

      <section className="best-practices-panel">
        <div className="best-practices-panel__intro">
          <span className="eyebrow">Conduta em campo</span>
          <h3>Checklist de boas práticas</h3>
          <p>Consulte estas orientações antes de registrar as coletas e sempre que houver alguma intercorrência operacional.</p>
        </div>

        <ol className="best-practices-list">
          {practices.map((practice, index) => (
            <li key={practice}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <p>{practice}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
