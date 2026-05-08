import React, { useState, useEffect, useCallback } from 'react';
import { type PerformanceReview, type ReviewSection, type ReviewAnswer } from '../types';
import { getReview, getReviews, saveReview } from '../services/dataService';
import { REVIEWS_TABLE_SETUP_SQL } from '../services/supabaseService';
import { getErrorMessage } from '../utils/errorHelpers';
import { type Language } from '../utils/translations';
import { useI18n } from '../hooks/useI18n';
import SchemaError from './SchemaError';
import IconSparkles from './icons/IconSparkles';
import IconCalendar from './icons/IconCalendar';

const REVIEW_SECTIONS_BY_LANGUAGE: Record<Language, ReviewSection[]> = {
  en: [
    {
      id: 'goals',
      title: 'Goals',
      questions: [
        { id: 'goals-set', text: 'Did you set clear, measurable goals for {reviewYear}? What were they?', type: 'textarea' },
        { id: 'goals-achieved', text: 'Did you achieve your goals? How challenging were they?', type: 'textarea' },
        { id: 'goals-why', text: 'Why do you feel they were or were not achieved?', type: 'textarea' },
        { id: 'goals-not-set', text: 'If you did not set specific goals, why not?', type: 'textarea' }
      ]
    },
    {
      id: 'pnl',
      title: 'Profit & Loss',
      questions: [
        { id: 'pnl-net', text: 'What was your net profit in {reviewYear} after all costs?', type: 'text' },
        { id: 'pnl-win-rate', text: 'What was your overall win rate?', type: 'text' },
        { id: 'pnl-avg-winner', text: 'What was your average winner/average loser?', type: 'text' },
        { id: 'pnl-content', text: 'Based on your performance, are you content with the results?', type: 'textarea' },
        { id: 'pnl-biggest-reason', text: 'If you are not satisfied, what is the single biggest reason?', type: 'textarea' },
        { id: 'pnl-near-disasters', text: 'Did you experience any "near disasters"?', type: 'textarea' }
      ]
    },
    {
      id: 'trading-business',
      title: 'Trading Business',
      questions: [
        { id: 'business-costs', text: 'Review all your expenses (commissions, data feeds, etc.)', type: 'textarea' },
        { id: 'business-optimize', text: 'Can you optimise your costs without compromising your edge?', type: 'textarea' },
        { id: 'business-bottleneck', text: 'What is the biggest bottleneck preventing scaling?', type: 'textarea' }
      ]
    },
    {
      id: 'market-adaptability',
      title: 'Market Adaptability & Edge Development',
      questions: [
        { id: 'edge-improve', text: 'Did your edge improve, stagnate, or deteriorate? Why?', type: 'textarea' },
        { id: 'edge-assumptions', text: 'Are you relying on outdated assumptions?', type: 'textarea' },
        { id: 'edge-new-data', text: 'What new data/tools did you ignore?', type: 'textarea' },
        { id: 'edge-new-strategies', text: 'Did you assess/develop new strategies?', type: 'textarea' }
      ]
    },
    {
      id: 'performance-review',
      title: 'Performance Review',
      questions: [
        { id: 'win-streak', text: 'What was your biggest win streak?', type: 'textarea' },
        { id: 'win-streak-success', text: 'What factors contributed to the success?', type: 'textarea' },
        { id: 'win-streak-replicate', text: 'Can you increase odds of replicating?', type: 'textarea' },
        { id: 'win-streak-break', text: 'Review the trade that broke the streak.', type: 'textarea' },
        { id: 'drawdown-largest', text: 'What was your largest drawdown?', type: 'textarea' },
        { id: 'drawdown-profile', text: 'Was it within strategy risk profile?', type: 'textarea' },
        { id: 'drawdown-factors', text: 'What factors contributed to the drawdown?', type: 'textarea' },
        { id: 'drawdown-mitigate', text: 'Can this be mitigated in {nextYear}?', type: 'textarea' },
        { id: 'drawdown-break', text: 'Review the trade that broke the losing streak.', type: 'textarea' },
        { id: 'trade-type', text: 'Were certain types of trades profitable/unprofitable?', type: 'textarea' },
        { id: 'markets', text: 'Which markets did you trade well/poorly?', type: 'textarea' },
        { id: 'timing', text: 'Were specific days/times better/worse?', type: 'textarea' },
        { id: 'execution-early-late', text: 'Did you enter trades too early/late?', type: 'textarea' },
        { id: 'execution-profit', text: 'Did you take profit too soon/late?', type: 'textarea' },
        { id: 'execution-stops', text: 'Were stops too tight/loose?', type: 'textarea' },
        { id: 'execution-targets', text: 'Were targets realistic?', type: 'textarea' },
        { id: 'execution-risk-reward', text: 'Poor risk-reward trades?', type: 'textarea' },
        { id: 'execution-risk-size', text: 'Risk too much/little?', type: 'textarea' },
        { id: 'execution-missed', text: 'Frequently miss trades?', type: 'textarea' },
        { id: 'plan-adherence', text: 'Did you deviate from plan?', type: 'textarea' },
        { id: 'plan-holding-back', text: 'Any rule holding you back?', type: 'textarea' }
      ]
    },
    {
      id: 'psychology',
      title: 'Psychology & Emotional Performance',
      questions: [
        { id: 'emotional-patterns', text: 'What emotional patterns repeated?', type: 'textarea' },
        { id: 'best-emotional-state', text: 'Emotional state when performing best?', type: 'textarea' },
        { id: 'worst-emotional-state', text: 'Emotional state when performing worst?', type: 'textarea' },
        { id: 'personal-events', text: 'Did personal events affect performance?', type: 'textarea' },
        { id: 'position-size-emotions', text: 'Emotions increasing position size?', type: 'textarea' },
        { id: 'reviewer-discipline', text: 'What would a reviewer say about discipline?', type: 'textarea' }
      ]
    },
    {
      id: 'execution-professionalism',
      title: 'Execution & Professionalism',
      questions: [
        { id: 'execution-plan', text: 'Did you execute according to plan?', type: 'textarea' },
        { id: 'tech-failures', text: 'Did tech failures affect you?', type: 'textarea' },
        { id: 'workspace', text: 'Maintain professional workspace?', type: 'textarea' }
      ]
    },
    {
      id: 'learning',
      title: 'Learning, Improvement & Research',
      questions: [
        { id: 'resources', text: 'Books/courses/mentors contributed most?', type: 'textarea' },
        { id: 'understanding-deepen', text: 'Did understanding deepen?', type: 'textarea' },
        { id: 'research', text: 'Did you conduct research?', type: 'textarea' },
        { id: 'avoided-learning', text: 'Areas avoided learning?', type: 'textarea' },
        { id: 'expensive-lesson', text: 'Most expensive lesson?', type: 'textarea' }
      ]
    },
    {
      id: 'health',
      title: 'Health, Lifestyle & Sustainability',
      questions: [
        { id: 'sleep-fitness', text: 'Did sleep/fitness affect trading?', type: 'textarea' },
        { id: 'downtime', text: 'Take enough downtime?', type: 'textarea' },
        { id: 'lifestyle-compatible', text: 'Compatible with performance goals?', type: 'textarea' }
      ]
    },
    {
      id: 'process-habits',
      title: 'Process & Habits',
      questions: [
        { id: 'routine', text: 'Keep routine during trading hours?', type: 'textarea' },
        { id: 'improve-process', text: 'Processes to improve but not implemented?', type: 'textarea' },
        { id: 'harmful-habits', text: 'Habits harming performance?', type: 'textarea' },
        { id: 'break-habits', text: 'How to break habits in {nextYear}?', type: 'textarea' }
      ]
    },
    {
      id: 'goals-2026',
      title: '{nextYear} Goal Setting & Personal Development',
      questions: [
        { id: 'avoiding-question', text: 'Question avoiding asking yourself?', type: 'textarea' },
        { id: 'rewind-advice', text: 'Advice to yourself if rewind?', type: 'textarea' },
        { id: 'goals-2026-set', text: 'Goals for {nextYear}?', type: 'textarea' },
        { id: 'systems-routines', text: 'Systems/routines for goals?', type: 'textarea' },
        { id: 'measure-progress', text: 'How to measure progress?', type: 'textarea' },
        { id: 'better-version', text: 'Better version: stop/start doing?', type: 'textarea' }
      ]
    }
  ],
  es: [
    {
      id: 'goals',
      title: 'Metas',
      questions: [
        { id: 'goals-set', text: '¿Definiste metas claras y medibles para {reviewYear}? ¿Cuáles fueron?', type: 'textarea' },
        { id: 'goals-achieved', text: '¿Lograste tus metas? ¿Qué tan desafiantes fueron?', type: 'textarea' },
        { id: 'goals-why', text: '¿Por qué sientes que se lograron o no se lograron?', type: 'textarea' },
        { id: 'goals-not-set', text: 'Si no definiste metas específicas, ¿por qué no?', type: 'textarea' }
      ]
    },
    {
      id: 'pnl',
      title: 'Ganancias y Pérdidas',
      questions: [
        { id: 'pnl-net', text: '¿Cuál fue tu ganancia neta en {reviewYear} después de todos los costos?', type: 'text' },
        { id: 'pnl-win-rate', text: '¿Cuál fue tu tasa general de acierto?', type: 'text' },
        { id: 'pnl-avg-winner', text: '¿Cuál fue tu ganador promedio/perdedor promedio?', type: 'text' },
        { id: 'pnl-content', text: 'Según tu rendimiento, ¿estás satisfecho con los resultados?', type: 'textarea' },
        { id: 'pnl-biggest-reason', text: 'Si no estás satisfecho, ¿cuál es la razón principal?', type: 'textarea' },
        { id: 'pnl-near-disasters', text: '¿Tuviste algún "casi desastre"?', type: 'textarea' }
      ]
    },
    {
      id: 'trading-business',
      title: 'Negocio de Trading',
      questions: [
        { id: 'business-costs', text: 'Revisa todos tus gastos (comisiones, data feeds, etc.)', type: 'textarea' },
        { id: 'business-optimize', text: '¿Puedes optimizar tus costos sin comprometer tu ventaja?', type: 'textarea' },
        { id: 'business-bottleneck', text: '¿Cuál es el mayor cuello de botella que impide escalar?', type: 'textarea' }
      ]
    },
    {
      id: 'market-adaptability',
      title: 'Adaptabilidad al Mercado y Desarrollo de la Ventaja',
      questions: [
        { id: 'edge-improve', text: '¿Tu ventaja mejoró, se estancó o se deterioró? ¿Por qué?', type: 'textarea' },
        { id: 'edge-assumptions', text: '¿Te estás apoyando en supuestos desactualizados?', type: 'textarea' },
        { id: 'edge-new-data', text: '¿Qué datos o herramientas nuevas ignoraste?', type: 'textarea' },
        { id: 'edge-new-strategies', text: '¿Evaluaste o desarrollaste nuevas estrategias?', type: 'textarea' }
      ]
    },
    {
      id: 'performance-review',
      title: 'Revisión de Rendimiento',
      questions: [
        { id: 'win-streak', text: '¿Cuál fue tu mayor racha ganadora?', type: 'textarea' },
        { id: 'win-streak-success', text: '¿Qué factores contribuyeron al éxito?', type: 'textarea' },
        { id: 'win-streak-replicate', text: '¿Puedes aumentar las probabilidades de replicarla?', type: 'textarea' },
        { id: 'win-streak-break', text: 'Revisa la operación que rompió la racha.', type: 'textarea' },
        { id: 'drawdown-largest', text: '¿Cuál fue tu mayor drawdown?', type: 'textarea' },
        { id: 'drawdown-profile', text: '¿Estuvo dentro del perfil de riesgo de tu estrategia?', type: 'textarea' },
        { id: 'drawdown-factors', text: '¿Qué factores contribuyeron al drawdown?', type: 'textarea' },
        { id: 'drawdown-mitigate', text: '¿Puede mitigarse esto en {nextYear}?', type: 'textarea' },
        { id: 'drawdown-break', text: 'Revisa la operación que rompió la racha perdedora.', type: 'textarea' },
        { id: 'trade-type', text: '¿Ciertos tipos de operaciones fueron rentables o no rentables?', type: 'textarea' },
        { id: 'markets', text: '¿Qué mercados operaste bien o mal?', type: 'textarea' },
        { id: 'timing', text: '¿Hubo días u horarios mejores o peores?', type: 'textarea' },
        { id: 'execution-early-late', text: '¿Entraste demasiado temprano o tarde?', type: 'textarea' },
        { id: 'execution-profit', text: '¿Tomaste ganancias demasiado pronto o demasiado tarde?', type: 'textarea' },
        { id: 'execution-stops', text: '¿Los stops fueron demasiado ajustados o demasiado amplios?', type: 'textarea' },
        { id: 'execution-targets', text: '¿Los objetivos fueron realistas?', type: 'textarea' },
        { id: 'execution-risk-reward', text: '¿Hubo operaciones con mala relación riesgo-beneficio?', type: 'textarea' },
        { id: 'execution-risk-size', text: '¿Arriesgaste demasiado o muy poco?', type: 'textarea' },
        { id: 'execution-missed', text: '¿Pierdes operaciones con frecuencia?', type: 'textarea' },
        { id: 'plan-adherence', text: '¿Te desviaste del plan?', type: 'textarea' },
        { id: 'plan-holding-back', text: '¿Hay alguna regla que te esté frenando?', type: 'textarea' }
      ]
    },
    {
      id: 'psychology',
      title: 'Psicología y Rendimiento Emocional',
      questions: [
        { id: 'emotional-patterns', text: '¿Qué patrones emocionales se repitieron?', type: 'textarea' },
        { id: 'best-emotional-state', text: '¿Cuál fue tu estado emocional cuando rendiste mejor?', type: 'textarea' },
        { id: 'worst-emotional-state', text: '¿Cuál fue tu estado emocional cuando rendiste peor?', type: 'textarea' },
        { id: 'personal-events', text: '¿Afectaron eventos personales tu rendimiento?', type: 'textarea' },
        { id: 'position-size-emotions', text: '¿Qué emociones aparecen cuando aumentas el tamaño de posición?', type: 'textarea' },
        { id: 'reviewer-discipline', text: '¿Qué diría un revisor sobre tu disciplina?', type: 'textarea' }
      ]
    },
    {
      id: 'execution-professionalism',
      title: 'Ejecución y Profesionalismo',
      questions: [
        { id: 'execution-plan', text: '¿Ejecutaste de acuerdo con tu plan?', type: 'textarea' },
        { id: 'tech-failures', text: '¿Las fallas técnicas te afectaron?', type: 'textarea' },
        { id: 'workspace', text: '¿Mantuviste un espacio de trabajo profesional?', type: 'textarea' }
      ]
    },
    {
      id: 'learning',
      title: 'Aprendizaje, Mejora e Investigación',
      questions: [
        { id: 'resources', text: '¿Qué libros, cursos o mentores aportaron más?', type: 'textarea' },
        { id: 'understanding-deepen', text: '¿Tu comprensión se profundizó?', type: 'textarea' },
        { id: 'research', text: '¿Realizaste investigación?', type: 'textarea' },
        { id: 'avoided-learning', text: '¿Qué áreas evitaste aprender?', type: 'textarea' },
        { id: 'expensive-lesson', text: '¿Cuál fue la lección más costosa?', type: 'textarea' }
      ]
    },
    {
      id: 'health',
      title: 'Salud, Estilo de Vida y Sostenibilidad',
      questions: [
        { id: 'sleep-fitness', text: '¿El sueño o el estado físico afectaron tu trading?', type: 'textarea' },
        { id: 'downtime', text: '¿Tomaste suficiente tiempo de descanso?', type: 'textarea' },
        { id: 'lifestyle-compatible', text: '¿Tu estilo de vida es compatible con tus metas de rendimiento?', type: 'textarea' }
      ]
    },
    {
      id: 'process-habits',
      title: 'Proceso y Hábitos',
      questions: [
        { id: 'routine', text: '¿Mantuviste una rutina durante el horario de trading?', type: 'textarea' },
        { id: 'improve-process', text: '¿Qué procesos querías mejorar pero no implementaste?', type: 'textarea' },
        { id: 'harmful-habits', text: '¿Qué hábitos están perjudicando tu rendimiento?', type: 'textarea' },
        { id: 'break-habits', text: '¿Cómo romperás esos hábitos en {nextYear}?', type: 'textarea' }
      ]
    },
    {
      id: 'goals-2026',
      title: 'Metas para {nextYear} y Desarrollo Personal',
      questions: [
        { id: 'avoiding-question', text: '¿Qué pregunta estás evitando hacerte?', type: 'textarea' },
        { id: 'rewind-advice', text: 'Si pudieras volver atrás, ¿qué consejo te darías?', type: 'textarea' },
        { id: 'goals-2026-set', text: '¿Cuáles son tus metas para {nextYear}?', type: 'textarea' },
        { id: 'systems-routines', text: '¿Qué sistemas o rutinas respaldarán esas metas?', type: 'textarea' },
        { id: 'measure-progress', text: '¿Cómo medirás el progreso?', type: 'textarea' },
        { id: 'better-version', text: 'Para ser una mejor versión de ti: ¿qué dejarás de hacer y qué empezarás a hacer?', type: 'textarea' }
      ]
    }
  ]
};

