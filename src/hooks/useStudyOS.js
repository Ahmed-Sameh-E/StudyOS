import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  createEmptyData,
  makeId,
  safeReadStorage,
  safeWriteStorage,
  todayKey,
  studyNow,
  validateData,
} from '../data/studyData'
import { getNextTask } from '../utils/taskScoring'

export function useStudyOS() {
  const initial = useMemo(() => safeReadStorage(), [])

  const [data, setData] = useState(initial.data)
  const [storageWarning, setStorageWarning] = useState(initial.warning)
  const [minuteNow, setMinuteNow] = useState(Date.now())

  const latest = useRef(data)
  latest.current = data

  // Save data
  useEffect(() => {
    if (!safeWriteStorage(data)) {
      setStorageWarning(
        (current) =>
          current ||
          'Changes could not be saved to browser storage. Export a backup before leaving this page.'
      )
    }
  }, [data])

  // Update timer every second
  useEffect(() => {
    if (!data.timer.isRunning) return undefined

    const timer = window.setInterval(() => {
      setMinuteNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [data.timer.isRunning])

  // Complete timer
  useEffect(() => {
    if (!data.timer.isRunning || !data.timer.endAt) return

    const left = Math.max(
      0,
      Math.ceil(
        (new Date(data.timer.endAt).getTime() - minuteNow) / 1000
      )
    )

    if (left <= 0) {
      setData((current) => {
        if (
          !current.timer.isRunning ||
          !current.timer.endAt ||
          new Date(current.timer.endAt).getTime() > Date.now()
        ) {
          return current
        }

        const completedAt = studyNow().toISOString()

        const durationMinutes = Math.max(
          1,
          Math.round(current.timer.durationSeconds / 60)
        )

        const startedAt =
          current.timer.startedAt ||
          new Date(
            studyNow().getTime() - current.timer.durationSeconds * 1000
          ).toISOString()

        return {
          ...current,

          sessions: [
            ...current.sessions,
            {
              id: makeId(),
              subjectId: current.timer.subjectId || null,
              durationMinutes,
              startedAt,
              completedAt,
            },
          ],

          timer: {
            ...current.timer,
            isRunning: false,
            remainingSeconds: current.timer.durationSeconds,
            endAt: null,
            startedAt: null,
          },
        }
      })
    }
  }, [minuteNow])

  // General updates
  const update = useCallback((updater) => {
    setData((current) =>
      typeof updater === 'function'
        ? updater(current)
        : { ...current, ...updater }
    )
  }, [])

  const commit = useCallback(
    (key, records) => {
      update((current) => ({
        ...current,
        [key]: records,
      }))
    },
    [update]
  )

  const add = useCallback(
    (key, item) => {
      commit(key, [
        ...latest.current[key],
        { ...item, id: item.id || makeId() },
      ])
    },
    [commit]
  )

  const edit = useCallback(
    (key, id, changes) => {
      commit(
        key,
        latest.current[key].map((item) =>
          item.id === id ? { ...item, ...changes } : item
        )
      )
    },
    [commit]
  )

  const remove = useCallback(
    (key, id) => {
      commit(
        key,
        latest.current[key].filter((item) => item.id !== id)
      )
    },
    [commit]
  )

  // Tasks
  const toggleTask = useCallback(
    (id) =>
      update((current) => ({
        ...current,

        tasks: current.tasks.map((task) =>
          task.id === id
            ? {
                ...task,
                completed: !task.completed,
                completedAt: task.completed
                  ? null
                  : studyNow().toISOString(),
              }
            : task
        ),
      })),
    [update]
  )

  // Subtasks
  const toggleSubtask = useCallback(
    (taskId, subtaskId) =>
      update((current) => ({
        ...current,

        tasks: current.tasks.map((task) => {
          if (task.id !== taskId) {
            return task
          }

          const subtasks = Array.isArray(task.subtasks)
            ? task.subtasks
            : []

          return {
            ...task,

            subtasks: subtasks.map((subtask) =>
              subtask.id === subtaskId
                ? {
                    ...subtask,
                    completed: !subtask.completed,
                  }
                : subtask
            ),
          }
        }),
      })),
    [update]
  )

  // Settings
  const setSetting = useCallback(
    (key, value) =>
      update((current) => ({
        ...current,
        settings: {
          ...current.settings,
          [key]: value,
        },
      })),
    [update]
  )

  // Timer settings
  const setTimer = useCallback(
    (timer) =>
      update((current) => ({
        ...current,
        timer: {
          ...current.timer,
          ...timer,
        },
      })),
    [update]
  )

  // Start timer
  const startTimer = useCallback(() => {
    const timer = latest.current.timer

    const remaining =
      timer.remainingSeconds || timer.durationSeconds

    const startedAt = Date.now()

    setMinuteNow(startedAt)

    update((current) => ({
      ...current,

      timer: {
        ...current.timer,
        remainingSeconds: remaining,
        isRunning: true,

        // Corrected study date
        startedAt:
          current.timer.startedAt || studyNow().toISOString(),

        // Real device time for accurate countdown
        endAt: new Date(
          startedAt + remaining * 1000
        ).toISOString(),
      },
    }))
  }, [update])

  // Pause timer
  const pauseTimer = useCallback(() => {
    const timer = latest.current.timer

    const remaining = timer.endAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(timer.endAt).getTime() - Date.now()) / 1000
          )
        )
      : timer.remainingSeconds

    setTimer({
      isRunning: false,
      remainingSeconds: remaining,
      endAt: null,
    })
  }, [setTimer])

  // Reset timer
  const resetTimer = useCallback(
    (durationSeconds = latest.current.timer.durationSeconds) => {
      setTimer({
        durationSeconds,
        remainingSeconds: durationSeconds,
        isRunning: false,
        endAt: null,
        startedAt: null,
      })
    },
    [setTimer]
  )

  // Import backup
  const importData = useCallback(
    (next) => {
      const valid = JSON.parse(JSON.stringify(next))

      validateData(valid)

      update(valid)

      setStorageWarning(null)
    },
    [update]
  )

  // Reset workspace
  const reset = useCallback(() => {
    update(createEmptyData())
    setStorageWarning(null)
  }, [update])

  // Smart study plan
  const nextTask = useMemo(
    () => getNextTask(data.tasks),
    [data.tasks]
  )

  // Statistics
  const stats = useMemo(() => {
    const now = studyNow()

    const today = todayKey(now)

    // Week starts on Monday
    const weekStart = new Date(now)

    const dayOfWeek = (now.getDay() + 6) % 7

    weekStart.setDate(now.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)

    weekEnd.setDate(weekEnd.getDate() + 7)

    // Current month
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )

    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    )

    const sessions = data.sessions.filter((session) =>
      Number.isFinite(new Date(session.completedAt).getTime())
    )

    // Minutes for a specific day
    const dayMinutes = (dateKey) =>
      sessions
        .filter(
          (session) =>
            todayKey(new Date(session.completedAt)) === dateKey
        )
        .reduce(
          (sum, session) => sum + session.durationMinutes,
          0
        )

    const daily = dayMinutes(today)

    // Weekly minutes
    const weekly = sessions
      .filter((session) => {
        const date = new Date(session.completedAt)

        return date >= weekStart && date < weekEnd
      })
      .reduce(
        (sum, session) => sum + session.durationMinutes,
        0
      )

    // Monthly minutes
    const monthly = sessions
      .filter((session) => {
        const date = new Date(session.completedAt)

        return date >= monthStart && date < monthEnd
      })
      .reduce(
        (sum, session) => sum + session.durationMinutes,
        0
      )

    // Current streak
    let streak = 0

    const cursor = new Date(now)

    const studiedToday = sessions.some(
      (session) =>
        todayKey(new Date(session.completedAt)) === today
    )

    if (!studiedToday) {
      cursor.setDate(cursor.getDate() - 1)
    }

    while (
      sessions.some(
        (session) =>
          todayKey(new Date(session.completedAt)) ===
          todayKey(cursor)
      )
    ) {
      streak += 1

      cursor.setDate(cursor.getDate() - 1)
    }

    // Longest streak
    let longest = 0

    const activeDays = [
      ...new Set(
        sessions.map((session) =>
          todayKey(new Date(session.completedAt))
        )
      ),
    ].sort()

    let chain = 0
    let prior = null

    activeDays.forEach((day) => {
      const date = new Date(`${day}T12:00:00`)

      if (prior) {
        const delta = Math.round(
          (date - prior) / 86400000
        )

        chain = delta === 1 ? chain + 1 : 1
      } else {
        chain = 1
      }

      longest = Math.max(longest, chain)

      prior = date
    })

    return {
      daily,
      weekly,
      monthly,
      streak,
      longest,
      dayMinutes,
    }
  }, [data.sessions])

  // Timer display
  const timerRemainingSeconds =
    data.timer.isRunning && data.timer.endAt
      ? Math.max(
          0,
          Math.ceil(
            (new Date(data.timer.endAt).getTime() - minuteNow) /
              1000
          )
        )
      : data.timer.remainingSeconds

  return {
    data,
    update,
    add,
    edit,
    remove,
    toggleTask,
    toggleSubtask,
    setSetting,
    setTimer,
    startTimer,
    pauseTimer,
    resetTimer,
    importData,
    reset,
    stats,
    nextTask,
    timerRemainingSeconds,
    storageWarning,
    clearStorageWarning: () => setStorageWarning(null),
  }
}