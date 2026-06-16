import React from 'react'
import { AlertTriangle, CheckCircle2, ClipboardCheck } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'

const practices = [
  {
    title: 'Cumprir o plano de amostragem',
    text: 'Realizar as coletas de amostras, sempre que possível, dentro dos horários estabelecidos no plano de amostragem.'
  },
  {
    title: 'Justificar coleta não realizada',
    text: 'Quando a coleta não puder ser realizada por qualquer motivo operacional, registrar a ocorrência como "Não Coletado", informando obrigatoriamente a justificativa no campo de observações.'
  },
  {
    title: 'Garantir dados confiáveis',
    text: 'Manter a veracidade e a confiabilidade de todas as informações lançadas no sistema, registrando fielmente as atividades executadas em campo.'
  },
  {
    title: 'Comunicar intercorrências ao CCO',
    text: 'Comunicar imediatamente ao CCO qualquer intercorrência que impeça ou dificulte a realização das coletas programadas.'
  },
  {
    title: 'Reportar falhas e melhorias',
    text: 'Informar falhas, erros de sistema ou oportunidades de melhoria identificadas durante a utilização da ferramenta de lançamento das amostras.'
  },
  {
    title: 'Corrigir lançamentos incorretos',
    text: 'Comunicar prontamente qualquer lançamento incorreto realizado, para que as devidas correções possam ser efetuadas.'
  }
]

export default function BestPractices() {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Orientação operacional"
        title="Boas práticas para amostradores"
        description="Instruções essenciais para manter o lançamento das amostras confiável, rastreável e alinhado ao plano de amostragem."
      />

      <div className="alert-banner best-practices-alert">
        <div className="alert-banner__icon"><AlertTriangle size={20} /></div>
        <div>
          <strong>Registre sempre a realidade do campo.</strong>
          <p>As informações lançadas no sistema devem refletir fielmente a execução, pendências e intercorrências da rotina de amostragem.</p>
        </div>
      </div>

      <div className="best-practices-grid">
        {practices.map((practice, index) => (
          <article className="best-practice-card" key={practice.title}>
            <div className="best-practice-card__icon">
              {index === 0 ? <ClipboardCheck size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{practice.title}</h3>
              <p>{practice.text}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