const REVIEW_SCHEMA_SECTIONS = REVIEW_SECTIONS_BY_LANGUAGE.en;

const getDefaultReviewYear = (date = new Date()) => date.getFullYear() - 1;

const buildEmptyReview = (year: number): PerformanceReview => ({
  year,
  userId: 'local-user',
  sections: REVIEW_SCHEMA_SECTIONS.map(section => ({
    sectionId: section.id,
    answers: section.questions.map(question => ({
      questionId: question.id,
      answer: '',
    })),
  })),
});

const normalizeReview = (review: PerformanceReview): PerformanceReview => {
  const sectionMap = new Map(review.sections.map(section => [section.sectionId, section]));

  const normalizedSections = REVIEW_SCHEMA_SECTIONS.map((section) => {
    const existingSection = sectionMap.get(section.id);
    const answerMap = new Map((existingSection?.answers ?? []).map(answer => [answer.questionId, answer]));

    const normalizedAnswers = section.questions.map((question) => (
      answerMap.get(question.id) ?? { questionId: question.id, answer: '' }
    ));

    const extraAnswers = (existingSection?.answers ?? []).filter(
      answer => !section.questions.some(question => question.id === answer.questionId)
    );

    return {
      sectionId: section.id,
      answers: [...normalizedAnswers, ...extraAnswers],
    };
  });

  const extraSections = review.sections.filter(
    section => !REVIEW_SCHEMA_SECTIONS.some(template => template.id === section.sectionId)
  );

  return {
    ...review,
    sections: [...normalizedSections, ...extraSections],
  };
};

