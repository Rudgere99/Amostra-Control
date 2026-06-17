import React from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { AlertTriangle, CheckCircle2, ClipboardCheck, Clock3, Target } from '../components/LocalIcons.jsx'

const practices = [
  {
    icon: Clock3,
    title: 'Cumprir os horários programados',
    text: 'Realizar as coletas de amostras, sempre que possível, dentro dos horários estabelecidos no plano de amostragem.'
  },
  {
    icon: ClipboardCheck,
    title: 'Registrar coletas não realizadas',
    text: 'Quando a coleta não puder ser realizada por qualquer motivo operacional, registrar a ocorrência como "Não Coletado", informando obrigatoriamente a justificativa no campo de observações.'
  },
  {
    icon: CheckCircle2,
    title: 'Garantir veracidade das informações',
    text: 'Manter a veracidade e a confiabilidade de todas as informações lançadas no sistema, registrando fielmente as atividades executadas em campo.'
  },
  {
    icon: AlertTriangle,
    title: 'Comunicar intercorrências ao CCO',
    text: 'Comunicar imediatamente ao CCO qualquer intercorrência que impeça ou dificulte a realização das coletas programadas.'
  },
  {
    icon: Target,
    title: 'Reportar falhas e melhorias',
    text: 'Informar falhas, erros de sistema ou oportunidades de melhoria identificadas durante a utilização da ferramenta de lançamento das amostras.'
  },
  {
    icon: ClipboardCheck,
    title: 'Sinalizar lançamentos incorretos',
    text: 'Comunicar prontamente qualquer lançamento incorreto realizado, para que as devidas correções possam ser efetuadas.'
  }
]

export default function BestPractices() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Orientações de campo"
        title="Boas práticas para amostradores"
        description="Instruções essenciais para manter a rastreabilidade, a confiabilidade dos registros e a comunicação operacional durante as coletas de amostras."
      />

      <section className="best-practices-hero">
        <div>
          <span className="eyebrow">Procedimento operacional</span>
          <h3>Registre exatamente o que ocorreu em campo</h3>
          <p>
            Use esta página como referência rápida antes e durante a jornada. Em caso de desvio, priorize o registro correto no sistema e a comunicação imediata com o CCO.
          </p>
        </div>
        <div className="best-practices-hero__badge">
          <CheckCircle2 size={26} />
          <strong>Dados confiáveis</strong>
          <span>Coletas rastreáveis e justificadas</span>
        </div>
      </section>

      <section className="best-practices-grid" aria-label="Lista de boas práticas">
        {practices.map((practice, index) => {
          const Icon = practice.icon
          return (
            <article className="best-practice-card" key={practice.title}>
              <div className="best-practice-card__icon"><Icon size={22} /></div>
              <div>
                <span>#{String(index + 1).padStart(2, '0')}</span>
                <h3>{practice.title}</h3>
                <p>{practice.text}</p>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
