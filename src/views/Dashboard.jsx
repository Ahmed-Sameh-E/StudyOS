import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckSquare2,
  Clock3,
  Flame,
  Target,
} from 'lucide-react'

import { EmptyState, SectionHeading } from '../components/ui'

import {
  formatMinutes,
  prettyDate,
  toDateKey,
  weekStart,
} from '../utils/formatters'

import { studyNow } from '../data/studyData'

export default function Dashboard({
  data,
  stats,
  nextTask,
  navigate,
  subjectById,
  toggleComplete,
  openModal,
}) {
  // Use the corrected StudyOS date instead of the device date.
  const now = studyNow()
  const currentDay = toDateKey(now)

  const dailyGoal = data.settings.dailyGoalMinutes || 150

  const tasksDue = data.tasks
    .filter(
      (task) =>
        !task.completed &&
        (!task.dueDate || task.dueDate <= currentDay),
    )
    .sort((a, b) =>
      (a.dueDate || '').localeCompare(b.dueDate || ''),
    )
    .slice(0, 4)

  const upcoming = data.events
    .filter((event) => event.date >= currentDay)
    .sort((a, b) =>
      `${a.date}${a.startTime}`.localeCompare(
        `${b.date}${b.startTime}`,
      ),
    )
    .slice(0, 4)

  const week = weekStart(now)

  const chart = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(week)
    date.setDate(week.getDate() + index)

    const key = toDateKey(date)

    return {
      day: new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
      }).format(date),
      minutes: stats.dayMinutes(key),
    }
  })

  return (
    <>
      <SectionHeading
        eyebrow={prettyDate(currentDay, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        })}
        title={`Good ${
          now.getHours() < 12
            ? 'morning'
            : now.getHours() < 18
              ? 'afternoon'
              : 'evening'
        }, ${data.settings.studentName || 'Student'}.`}
        copy="A clear view of what matters today."
        action="New task"
        onAction={() => openModal('task')}
      />

      <div className="grid dashboard-grid">
        {/* Today's Study Time */}
        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h2 className="card-title">Today’s study time</h2>
              <div className="card-caption">
                A little progress, consistently.
              </div>
            </div>

            <div className="mini-stat-icon">
              <Clock3 size={16} />
            </div>
          </div>

          <div className="metric">
            {formatMinutes(stats.daily)}
            <small>/ {formatMinutes(dailyGoal)}</small>
          </div>

          <div
            className="progress-line"
            aria-label={`${
              Math.min(
                100,
                Math.round((stats.daily / dailyGoal) * 100),
              )
            }% of daily study goal`}
          >
            <span
              style={{
                width: `${
                  Math.min(
                    100,
                    Math.round((stats.daily / dailyGoal) * 100),
                  )
                }%`,
              }}
            />
          </div>

          <div className="metric-sub">
            <span>
              {stats.daily >= dailyGoal
                ? 'Daily goal reached. Nice work.'
                : `${formatMinutes(
                    Math.max(0, dailyGoal - stats.daily),
                  )} to your daily goal`}
            </span>

            <span style={{ marginLeft: 'auto' }}>
              {Math.min(
                100,
                Math.round((stats.daily / dailyGoal) * 100),
              )}
              %
            </span>
          </div>
        </section>

        {/* Open Tasks */}
        <section className="card card-pad mini-stat">
          <div className="mini-stat-top">
            <span>Open tasks</span>
            <span className="mini-stat-icon">
              <CheckSquare2 size={15} />
            </span>
          </div>

          <div>
            <div className="metric">
              {data.tasks.filter((task) => !task.completed).length}
            </div>

            <div className="metric-sub">
              {data.tasks.filter((task) => task.completed).length}{' '}
              completed so far
            </div>
          </div>

          <button
            className="text-link"
            type="button"
            onClick={() => navigate('tasks')}
          >
            See your tasks <ArrowRight size={13} />
          </button>
        </section>

        {/* Current Streak */}
        <section className="card card-pad mini-stat">
          <div className="mini-stat-top">
            <span>Current streak</span>
            <span className="mini-stat-icon">
              <Flame size={15} />
            </span>
          </div>

          <div>
            <div className="metric">
              {stats.streak}{' '}
              <small>
                {stats.streak === 1 ? 'day' : 'days'}
              </small>
            </div>

            <div className="metric-sub">
              Longest streak: {stats.longest}{' '}
              {stats.longest === 1 ? 'day' : 'days'}
            </div>
          </div>

          <button
            className="text-link"
            type="button"
            onClick={() => navigate('statistics')}
          >
            View your progress <ArrowRight size={13} />
          </button>
        </section>

        {/* Your Next Move */}
        <section className="card card-pad next-move-card">
          <div className="card-head">
            <div>
              <h2 className="card-title">Your next move</h2>
              <div className="card-caption">
                The task that matters most right now.
              </div>
            </div>

            <div className="mini-stat-icon">
              <Target size={16} />
            </div>
          </div>

          {nextTask ? (
            <>
              <div className="next-move-main">
                <div className="next-move-title">
                  {nextTask.title}
                </div>

                <div className="next-move-meta">
                  <span>
                    {nextTask.type === 'core' ? 'Core' : 'Routine'}
                  </span>

                  <span>·</span>

                  <span>{nextTask.priority}</span>

                  {nextTask.dueDate && (
                    <>
                      <span>·</span>
                      <span>
                        {nextTask.dueDate === currentDay
                          ? 'Due today'
                          : prettyDate(nextTask.dueDate, {
                              month: 'short',
                              day: 'numeric',
                            })}
                      </span>
                    </>
                  )}
                </div>

                {Array.isArray(nextTask.subtasks) &&
                  nextTask.subtasks.length > 0 && (
                    <div className="next-move-progress">
                      {nextTask.subtasks.filter(
                        (subtask) => subtask.completed,
                      ).length}
                      /{nextTask.subtasks.length} subtasks complete
                    </div>
                  )}
              </div>

              <button
                className="text-link"
                type="button"
                onClick={() => navigate('tasks')}
              >
                Open tasks <ArrowRight size={13} />
              </button>
            </>
          ) : (
            <EmptyState
              icon={Target}
              title="You're all clear"
              copy="No pending tasks. Add something when you're ready."
              action="Add task"
              onAction={() => openModal('task')}
            />
          )}
        </section>

        {/* Weekly Chart */}
        <section className="card card-pad dash-chart">
          <div className="card-head">
            <div>
              <h2 className="card-title">
                Your week, at a glance
              </h2>
              <div className="card-caption">
                Study minutes by day
              </div>
            </div>

            <button
              className="text-link"
              type="button"
              onClick={() => navigate('statistics')}
            >
              Full report <ArrowRight size={13} />
            </button>
          </div>

          <div className="chart-wrap">
            <WeeklyChart data={chart} />
          </div>
        </section>

        {/* Tasks Due */}
        <section className="card card-pad task-preview">
          <div className="card-head">
            <div>
              <h2 className="card-title">Due today</h2>
              <div className="card-caption">
                {tasksDue.length} tasks need a little attention
              </div>
            </div>

            <button
              className="text-link"
              type="button"
              onClick={() => navigate('tasks')}
            >
              All tasks <ArrowRight size={13} />
            </button>
          </div>

          {tasksDue.length ? (
            tasksDue.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                subject={subjectById(task.subjectId)}
                onToggle={() => toggleComplete(task.id)}
              />
            ))
          ) : (
            <EmptyState
              icon={CheckSquare2}
              title="Nothing pressing today"
              copy="Your tasks are clear. Add one when something comes up."
              action="Add task"
              onAction={() => openModal('task')}
            />
          )}
        </section>

        {/* Upcoming Events */}
        <section className="card card-pad up-next">
          <div className="card-head">
            <div>
              <h2 className="card-title">Coming up</h2>
              <div className="card-caption">
                Your next school and study events
              </div>
            </div>

            <button
              className="text-link"
              type="button"
              onClick={() => navigate('schedule')}
            >
              Open schedule <ArrowRight size={13} />
            </button>
          </div>

          {upcoming.length ? (
            upcoming.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                subject={subjectById(event.subjectId)}
                currentDay={currentDay}
              />
            ))
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Your calendar is open"
              copy="Add an event to make space for the work ahead."
              action="Add event"
              onAction={() => navigate('schedule')}
            />
          )}
        </section>
      </div>
    </>
  )
}