const buildYearOptions = (reviews: PerformanceReview[]) => {
  const currentYear = new Date().getFullYear();
  const defaultYear = getDefaultReviewYear();
  const yearSet = new Set<number>([
    currentYear,
    defaultYear,
    defaultYear - 1,
    defaultYear - 2,
    defaultYear - 3,
  ]);

  reviews.forEach(review => yearSet.add(review.year));

  return Array.from(yearSet)
    .filter(year => year >= 2000)
    .sort((a, b) => b - a);
};

const interpolateReviewText = (text: string, reviewYear: number) => (
  text
    .replaceAll('{reviewYear}', String(reviewYear))
    .replaceAll('{nextYear}', String(reviewYear + 1))
);

const resolveSectionCopy = (section: ReviewSection, reviewYear: number): ReviewSection => ({
  ...section,
  title: interpolateReviewText(section.title, reviewYear),
  description: section.description ? interpolateReviewText(section.description, reviewYear) : undefined,
  questions: section.questions.map(question => ({
    ...question,
    text: interpolateReviewText(question.text, reviewYear),
    placeholder: question.placeholder ? interpolateReviewText(question.placeholder, reviewYear) : undefined,
  })),
});

const buildExpandedSections = () =>
  Object.fromEntries(REVIEW_SCHEMA_SECTIONS.map((section) => [section.id, true])) as Record<string, boolean>;

