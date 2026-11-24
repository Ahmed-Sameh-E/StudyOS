import { useState } from 'react'
import { BookOpen, Check, Clock3, Flame, Pause, Play, RotateCcw, Sparkles, Timer } from 'lucide-react'
import { SectionHeading } from '../components/ui'
import { formatMinutes } from '../utils/formatters'

const PRESETS = [
  { minutes: 25, name: 'Quick focus', hint: 'A focused sprint' },
  { minutes: 50, name: 'Deep work', hint: 'Room to get into it' },
  { minutes: 90, name: 'Long session', hint: 'For the big topics' },
]

export default function FocusView({ data, stats, app, subjectById, timerRemainingSeconds, notify, navigate }) {
  const timer = data.timer
  const [custom, setCustom] = useState('')
  const [customError, setCustomError] = useState('')
  const remaining = Math.max(0, timerRemainingSeconds)
  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const progress = timer.durationSeconds ? Math.max(0, Math.min(1, 1 - remaining / timer.durationSeconds)) : 0
  const circumference = 2 * Math.PI * 116
  const dashOffset = circumference * (1 - progress)
  const hasStarted = Boolean(timer.startedAt)
  const selectedSubject = subjectById(timer.subjectId)
  const configuredDailyGoal = Number(data.settings.dailyGoalMinutes)
  const dailyGoal = Number.isFinite(configuredDailyGoal) && configuredDailyGoal > 0 ? configuredDailyGoal : null
  const goalProgress = dailyGoal ? Math.min(100, (stats.daily / dailyGoal) * 100) : 0
  const currentPreset = PRESETS.find((preset) => preset.minutes * 60 === timer.durationSeconds)

  const preset = (value) => {
    app.resetTimer(value * 60)
    setCustom('')
    setCustomError('')
  }

  const applyCustom = (event) => {
    event.preventDefault()
    const value = Number(custom)
    if (!Number.isInteger(value) || value < 1 || value > 180) {
      setCustomError('Enter a whole number from 1 to 180.')
      return
    }
    preset(value)
  }

  const setRunning = () => {
    if (timer.isRunning) {
      app.pauseTimer()
      notify('Focus paused. Take a breath, then continue.')
    } else {
      app.startTimer()
    }
  }

  return (
    <div className="focus-view">
      <SectionHeading eyebrow="Your quiet hour" title="Find your focus." copy="One clear block. One thing at a time." />

      <div className="timer-layout focus-layout">
        <section className="card timer-card focus-session-card" aria-labelledby="focus-session-title">
          <div className="focus-session-top">
            <div className="focus-session-identity">
              <span className="focus-session-mark"><Sparkles size={17} /></span>
              <div>
                <div className="focus-overline">STUDY SESSION</div>
                <h2 id="focus-session-title">{timer.isRunning ? 'You’re in the zone' : hasStarted ? 'Pick up where you left off' : 'Make this time yours'}</h2>
              </div>
            </div>
            <div className={`timer-state${timer.isRunning ? ' is-live' : ''}`}>
              <span className="timer-state-dot" />
              {timer.isRunning ? 'IN FOCUS' : hasStarted ? 'PAUSED' : 'READY'}
            </div>
          </div>

          <div className="timer-stage">
            <div className={`timer-face${timer.isRunning ? ' is-running' : ''}`}>
              <svg className="timer-ring" viewBox="0 0 260 260" aria-hidden="true">
                <circle className="timer-ring-track" cx="130" cy="130" r="116" />
                <circle
                  className="timer-ring-progress"
                  cx="130"
                  cy="130"
                  r="116"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="timer-readout">
                <div className="timer-readout-overline">{currentPreset?.name || 'CUSTOM SESSION'}</div>
                <div
                  className="timer-time"
                  role="timer"
                  aria-label={`${minutes} minutes ${seconds} seconds remaining`}
                  aria-live="off"
                >
                  {String(minutes).padStart(2, '0')}<span>:</span>{String(seconds).padStart(2, '0')}
                </div>
                <div className="timer-label">{timer.isRunning ? 'Keep your rhythm' : hasStarted ? 'Ready when you are' : 'Minutes of calm progress'}</div>
              </div>
            </div>
          </div>

          <div className="focus-session-meta">
            <span className="focus-subject-chip">
              <BookOpen size={14} />
              {selectedSubject?.name || 'Choose a subject'}
            </span>
            <span className="focus-duration-chip"><Clock3 size={14} />{Math.round(timer.durationSeconds / 60)} minutes</span>
          </div>

          <div className="timer-controls focus-controls">
            <button className="button focus-start-button" type="button" onClick={setRunning}>
              {timer.isRunning ? <><Pause size={17} fill="currentColor" />Pause session</> : <><Play size={17} fill="currentColor" />{hasStarted ? 'Resume session' : 'Start focusing'}</>}
            </button>
            <button
              className="button secondary focus-reset-button"
              type="button"
              onClick={() => { app.resetTimer(); notify('Timer reset.') }}
              aria-label="Reset timer"
            >
              <RotateCcw size={16} /><span>Reset</span>
            </button>
          </div>
          <div className="focus-save-note"><Check size={14} /> Your session saves automatically when the timer ends.</div>
        </section>

        <aside className="focus-setup-column" aria-label="Session setup and daily progress">
          <section className="card timer-side focus-setup-card">
            <div className="focus-setup-heading">
              <span className="focus-setup-icon"><Timer size={18} /></span>
              <div>
                <div className="focus-overline">MAKE A PLAN</div>
                <h2>Set up your session</h2>
              </div>
            </div>
            <p className="focus-setup-copy">Choose a pace that feels right for the work ahead.</p>

            <div className="focus-field">
              <div className="focus-field-heading"><label>Choose a session</label><span>MINUTES</span></div>
              <div className="focus-preset-grid">
                {PRESETS.map(({ minutes: value, name, hint }) => {
                  const isSelected = timer.durationSeconds === value * 60
                  return (
                    <button
                      className={`focus-preset${isSelected ? ' selected' : ''}`}
                      key={value}
                      type="button"
                      disabled={timer.isRunning}
                      onClick={() => preset(value)}
                      aria-pressed={isSelected}
                    >
                      <span className="focus-preset-number">{value}<small>m</small></span>
                      <span className="focus-preset-name">{name}</span>
                      <span className="focus-preset-hint">{hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <form className="focus-field" onSubmit={applyCustom}>
              <label htmlFor="custom-minutes" className="focus-field-label">Or choose your own</label>
              <div className="focus-custom-control">
                <input
                  id="custom-minutes"
                  className="input"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="180"
                  step="1"
                  value={custom}
                  disabled={timer.isRunning}
                  onChange={(event) => { setCustom(event.target.value); setCustomError('') }}
                  placeholder="1–180"
                  aria-describedby={customError ? 'custom-minutes-error' : undefined}
                />
                <button className="button secondary focus-apply-button" type="submit" disabled={timer.isRunning}>Apply</button>
              </div>
              {customError && <span id="custom-minutes-error" className="focus-error" role="alert">{customError}</span>}
            </form>

            <div className="focus-field focus-subject-field">
              <label htmlFor="timer-subject" className="focus-field-label">I’m studying</label>
              <div className="focus-select-wrap">
                <BookOpen size={16} />
                <select
                  id="timer-subject"
                  className="select"
                  value={timer.subjectId || ''}
                  disabled={timer.isRunning}
                  onChange={(event) => app.setTimer({ subjectId: event.target.value || null })}
                >
                  <option value="">Choose a subject</option>
                  {data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>
            </div>
          </section>

          <section className="card focus-daily-card" aria-labelledby="daily-progress-title">
            <div className="focus-daily-heading">
              <span className="focus-daily-icon"><Flame size={17} /></span>
              <div><div className="focus-overline">A LITTLE EACH DAY</div><h2 id="daily-progress-title">Today’s progress</h2></div>
            </div>
            <div className="focus-daily-metric">
              <strong>{formatMinutes(stats.daily)}</strong>
              <span>{dailyGoal ? `of ${formatMinutes(dailyGoal)} goal` : 'studied today'}</span>
            </div>
            <div
              className="focus-daily-progress"
              role="progressbar"
              aria-label="Daily study goal progress"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={Math.round(goalProgress)}
            >
              <span style={{ width: `${goalProgress}%` }} />
            </div>
            <div className="focus-daily-footer">
              <span>{!dailyGoal ? 'A small goal can help you stay consistent.' : goalProgress >= 100 ? 'Daily goal reached — well done!' : `${Math.max(0, dailyGoal - stats.daily)} minutes to go`}</span>
              <span>{Math.round(goalProgress)}%</span>
            </div>
            {!dailyGoal && (
              <button className="focus-goal-link" type="button" onClick={() => navigate('settings')}>Set a daily goal</button>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
