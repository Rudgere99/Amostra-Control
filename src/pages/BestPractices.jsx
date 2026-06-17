import React from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, FileText } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'

const practices = [
  {
    title: 'Cumprir o plano de amostragem',
    description: 'Realizar as coletas de amostras, sempre que possível, dentro dos horários estabelecidos no plano de amostragem.',
    icon: Clock3,
    tone: 'blue'
  },
  {
    title: 'Registrar coletas não realizadas',
    description: 'Quando a coleta não puder ser realizada por qualquer motivo operacional, registrar a ocorrência como "Não Coletado", informando obrigatoriamente a justificativa no campo de observações.',
    icon: AlertTriangle,
    tone: 'orange'
  },
  {
    title: 'Garantir veracidade das informações',
    description: 'Manter a veracidade e a confiabilidade de todas as informações lançadas no sistema, registrando fielmente as atividades executadas em campo.',
    icon: CheckCircle2,
    tone: 'green'
  },
  {
    title: 'Acionar o CCO imediatamente',
    description: 'Comunicar imediatamente ao CCO qualquer intercorrência que impeça ou dificulte a realização das coletas programadas.',
    icon: ClipboardCheck,
    tone: 'red'
  },
  {
    title: 'Reportar falhas e melhorias',
    description: 'Informar falhas, erros de sistema ou oportunidades de melhoria identificadas durante a utilização da ferramenta de lançamento das amostras.',
    icon: FileText,
    tone: 'yellow'
  },
  {
    title: 'Comunicar lançamentos incorretos',
    description: 'Comunicar prontamente qualquer lançamento incorreto realizado, para que as devidas correções possam ser efetuadas.',
    icon: AlertTriangle,
    tone: 'blue'
  }
]

export default function BestPractices() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Orientações operacionais"
        title="Boas práticas de lançamento"
        description="Consulte as orientações essenciais para manter a rastreabilidade, confiabilidade e agilidade no processo de coleta e registro de amostras."
      />

      <div className="best-practices-hero">
        <div className="best-practices-hero__icon">
          <ClipboardCheck size={30} />
        </div>
        <div>
          <span>Antes de registrar uma amostra</span>
          <h3>Priorize horários, evidências corretas e comunicação rápida.</h3>
          <p>
            Em caso de desvio operacional, utilize o status adequado, descreva a justificativa nas observações e acione o CCO sempre que a coleta programada for impactada.
          </p>
        </div>
      </div>

      <div className="best-practices-grid">
        {practices.map((practice, index) => {
          const Icon = practice.icon
          return (
            <article className={`best-practice-card best-practice-card--${practice.tone}`} key={practice.title}>
              <div className="best-practice-card__top">
                <div className="best-practice-card__icon"><Icon size={22} /></div>
                <span>{String(index + 1).padStart(2, '0')}</span>
              </div>
              <h3>{practice.title}</h3>
              <p>{practice.description}</p>
            </article>
          )
        })}
      </div>
    </div>
  )
}
