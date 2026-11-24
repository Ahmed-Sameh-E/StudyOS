import { useState } from 'react'
import {
  Check,
  CheckSquare2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react'
import {
  EmptyState,
  IconButton,
  SectionHeading
} from '../components/ui'
import { prettyDate, today } from '../utils/formatters'

export default function TasksView({
  data,
  subjectById,
  toggleComplete,
  toggleSubtask,
  openModal,
  filter,
  setFilter,
  subjectFilter,
  setSubjectFilter
}) {
  const [showCompleted, setShowCompleted] = useState(false)

  const priorityOrder = {
    high: 0,
    medium: 1,
    low: 2
  }

  const sortTasks = (tasks) =>
    [...tasks].sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 1) -
          (priorityOrder[b.priority] ?? 1) ||
        (a.dueDate || '9999').localeCompare(
          b.dueDate || '9999'
        )
    )

  const visible = data.tasks.filter(
    (task) =>
      (filter === 'all' ||
        (filter === 'open' && !task.completed) ||
        (filter === 'done' && task.completed)) &&
      (subjectFilter === 'all' ||
        task.subjectId === subjectFilter)
  )

  const openTasks = visible.filter(
    (task) => !task.completed
  )

  const completedTasks = visible.filter(
    (task) => task.completed
  )

  const coreOpen = sortTasks(
    openTasks.filter((task) => task.type === 'core')
  )

  const routineOpen = sortTasks(
    openTasks.filter(
      (task) => task.type !== 'core'
    )
  )

  const coreCompleted = sortTasks(
    completedTasks.filter(
      (task) => task.type === 'core'
    )
  )

  const routineCompleted = sortTasks(
    completedTasks.filter(
      (task) => task.type !== 'core'
    )
  )

  const renderTask = (task) => (
    <TaskListItem
      key={task.id}
      task={task}
      subject={subjectById(task.subjectId)}
      toggleComplete={toggleComplete}
      toggleSubtask={toggleSubtask}
      openModal={openModal}
    />
  )

  const renderSection = ({
    type,
    title,
    copy,
    tasks,
    emptyTitle,
    emptyCopy
  }) => (
    <section className="tasks-section">
      <div className="tasks-section-header">
        <div>
          <div className="tasks-section-title-row">
            <h3>{title}</h3>

            <span className="tasks-section-count">
              {tasks.length}
            </span>
          </div>

          <p>{copy}</p>
        </div>
      </div>

      {tasks.length > 0 ? (
        <div className="tasks-section-list">
          {tasks.map(renderTask)}
        </div>
      ) : (
        <div className="tasks-section-empty">
          <div className="tasks-section-empty-icon">
            {type === 'core' ? '◆' : '○'}
          </div>

          <strong>{emptyTitle}</strong>

          <span>{emptyCopy}</span>

          <button
            type="button"
            className="tasks-section-add"
            onClick={() => openModal('task')}
          >
            Add {title.toLowerCase()} task
          </button>
        </div>
      )}
    </section>
  )

  return (
    <>
      <SectionHeading
        eyebrow="Stay on top of the work"
        title="Tasks"
        copy="Separate real study progress from the work that keeps school moving."
        action="Add task"
        onAction={() => openModal('task')}
      />

      <div className="filter-bar">
        <select
          className="select"
          aria-label="Filter by completion"
          value={filter}
          onChange={(event) =>
            setFilter(event.target.value)
          }
        >
          <option value="all">All tasks</option>
          <option value="open">To do</option>
          <option value="done">Completed</option>
        </select>

        <select
          className="select"
          aria-label="Filter by subject"
          value={subjectFilter}
          onChange={(event) =>
            setSubjectFilter(event.target.value)
          }
        >
          <option value="all">All subjects</option>

          {data.subjects.map((subject) => (
            <option value={subject.id} key={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>

        <span
          className="muted"
          style={{
            marginLeft: 'auto',
            fontSize: 10
          }}
        >
          {visible.length}{' '}
          {visible.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {filter === 'all' || filter === 'open' ? (
        <div className="tasks-columns">
          {renderSection({
            type: 'core',
            title: 'Core',
            copy: 'Actual study progress.',
            tasks: coreOpen,
            emptyTitle: 'No core tasks',
            emptyCopy:
              'Add the next lesson, review, or study goal.'
          })}

          {renderSection({
            type: 'routine',
            title: 'Routine',
            copy: 'School work that keeps things moving.',
            tasks: routineOpen,
            emptyTitle: 'No routine tasks',
            emptyCopy:
              'Add homework, copying, exercises, or vocabulary.'
          })}
        </div>
      ) : (
        <div className="tasks-columns">
          {renderSection({
            type: 'core',
            title: 'Core',
            copy: 'Completed study progress.',
            tasks: coreCompleted,
            emptyTitle: 'No completed core tasks',
            emptyCopy:
              'Completed core tasks will appear here.'
          })}

          {renderSection({
            type: 'routine',
            title: 'Routine',
            copy: 'Completed school work.',
            tasks: routineCompleted,
            emptyTitle: 'No completed routine tasks',
            emptyCopy:
              'Completed routine tasks will appear here.'
          })}
        </div>
      )}

      {filter === 'all' && completedTasks.length > 0 && (
        <div className="completed-tasks-panel">
          <button
            type="button"
            className="completed-toggle"
            onClick={() =>
              setShowCompleted(
                (value) => !value
              )
            }
          >
            <span>
              Completed · {completedTasks.length}
            </span>

            <ChevronDown
              size={14}
              className={
                showCompleted
                  ? 'completed-chevron open'
                  : 'completed-chevron'
              }
            />
          </button>

          {showCompleted && (
            <div className="completed-columns">
              {renderSection({
                type: 'core',
                title: 'Core',
                copy: 'Completed study progress.',
                tasks: coreCompleted,
                emptyTitle: 'No completed core tasks',
                emptyCopy:
                  'Completed core tasks will appear here.'
              })}

              {renderSection({
                type: 'routine',
                title: 'Routine',
                copy: 'Completed school work.',
                tasks: routineCompleted,
                emptyTitle:
                  'No completed routine tasks',
                emptyCopy:
                  'Completed routine tasks will appear here.'
              })}
            </div>
          )}
        </div>
      )}

      {visible.length === 0 && (
        <div className="card tasks-empty-state">
          <EmptyState
            icon={CheckSquare2}
            title="No tasks in this view"
            copy={
              filter === 'done'
                ? 'Completed tasks will appear here.'
                : 'A small, clear task is a good place to start.'
            }
            action="Add task"
            onAction={() => openModal('task')}
          />
        </div>
      )}
    </>
  )
}

function TaskListItem({
  task,
  subject,
  toggleComplete,
  toggleSubtask,
  openModal
}) {
  const [showSubtasks, setShowSubtasks] = useState(false)

  const currentDate = today()

  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : []

  const completedSubtasks = subtasks.filter(
    (subtask) => subtask.completed
  ).length

  const hasSubtasks = subtasks.length > 0

  const dueLabel = !task.dueDate
    ? 'No due date'
    : task.dueDate < currentDate
      ? `Overdue · ${prettyDate(task.dueDate, {
          month: 'short',
          day: 'numeric'
        })}`
      : task.dueDate === currentDate
        ? 'Due today'
        : prettyDate(task.dueDate, {
            month: 'short',
            day: 'numeric'
          })

  const isOverdue =
    !task.completed &&
    task.dueDate &&
    task.dueDate < currentDate

  return (
    <div
      className={`task-card-wrapper${
        task.completed ? ' task-completed' : ''
      }`}
    >
      <div className="task-card-row">
        <button
          type="button"
          className={`check-button${
            task.completed ? ' checked' : ''
          }`}
          aria-label={
            task.completed
              ? 'Mark task incomplete'
              : 'Complete task'
          }
          onClick={() => toggleComplete(task.id)}
        >
          {task.completed && <Check size={12} />}
        </button>

        <div className="task-card-main">
          <div
            className={`task-title${
              task.completed ? ' done' : ''
            }`}
          >
            <span className="task-title-label">
              {task.title}
            </span>

            <span
              className="task-title-strike"
              aria-hidden="true"
            />
          </div>

          <div className="task-card-meta">
            <span
              className="subject-pill"
              style={{
                '--subject-color': subject?.color
              }}
            >
              <i className="subject-dot" />
              {subject?.name || 'No subject'}
            </span>

            <span
              className={`priority ${task.priority}`}
            >
              <i className="priority-dot" />
              {task.priority}
            </span>

            <span
              className={`task-due-date${
                isOverdue ? ' is-overdue' : ''
              }`}
            >
              {dueLabel}
            </span>

            {hasSubtasks && (
              <button
                type="button"
                className="subtask-progress"
                onClick={() =>
                  setShowSubtasks(
                    (value) => !value
                  )
                }
                aria-expanded={showSubtasks}
              >
                <span>
                  {completedSubtasks}/{subtasks.length}
                </span>

                <ChevronRight
                  size={11}
                  className={
                    showSubtasks
                      ? 'subtask-chevron open'
                      : 'subtask-chevron'
                  }
                />
              </button>
            )}
          </div>
        </div>

        <div className="row-actions">
          <IconButton
            label="Edit task"
            onClick={() =>
              openModal('task', task)
            }
          >
            <Pencil size={14} />
          </IconButton>

          <IconButton
            label="Delete task"
            onClick={() =>
              openModal('delete', task, {
                entity: 'task'
              })
            }
          >
            <Trash2 size={14} />
          </IconButton>
        </div>
      </div>

      {hasSubtasks && showSubtasks && (
        <div className="subtasks-list">
          {subtasks.map((subtask) => (
            <div
              className={`subtask-row${
                subtask.completed
                  ? ' subtask-completed'
                  : ''
              }`}
              key={subtask.id}
            >
              <button
                type="button"
                className={`subtask-check${
                  subtask.completed
                    ? ' checked'
                    : ''
                }`}
                aria-label={
                  subtask.completed
                    ? 'Mark subtask incomplete'
                    : 'Complete subtask'
                }
                onClick={() =>
                  toggleSubtask?.(
                    task.id,
                    subtask.id
                  )
                }
              >
                {subtask.completed && (
                  <Check size={10} />
                )}
              </button>

              <span className="subtask-title">
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}