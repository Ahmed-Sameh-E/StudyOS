export const STORAGE_KEY = 'studyos.workspace.v1'
export const VERSION = 1
export const SUBJECT_COLORS = [
  '#6a9c87',
  '#d39c54',
  '#7e91bb',
  '#ca7d70',
  '#8d82b0',
  '#67a8a3'
]

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: 'LayoutDashboard' },
  { id: 'focus', label: 'Focus timer', icon: 'Timer' },
  { id: 'tasks', label: 'Tasks', icon: 'CheckSquare2' },
  { id: 'schedule', label: 'Schedule', icon: 'CalendarDays' },
  { id: 'subjects', label: 'Subjects', icon: 'BookOpen' },
  { id: 'goals', label: 'Goals', icon: 'Target' },
  { id: 'statistics', label: 'Statistics', icon: 'ChartNoAxesCombined' },
  { id: 'notes', label: 'Notes', icon: 'NotebookPen' },
  { id: 'settings', label: 'Settings2', icon: 'Settings2' },
]

// Date correction
// Device: 2027-11-02
// StudyOS: 2026-11-02

export const STUDY_DATE_OFFSET_DAYS = -365
export const DATE_CORRECTION_VERSION = 1

const shiftBackOneCalendarYear = (date) => {
  const corrected = new Date(date)
  corrected.setFullYear(corrected.getFullYear() - 1)
  return corrected
}

export const studyNow = () => shiftBackOneCalendarYear(new Date())

export const studyDate = (value) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return null

  return shiftBackOneCalendarYear(date)
}

const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `id-${Date.now()}-${Math.random().toString(36).slice(2)}`

export const todayKey = (date = studyNow()) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

export const offsetDate = (days, base = studyNow()) => {
  const date = new Date(base)
  date.setDate(date.getDate() + days)

  return todayKey(date)
}

