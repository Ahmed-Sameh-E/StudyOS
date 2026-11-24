import { ArrowDownRight, Pencil, Target, Trash2 } from 'lucide-react'
import { EmptyState, IconButton, SectionHeading } from '../components/ui'
import { formatHours, formatMinutes, today } from '../utils/formatters'
import { todayKey, studyNow } from '../data/studyData'

export default function GoalsView({ data, openModal, app }) {
  const now = studyNow()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const activeGoals = data.goals.filter((goal) => goal.active)

  const goalProgress = (goal) => {
    const scoped = goal.subjectId
      ? data.sessions.filter((session) => session.subjectId === goal.subjectId)
      : data.sessions

    const amount = goal.period === 'daily'
      ? scoped
          .filter(
            (session) =>
              todayKey(new Date(session.completedAt)) === today(),
          )
          .reduce((sum, session) => sum + session.durationMinutes, 0)
      : scoped
          .filter(
            (session) =>
              new Date(session.completedAt) >= monthStart &&
              new Date(session.completedAt) < monthEnd,
          )
          .reduce((sum, session) => sum + session.durationMinutes, 0)

    return {
      amount,
      progress: Math.min(
        100,
        Math.round((amount / goal.targetMinutes) * 100),
      ),
    }
  }

  const deactivate = (goal) =>
    app.edit('goals', goal.id, { active: !goal.active })

  return (
    <>
      <SectionHeading
        eyebrow="Progress, not perfection"
        title="Goals"
        copy="Set a realistic rhythm and let small sessions compound."
        action="Create goal"
        onAction={() => openModal('goal')}
      />

      <div
        className="grid"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        }}
      >
        {activeGoals.map((goal) => {
          const { amount, progress } = goalProgress(goal)

          const targetLabel =
            goal.period === 'monthly'
              ? `${formatHours(goal.targetMinutes)} / month`
              : `${formatMinutes(goal.targetMinutes)} / day`

          return (
            <article className="card goal-card" key={goal.id}>
              <div className="card-head">
                <div className="goal-line">
                  <div className="goal-check">
                    <Target size={15} />
                  </div>

                  <div>
                    <div className="goal-name">{goal.title}</div>
                    <div className="goal-meta">
                      {goal.period === 'daily'
                        ? 'Daily goal'
                        : 'Monthly goal'}
                      {goal.subjectId
                        ? ` · ${
                            data.subjects.find(
                              (subject) => subject.id === goal.subjectId,
                            )?.name || ''
                          }`
                        : ''}
                    </div>
                  </div>
                </div>

                <div className="row-actions">
                  <IconButton
                    label="Edit goal"
                    onClick={() => openModal('goal', goal)}
                  >
                    <Pencil size={14} />
                  </IconButton>

                  <IconButton
                    label="Delete goal"
                    onClick={() =>
                      openModal('delete', goal, { entity: 'goal' })
                    }
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <div className="metric" style={{ fontSize: 27 }}>
                  {goal.period === 'monthly'
                    ? formatHours(amount)
                    : formatMinutes(amount)}
                </div>

                <span className="muted" style={{ fontSize: 10 }}>
                  {targetLabel}
                </span>
              </div>

              <div className="progress-line">
                <span style={{ width: `${progress}%` }} />
              </div>

              <div className="metric-sub">
                {progress >= 100
                  ? 'Target reached. Keep your momentum.'
                  : `${progress}% complete`}
              </div>

              <div className="divider" />

              <button
                className="text-link"
                type="button"
                onClick={() => deactivate(goal)}
              >
                Pause this goal <ArrowDownRight size={13} />
              </button>
            </article>
          )
        })}
      </div>

      {activeGoals.length === 0 && (
        <section className="card">
          <EmptyState
            icon={Target}
            title="Start with one useful goal"
            copy="Try a 150-minute daily study target or 100 hours across the month."
            action="Create a goal"
            onAction={() => openModal('goal')}
          />
        </section>
      )}

      {data.goals.some((goal) => !goal.active) && (
        <section className="card card-pad section-gap">
          <div className="card-head">
            <div>
              <h2 className="card-title">Paused goals</h2>
              <div className="card-caption">
                Bring one back whenever it feels right.
              </div>
            </div>
          </div>

          {data.goals
            .filter((goal) => !goal.active)
            .map((goal) => (
              <div className="task-row" key={goal.id}>
                <div className="goal-name">{goal.title}</div>

                <span className="muted" style={{ fontSize: 10 }}>
                  {goal.period}
                </span>

                <button
                  className="button secondary small"
                  type="button"
                  onClick={() => deactivate(goal)}
                >
                  Resume
                </button>

                <IconButton
                  label="Delete goal"
                  onClick={() =>
                    openModal('delete', goal, { entity: 'goal' })
                  }
                >
                  <Trash2 size={14} />
                </IconButton>
              </div>
            ))}
        </section>
      )}
    </>
  )
}