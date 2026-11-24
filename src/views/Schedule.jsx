import { ChevronLeft, ChevronRight } from 'lucide-react'
import { IconButton, SectionHeading } from '../components/ui'
import { formatMinutes, prettyDate, today, toDateKey, weekStart } from '../utils/formatters'
import { studyNow } from '../data/studyData'

export default function ScheduleView({
  data,
  subjectById,
  openModal,
  weekOffset,
  setWeekOffset,
  addEvent,
}) {
  const now = studyNow()
  const currentDay = today()

  const start = weekStart(now)
  start.setDate(start.getDate() + weekOffset * 7)

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })

  const hours = Array.from({ length: 13 }, (_, index) => index + 7)

  const range = `${prettyDate(days[0], {
    month: 'short',
    day: 'numeric',
  })} – ${prettyDate(days[6], {
    month: 'short',
    day: 'numeric',
    year:
      days[6].getFullYear() !== now.getFullYear()
        ? 'numeric'
        : undefined,
  })}`

  const dayEvents = (key) =>
    data.events
      .filter((event) => event.date === key)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const colors = {
    school: '#8495b8',
    lesson: '#d39c54',
    study: '#6a9c87',
    exam: '#ca7d70',
  }

  return (
    <>
      <SectionHeading
        eyebrow="Make room for what matters"
        title="Schedule"
        copy="A week that gives your study time somewhere to land."
        action="Add event"
        onAction={() => addEvent()}
      />

      <div
        className="card card-pad schedule-card"
        style={{ paddingBottom: 11 }}
      >
        <div className="card-head schedule-toolbar">
          <div className="week-nav">
            <IconButton
              label="Previous week"
              onClick={() => setWeekOffset((value) => value - 1)}
            >
              <ChevronLeft size={16} />
            </IconButton>

            <span className="week-label">{range}</span>

            <IconButton
              label="Next week"
              onClick={() => setWeekOffset((value) => value + 1)}
            >
              <ChevronRight size={16} />
            </IconButton>

            <button
              className="button secondary small"
              type="button"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </button>
          </div>

          <div className="week-summary">
            <span>
              <strong>
                {
                  data.events.filter((event) =>
                    days.some((day) => toDateKey(day) === event.date),
                  ).length
                }
              </strong>{' '}
              events this week
            </span>

            <span>
              <strong>
                {formatMinutes(
                  data.sessions
                    .filter((session) => {
                      const date = new Date(session.completedAt)
                      return (
                        date >= start &&
                        date < new Date(start.getTime() + 7 * 86400000)
                      )
                    })
                    .reduce(
                      (sum, item) =>
                        sum + Number(item.durationMinutes || 0),
                      0,
                    ),
                )}
              </strong>{' '}
              studied
            </span>
          </div>
        </div>

        <div className="calendar">
          <div className="calendar-grid">
            <div className="calendar-head" />

            {days.map((date) => (
              <div
                className={`calendar-head${
                  toDateKey(date) === currentDay ? ' today' : ''
                }`}
                key={date.toISOString()}
              >
                {new Intl.DateTimeFormat(undefined, {
                  weekday: 'short',
                }).format(date)}
                <strong>{date.getDate()}</strong>
              </div>
            ))}

            {hours.map((hour) => (
              <div
                className="calendar-row"
                style={{ display: 'contents' }}
                key={hour}
              >
                <div className="time-cell">
                  {hour === 12
                    ? '12 pm'
                    : hour > 12
                      ? `${hour - 12} pm`
                      : `${hour} am`}
                </div>

                {days.map((date) => {
                  const key = toDateKey(date)

                  const hourEvents = dayEvents(key).filter(
                    (event) =>
                      Number(event.startTime.split(':')[0]) === hour,
                  )

                  return (
                    <div
                      className="calendar-cell"
                      key={`${key}-${hour}`}
                      role="button"
                      tabIndex="0"
                      aria-label={`Add event ${hour}:00 on ${prettyDate(key)}`}
                      onClick={() =>
                        addEvent(key, `${String(hour).padStart(2, '0')}:00`)
                      }
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault()
                          addEvent(
                            key,
                            `${String(hour).padStart(2, '0')}:00`,
                          )
                        }
                      }}
                    >
                      {hourEvents.map((event) => (
                        <button
                          className="calendar-event"
                          type="button"
                          key={event.id}
                          style={{
                            '--event-color': colors[event.type],
                          }}
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            openModal('event', event)
                          }}
                          title={`${event.title} · ${event.startTime}–${event.endTime}`}
                        >
                          <strong>{event.title}</strong>
                          <small>
                            {event.startTime} ·{' '}
                            {subjectById(event.subjectId)?.name ||
                              event.type}
                          </small>
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="schedule-agenda">
          {days.map((date) => {
            const key = toDateKey(date)
            const events = dayEvents(key)
            const isToday = key === currentDay

            return (
              <section
                className={`agenda-day${isToday ? ' is-today' : ''}`}
                key={key}
              >
                <div className="agenda-day-heading">
                  <div className="agenda-date">
                    <span>
                      {new Intl.DateTimeFormat(undefined, {
                        weekday: 'short',
                      }).format(date)}
                    </span>
                    <strong>{date.getDate()}</strong>
                  </div>

                  <span className="agenda-day-count">
                    {events.length
                      ? `${events.length} ${
                          events.length === 1 ? 'event' : 'events'
                        }`
                      : 'Open day'}
                  </span>

                  <button
                    className="button secondary small agenda-add-button"
                    type="button"
                    onClick={() => addEvent(key, '15:00')}
                  >
                    + Add
                  </button>
                </div>

                {events.length ? (
                  <div className="agenda-event-list">
                    {events.map((event) => (
                      <button
                        className="agenda-event"
                        key={event.id}
                        type="button"
                        style={{
                          '--event-color':
                            colors[event.type] || 'var(--accent)',
                        }}
                        onClick={() => openModal('event', event)}
                        aria-label={`Edit ${event.title}, ${event.startTime} to ${event.endTime}`}
                      >
                        <span className="agenda-event-time">
                          {event.startTime}
                          <small>
                            {event.endTime ? `–${event.endTime}` : ''}
                          </small>
                        </span>

                        <span className="agenda-event-details">
                          <strong>{event.title}</strong>
                          <small>
                            {event.type}
                            {subjectById(event.subjectId)?.name
                              ? ` · ${subjectById(event.subjectId).name}`
                              : ''}
                          </small>
                        </span>

                        <span className="agenda-event-mark" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    className="agenda-empty-slot"
                    type="button"
                    onClick={() => addEvent(key, '15:00')}
                  >
                    Nothing planned · add an event
                  </button>
                )}
              </section>
            )
          })}
        </div>

        <div
          className="card-caption"
          style={{ padding: '12px 5px 0' }}
        >
          Select an open time to add an event. Select an event to edit it.
        </div>
      </div>

      <div
        className="grid section-gap schedule-type-grid"
        style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
      >
        {['school', 'lesson', 'study', 'exam'].map((type) => (
          <div className="card card-pad" key={type}>
            <div className="mini-stat-top">
              <span style={{ textTransform: 'capitalize' }}>
                {type}
              </span>
              <span
                className="subject-dot"
                style={{ '--subject-color': colors[type] }}
              />
            </div>

            <div
              className="metric"
              style={{ marginTop: 12, fontSize: 22 }}
            >
              {
                data.events.filter(
                  (event) =>
                    days.some((day) => toDateKey(day) === event.date) &&
                    event.type === type,
                ).length
              }
            </div>

            <div className="card-caption">this week</div>
          </div>
        ))}
      </div>
    </>
  )
}