export const safeDate = (value) => {
  if (!value) return null

  const date =
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T12:00:00`)
      : new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export const makeId = uid

const DEFAULT_SUBJECTS = [
  { id: 'sub-arabic', name: 'Arabic', color: '#6a9c87' },
  { id: 'sub-english', name: 'English', color: '#d39c54' },
  { id: 'sub-math', name: 'Math', color: '#7e91bb' },
  { id: 'sub-history', name: 'History', color: '#ca7d70' },
]

const createDefaultSubjects = () =>
  DEFAULT_SUBJECTS.map((subject) => ({ ...subject }))

export function createEmptyData() {
  const subjects = createDefaultSubjects()

  return {
    version: VERSION,
    subjects,
    tasks: [],
    sessions: [],
    events: [],
    goals: [],
    notes: [],

    settings: {
      dailyGoalMinutes: 150,
      theme: 'light',
      studentName: '',
      dateCorrectionVersion: DATE_CORRECTION_VERSION,
    },

    timer: {
      durationSeconds: 1500,
      remainingSeconds: 1500,
      isRunning: false,
      endAt: null,
      startedAt: null,
      subjectId: null,
    },
  }
}

export function createSeedData() {
  const subjects = createDefaultSubjects()

  const subjectId = (name) =>
    subjects.find((subject) => subject.name === name)?.id

  const sessions = []

  for (let day = -13; day <= 0; day += 1) {
    const count =
      day === 0 || [1, 2, 3, 6, 9, 12].includes(Math.abs(day))
        ? 1
        : 2

    for (let index = 0; index < count; index += 1) {
      const minutes =
        [28, 42, 35, 52, 24, 46, 31][
          (Math.abs(day) + index * 2) % 7
        ]

      const start = studyNow()
      let end

      if (day === 0) {
        end = shiftBackOneCalendarYear(
          new Date(Date.now() - 5 * 60000)
        )

        start.setTime(end.getTime() - minutes * 60000)
      } else {
        start.setDate(start.getDate() + day)

        start.setHours(
          15 + index * 2,
          15 + ((Math.abs(day) * 7 + index * 11) % 40),
          0,
          0
        )

        end = new Date(start.getTime() + minutes * 60000)
      }

      sessions.push({
        id: `seed-session-${day}-${index}`,
        subjectId:
          subjects[(Math.abs(day) + index) % subjects.length].id,
        durationMinutes: minutes,
        startedAt: start.toISOString(),
        completedAt: end.toISOString(),
      })
    }
  }

  const today = todayKey()

  return {
    version: VERSION,
    subjects,

    tasks: [
      {
        id: 'task-1',
        title: 'Finish algebra problem set',
        type: 'routine',
        subjectId: subjectId('Math'),
        priority: 'high',
        dueDate: today,
        completed: false,
        createdAt: studyNow().toISOString(),
        completedAt: null,
        subtasks: [],
      },
      {
        id: 'task-2',
        title: 'Review vocabulary chapter 4',
        type: 'core',
        subjectId: subjectId('Arabic'),
        priority: 'medium',
        dueDate: offsetDate(1),
        completed: false,
        createdAt: studyNow().toISOString(),
        completedAt: null,
        subtasks: [
          {
            id: 'subtask-seed-1',
            title: 'Review vocabulary',
            completed: false,
          },
          {
            id: 'subtask-seed-2',
            title: 'Practice meanings and opposites',
            completed: false,
          },
        ],
      },
      {
        id: 'task-3',
        title: 'Outline the persuasive essay',
        type: 'core',
        subjectId: subjectId('English'),
        priority: 'medium',
        dueDate: offsetDate(2),
        completed: false,
        createdAt: studyNow().toISOString(),
        completedAt: null,
        subtasks: [],
      },
      {
        id: 'task-4',
        title: 'Read pages 42–58',
        type: 'core',
        subjectId: subjectId('History'),
        priority: 'low',
        dueDate: today,
        completed: true,
        createdAt: studyNow().toISOString(),
        completedAt: studyNow().toISOString(),
        subtasks: [],
      },
    ],

    sessions,

    events: [
      {
        id: 'event-1',
        title: 'School day',
        type: 'school',
        subjectId: null,
        date: today,
        startTime: '08:00',
        endTime: '14:30',
        notes: '',
      },
      {
        id: 'event-2',
        title: 'Algebra review',
        type: 'lesson',
        subjectId: subjectId('Math'),
        date: today,
        startTime: '16:00',
        endTime: '16:45',
        notes: 'Bring the practice sheet',
      },
      {
        id: 'event-3',
        title: 'English essay due',
        type: 'exam',
        subjectId: subjectId('English'),
        date: offsetDate(2),
        startTime: '10:00',
        endTime: '10:45',
        notes: 'Final draft',
      },
      {
        id: 'event-4',
        title: 'Quiet study block',
        type: 'study',
        subjectId: subjectId('History'),
        date: offsetDate(1),
        startTime: '17:00',
        endTime: '18:00',
        notes: '',
      },
      {
        id: 'event-5',
        title: 'Math tutoring',
        type: 'lesson',
        subjectId: subjectId('Math'),
        date: offsetDate(4),
        startTime: '15:30',
        endTime: '16:30',
        notes: '',
      },
    ],

    goals: [
      {
        id: 'goal-daily',
        title: 'A steady study day',
        period: 'daily',
        targetMinutes: 150,
        subjectId: null,
        active: true,
      },
      {
        id: 'goal-monthly',
        title: 'Build a monthly rhythm',
        period: 'monthly',
        targetMinutes: 6000,
        subjectId: null,
        active: true,
      },
    ],

    notes: [
      {
        id: 'note-1',
        title: 'Essay idea: a city that listens',
        content:
          'Opening thought: start with the sound of the old market at dawn.\n\nConnect the scene to how communities preserve shared memory.',
        subjectId: subjectId('English'),
        createdAt: studyNow().toISOString(),
        updatedAt: studyNow().toISOString(),
      },
      {
        id: 'note-2',
        title: 'Quadratic formula',
        content:
          'For ax² + bx + c = 0:\n\nx = (−b ± √(b² − 4ac)) / 2a\n\nCheck the discriminant before solving.',
        subjectId: subjectId('Math'),
        createdAt: studyNow().toISOString(),
        updatedAt: studyNow().toISOString(),
      },
    ],

    settings: {
      dailyGoalMinutes: 150,
      theme: 'light',
      studentName: 'Alex',
      dateCorrectionVersion: DATE_CORRECTION_VERSION,
    },

    timer: {
      durationSeconds: 1500,
      remainingSeconds: 1500,
      isRunning: false,
      endAt: null,
      startedAt: null,
      subjectId: subjectId('Math'),
    },
  }
}

const isObj = (value) =>
  value && typeof value === 'object' && !Array.isArray(value)

const isString = (value) => typeof value === 'string'

const validDateString = (value) =>
  !value || !!safeDate(value)

const validateSubtasks = (subtasks) => {
  if (!Array.isArray(subtasks)) {
    throw new Error('A task subtasks list is invalid.')
  }

  for (const subtask of subtasks) {
    if (
      !isObj(subtask) ||
      !isString(subtask.id) ||
      !subtask.id.trim() ||
      !isString(subtask.title) ||
      !subtask.title.trim() ||
      typeof subtask.completed !== 'boolean'
    ) {
      throw new Error('A subtask in the backup is invalid.')
    }
  }
}

export function validateData(data) {
  if (!isObj(data) || data.version !== VERSION) {
    throw new Error('This file is not a supported StudyOS backup.')
  }

  const arrays = [
    'tasks',
    'subjects',
    'sessions',
    'events',
    'goals',
    'notes',
  ]

  if (arrays.some((key) => !Array.isArray(data[key]))) {
    throw new Error('The backup is missing a required data list.')
  }

  if (!isObj(data.settings) || !isObj(data.timer)) {
    throw new Error('The backup is missing settings or timer data.')
  }

  const ids = new Set()

  const rememberId = (record) => {
    if (
      !isObj(record) ||
      !isString(record.id) ||
      !record.id.trim()
    ) {
      throw new Error('Every saved item needs a valid ID.')
    }

    if (ids.has(record.id)) {
      throw new Error('Backup IDs must be unique.')
    }

    ids.add(record.id)
  }

  const validSubjectRef = (id) =>
    id == null ||
    (isString(id) &&
      data.subjects.some((subject) => subject.id === id))

  const validTime = (value) =>
    isString(value) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

  const validDay = (value) =>
    isString(value) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    todayKey(safeDate(value)) === value

  for (const subject of data.subjects) {
    rememberId(subject)

    if (
      !isString(subject.name) ||
      !subject.name.trim() ||
      !isString(subject.color)
    ) {
      throw new Error('A subject in the backup is invalid.')
    }
  }

  for (const task of data.tasks) {
    rememberId(task)

    if (
      !isString(task.title) ||
      !task.title.trim() ||
      !['core', 'routine'].includes(task.type) ||
      !['low', 'medium', 'high'].includes(task.priority) ||
      typeof task.completed !== 'boolean' ||
      (task.dueDate && !validDay(task.dueDate)) ||
      !safeDate(task.createdAt) ||
      (task.completedAt != null &&
        !safeDate(task.completedAt)) ||
      (task.completed && !safeDate(task.completedAt)) ||
      !validSubjectRef(task.subjectId)
    ) {
      throw new Error('A task in the backup is invalid.')
    }

    validateSubtasks(task.subtasks)

    for (const subtask of task.subtasks) {
      rememberId(subtask)
    }
  }

  for (const session of data.sessions) {
    rememberId(session)

    if (
      !Number.isFinite(session.durationMinutes) ||
      session.durationMinutes <= 0 ||
      !safeDate(session.startedAt) ||
      !safeDate(session.completedAt) ||
      !validSubjectRef(session.subjectId)
    ) {
      throw new Error('A study session in the backup is invalid.')
    }
  }

  for (const event of data.events) {
    rememberId(event)

    if (
      !isString(event.title) ||
      !event.title.trim() ||
      !['school', 'lesson', 'study', 'exam'].includes(event.type) ||
      !validDay(event.date) ||
      !validTime(event.startTime) ||
      !validTime(event.endTime) ||
      event.endTime <= event.startTime ||
      !validSubjectRef(event.subjectId) ||
      (event.notes != null && !isString(event.notes))
    ) {
      throw new Error('A schedule event in the backup is invalid.')
    }
  }

  for (const goal of data.goals) {
    rememberId(goal)

    if (
      !isString(goal.title) ||
      !goal.title.trim() ||
      !['daily', 'monthly'].includes(goal.period) ||
      !Number.isFinite(goal.targetMinutes) ||
      goal.targetMinutes < 1 ||
      typeof goal.active !== 'boolean' ||
      !validSubjectRef(goal.subjectId)
    ) {
      throw new Error('A goal in the backup is invalid.')
    }
  }

  for (const note of data.notes) {
    rememberId(note)

    if (
      !isString(note.title) ||
      !isString(note.content) ||
      !safeDate(note.createdAt) ||
      !safeDate(note.updatedAt) ||
      !validSubjectRef(note.subjectId)
    ) {
      throw new Error('A note in the backup is invalid.')
    }
  }

  if (
    !Number.isFinite(data.settings.dailyGoalMinutes) ||
    data.settings.dailyGoalMinutes < 15 ||
    data.settings.dailyGoalMinutes > 720 ||
    !['light', 'dark'].includes(data.settings.theme) ||
    !isString(data.settings.studentName)
  ) {
    throw new Error(
      'Settings or timer values in the backup are invalid.'
    )
  }

  if (
    !Number.isFinite(data.timer.durationSeconds) ||
    data.timer.durationSeconds < 60 ||
    !Number.isFinite(data.timer.remainingSeconds) ||
    data.timer.remainingSeconds < 0 ||
    data.timer.remainingSeconds > data.timer.durationSeconds ||
    typeof data.timer.isRunning !== 'boolean' ||
    !validDateString(data.timer.endAt) ||
    !validDateString(data.timer.startedAt) ||
    (data.timer.isRunning &&
      (!safeDate(data.timer.endAt) ||
        !safeDate(data.timer.startedAt))) ||
    !validSubjectRef(data.timer.subjectId)
  ) {
    throw new Error(
      'Settings or timer values in the backup are invalid.'
    )
  }

  return data
}

function migrateStoredCalendar(data) {
  const needsDateMigration =
    data.settings.dateCorrectionVersion !==
    DATE_CORRECTION_VERSION

  const needsTaskTypeMigration = data.tasks.some(
    (task) => !['core', 'routine'].includes(task.type)
  )

  const needsSubtasksMigration = data.tasks.some(
    (task) => !Array.isArray(task.subtasks)
  )

  if (
    !needsDateMigration &&
    !needsTaskTypeMigration &&
    !needsSubtasksMigration
  ) {
    return data
  }

  const shiftDay = (value) => {
    if (!value) return value

    const date = safeDate(value)

    if (!date) return value

    date.setDate(
      date.getDate() + STUDY_DATE_OFFSET_DAYS
    )

    return todayKey(date)
  }

  const shiftTimestamp = (value) => {
    if (!value) return value

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return value

    return shiftBackOneCalendarYear(date).toISOString()
  }

  return {
    ...data,

    tasks: data.tasks.map((task) => ({
      ...task,

      type:
        task.type === 'core' || task.type === 'routine'
          ? task.type
          : 'routine',

      subtasks: Array.isArray(task.subtasks)
        ? task.subtasks.map((subtask) => ({
            id: isString(subtask?.id) && subtask.id.trim()
              ? subtask.id
              : makeId(),
            title:
              isString(subtask?.title) && subtask.title.trim()
                ? subtask.title.trim()
                : 'Untitled subtask',
            completed:
              typeof subtask?.completed === 'boolean'
                ? subtask.completed
                : false,
          }))
        : [],

      dueDate: needsDateMigration
        ? shiftDay(task.dueDate)
        : task.dueDate,

      createdAt: needsDateMigration
        ? shiftTimestamp(task.createdAt)
        : task.createdAt,

      completedAt: needsDateMigration
        ? shiftTimestamp(task.completedAt)
        : task.completedAt,
    })),

    sessions: needsDateMigration
      ? data.sessions.map((session) => ({
          ...session,
          startedAt: shiftTimestamp(session.startedAt),
          completedAt: shiftTimestamp(session.completedAt),
        }))
      : data.sessions,

    events: needsDateMigration
      ? data.events.map((event) => ({
          ...event,
          date: shiftDay(event.date),
        }))
      : data.events,

    notes: needsDateMigration
      ? data.notes.map((note) => ({
          ...note,
          createdAt: shiftTimestamp(note.createdAt),
          updatedAt: shiftTimestamp(note.updatedAt),
        }))
      : data.notes,

    settings: {
      ...data.settings,
      dateCorrectionVersion: DATE_CORRECTION_VERSION,
    },
  }
}

export function safeReadStorage() {
  let raw

  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return {
      data: createSeedData(),
      warning:
        'Browser storage is unavailable. StudyOS is in temporary mode for this visit.',
    }
  }

  if (!raw) {
    const seed = createSeedData()
    const saved = safeWriteStorage(seed)

    return {
      data: seed,
      warning: saved
        ? null
        : 'Browser storage is unavailable. Your changes may not be kept after this visit.',
    }
  }

  let parsed

  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      data: createSeedData(),
      warning:
        'Saved data is not valid JSON, so a fresh study space is ready. You can import a valid backup in Settings.',
    }
  }

  try {
    const migrated = migrateStoredCalendar(parsed)

    validateData(migrated)

    if (migrated !== parsed) {
      safeWriteStorage(migrated)
    }

    return {
      data: migrated,
      warning: null,
    }
  } catch {
    return {
      data: createSeedData(),
      warning:
        'Saved data could not be read, so a fresh study space is ready. You can import a valid backup in Settings.',
    }
  }
}

export function safeWriteStorage(data) {
  try {
    validateData(data)

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    )

    return true
  } catch {
    return false
  }
}