const countAnsweredQuestions = (answers: ReviewAnswer[]) =>
  answers.filter((answer) => answer.answer.trim().length > 0).length;

const ReviewCard: React.FC<{
  section: ReviewSection;
  answers: ReviewAnswer[];
  isExpanded: boolean;
  onToggle: () => void;
  onAnswerChange: (questionId: string, answer: string) => void;
  labels: {
    answered: string;
    collapse: string;
    expand: string;
    answerPlaceholder: string;
  };
}> = ({ section, answers, isExpanded, onToggle, onAnswerChange, labels }) => {
  const answeredCount = countAnsweredQuestions(answers);

  return (
    <div className="journal-panel rounded-2xl mb-6 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 p-6 text-left transition hover:bg-[var(--surface-2)]"
        aria-expanded={isExpanded}
      >
        <div>
          <p className="journal-kicker">Review Section</p>
          <h3 className="mt-1 text-xl font-semibold text-[var(--text-main)]">{section.title}</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)] journal-metric">
            {answeredCount}/{section.questions.length} {labels.answered}
          </p>
          {section.description && (
            <p className="mt-2 text-sm text-[var(--text-muted)]">{section.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 pt-1">
          <span className="rounded-full border border-[var(--panel-border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
            {isExpanded ? labels.collapse : labels.expand}
          </span>
          <svg
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          >
            <path d="M5 8L10 13L15 8" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {isExpanded && (
        <div className="space-y-4 border-t journal-divider px-6 pb-6 pt-5">
          {section.questions.map((question) => {
            const answer = answers.find(a => a.questionId === question.id)?.answer || '';
            return (
              <div key={question.id}>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  {question.text}
                </label>
                {question.type === 'textarea' ? (
                  <textarea
                    value={answer}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder || labels.answerPlaceholder}
                    className="journal-input w-full rounded-lg p-3 transition resize-none"
                    rows={3}
                  />
                ) : (
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => onAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder || labels.answerPlaceholder}
                    className="journal-input w-full rounded-lg p-3 transition"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const PerformanceReviewView: React.FC = () => {
  const { language, t } = useI18n();
  const [review, setReview] = useState<PerformanceReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState('');
  const [selectedYear, setSelectedYear] = useState(() => getDefaultReviewYear());
  const [availableYears, setAvailableYears] = useState<number[]>(() => buildYearOptions([]));
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => buildExpandedSections());
  const localizedSections = REVIEW_SECTIONS_BY_LANGUAGE[language];
  const reviewLabels = {
    answered: t('review.answered'),
    collapse: t('review.collapse'),
    expand: t('review.expand'),
    answerPlaceholder: t('review.answer_placeholder'),
  };

  useEffect(() => {
    let isMounted = true;

    const loadAvailableYears = async () => {
      try {
        const reviews = await getReviews();
        if (!isMounted) return;
        setAvailableYears(buildYearOptions(reviews));
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load review years:', getErrorMessage(err));
      }
    };

    loadAvailableYears();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReview = async () => {
      setLoading(true);
      setError('');
      setSaveMessage('');
      try {
        const existingReview = await getReview(selectedYear);
        if (!isMounted) return;

        setReview(existingReview ? normalizeReview(existingReview) : buildEmptyReview(selectedYear));
      } catch (err) {
        if (!isMounted) return;
        setReview(null);
        setError(getErrorMessage(err));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadReview();

    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  const handleAnswerChange = useCallback((sectionId: string, questionId: string, answer: string) => {
    setReview(prev => {
      if (!prev) return null;

      const sectionIndex = prev.sections.findIndex(section => section.sectionId === sectionId);
      if (sectionIndex === -1) {
        return {
          ...prev,
          sections: [
            ...prev.sections,
            { sectionId, answers: [{ questionId, answer }] },
          ],
        };
      }

      const nextSections = [...prev.sections];
      const nextSection = { ...nextSections[sectionIndex] };
      const answerIndex = nextSection.answers.findIndex(existing => existing.questionId === questionId);

      nextSection.answers = answerIndex >= 0
        ? nextSection.answers.map(existing => (
            existing.questionId === questionId ? { ...existing, answer } : existing
          ))
        : [...nextSection.answers, { questionId, answer }];

      nextSections[sectionIndex] = nextSection;

      return {
        ...prev,
        sections: nextSections,
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!review) return;
    setSaving(true);
    setError('');
    setSaveMessage('');
    try {
      const saved = await saveReview(review);
      setReview(normalizeReview(saved));
      setAvailableYears(prev => Array.from(new Set([...prev, saved.year])).sort((a, b) => b - a));
      setSaveMessage(t('review.saved_message').replace('{year}', String(saved.year)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }, [review, t]);

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const toggleAllSections = useCallback(() => {
    setExpandedSections((prev) => {
      const shouldExpandAll = REVIEW_SCHEMA_SECTIONS.some((section) => !prev[section.id]);
      return Object.fromEntries(
        REVIEW_SCHEMA_SECTIONS.map((section) => [section.id, shouldExpandAll])
      ) as Record<string, boolean>;
    });
  }, []);

  const isMissingReviewsTable = error.toLowerCase().includes('relation "public.reviews" does not exist');
  const allSectionsExpanded = REVIEW_SCHEMA_SECTIONS.every((section) => expandedSections[section.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)]"></div>
      </div>
    );
  }

  if (!review && isMissingReviewsTable) {
    return (
      <SchemaError
        title={t('review.setup_title')}
        message={
          <p>
            {t('review.setup_message')}
          </p>
        }
        sql={REVIEWS_TABLE_SETUP_SQL}
      />
    );
  }

  if (!review) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center">
          <IconCalendar className="w-16 h-16 mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-[var(--text-muted)]">{t('review.unable_load')}</h3>
          <p className="text-sm text-[var(--text-subtle)] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
      <div className="space-y-6 animate-content-entry">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-3">
          <div>
            <p className="journal-kicker">Year-End Review</p>
            <h1 className="text-2xl font-semibold text-[var(--text-main)] mt-1"><span className="journal-metric">{selectedYear}</span> {localizedSections.find(section => section.id === 'performance-review')?.title || t('dashboard.sidebar.review')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="review-year" className="text-sm font-medium text-[var(--text-muted)]">
              {t('review.year_label')}
            </label>
            <select
              id="review-year"
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="journal-input rounded-lg px-3 py-2 transition journal-metric"
            >
              {availableYears.map((year) => (
                <option key={year} value={year} className="bg-slate-900 text-white">
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleAllSections}
            className="journal-button-secondary rounded-lg px-4 py-2 text-sm font-medium transition"
          >
            {allSectionsExpanded ? t('review.collapse_all') : t('review.expand_all')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="journal-button-primary flex items-center justify-center px-4 py-2 rounded-lg font-semibold hover:opacity-95 transition-all disabled:opacity-50 disabled:shadow-none"
          >
            <IconSparkles className="w-5 h-5 mr-2" />
            {saving ? t('review.saving') : t('review.save')}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
          <p className="font-semibold">{t('common.error')}</p>
          <p>{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl">
          {saveMessage}
        </div>
      )}

      <div className="journal-panel-muted rounded-2xl p-5 mb-6">
        <p className="journal-kicker mb-2">Review Prompt</p>
        <p className="text-sm leading-relaxed">
          {t('review.intro')}
        </p>
      </div>

      {localizedSections.map((section) => {
        const displaySection = resolveSectionCopy(section, selectedYear);
        const sectionData = review.sections.find(s => s.sectionId === section.id);
        const answers = sectionData?.answers || [];
        return (
          <ReviewCard
            key={section.id}
            section={displaySection}
            answers={answers}
            isExpanded={expandedSections[section.id]}
            onToggle={() => toggleSection(section.id)}
            onAnswerChange={(questionId, answer) => handleAnswerChange(section.id, questionId, answer)}
            labels={reviewLabels}
          />
        );
      })}
    </div>
  );
};

export default PerformanceReviewView;