function WeeklyChart({ data }) {
  const width = 700
  const height = 205
  const left = 34
  const right = 10
  const top = 8
  const bottom = 24

  const max = Math.max(
    20,
    Math.ceil(
      Math.max(...data.map((item) => item.minutes), 0) / 20,
    ) * 20,
  )

  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const points = data.map((item, index) => ({
    ...item,
    x:
      left +
      (data.length <= 1
        ? 0
        : (index / (data.length - 1)) * plotWidth),
    y:
      top +
      plotHeight -
      (item.minutes / max) * plotHeight,
  }))

  const line = points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const previous = points[index - 1]
    const midpoint = (previous.x + point.x) / 2

    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`
  }, '')

  const area = `${line} L ${
    points.at(-1)?.x || left
  } ${height - bottom} L ${
    points[0]?.x || left
  } ${height - bottom} Z`

  const ticks = Array.from(
    { length: 5 },
    (_, index) => Math.round((max * index) / 4),
  )

  return (
    <svg
      className="weekly-chart"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Study minutes by day this week"
    >
      <defs>
        <linearGradient
          id="weekly-chart-fill"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="var(--accent)"
            stopOpacity=".28"
          />
          <stop
            offset="95%"
            stopColor="var(--accent)"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>

      {ticks.map((tick) => {
        const y =
          top + plotHeight - (tick / max) * plotHeight

        return (
          <g key={tick}>
            <line
              x1={left}
              y1={y}
              x2={width - right}
              y2={y}
              stroke="var(--line)"
            />

            <text
              x={left - 8}
              y={y + 3}
              textAnchor="end"
              fill="var(--muted)"
              fontSize="10"
            >
              {tick}
            </text>
          </g>
        )
      })}

      <path d={area} fill="url(#weekly-chart-fill)" />

      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((point) => (
        <g key={point.day}>
          <circle
            cx={point.x}
            cy={point.y}
            r="3"
            fill="var(--accent)"
          >
            <title>
              {point.day}: {point.minutes} minutes
            </title>
          </circle>

          <text
            x={point.x}
            y={height - 5}
            textAnchor="middle"
            fill="var(--muted)"
            fontSize="10"
          >
            {point.day}
          </text>
        </g>
      ))}
    </svg>
  )
}

function TaskRow({ task, subject, onToggle }) {
  return (
    <div className="task-row">
      <button
        type="button"
        aria-label={
          task.completed
            ? `Mark ${task.title} incomplete`
            : `Complete ${task.title}`
        }
        className={`check-button${
          task.completed ? ' checked' : ''
        }`}
        onClick={onToggle}
      >
        {task.completed && <Check size={12} />}
      </button>

      <div className="task-row-main">
        <div
          className={`task-title${
            task.completed ? ' done' : ''
          }`}
        >
          {task.title}
        </div>

        <div className="task-meta">
          <span>{subject?.name || 'No subject'}</span>
          <span>·</span>
          <span>
            {task.dueDate
              ? prettyDate(task.dueDate, {
                  month: 'short',
                  day: 'numeric',
                })
              : 'No due date'}
          </span>
        </div>
      </div>

      <span className={`priority ${task.priority}`}>
        <i className="priority-dot" />
        {task.priority}
      </span>
    </div>
  )
}

function EventRow({ event, subject, currentDay }) {
  const kindColors = {
    school: '#8395ba',
    lesson: '#d29b4d',
    study: '#5e997f',
    exam: '#c7796b',
  }

  return (
    <div className="event-row">
      <div className="event-time">
        {event.date === currentDay
          ? 'Today'
          : prettyDate(event.date, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
        <br />
        {event.startTime}
      </div>

      <div
        className="event-mark"
        style={{
          background:
            kindColors[event.type] || 'var(--accent)',
        }}
      />

      <div className="event-details">
        <strong>{event.title}</strong>
        <span>
          {subject?.name || 'No subject'}
          {event.endTime ? ` · until ${event.endTime}` : ''}
        </span>
      </div>

      <span className="event-kind">{event.type}</span>
    </div>
  )
}