import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { createSeedData, STORAGE_KEY } from '../data/studyData'

const readWorkspace = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY))

const openSettings = () => {
  fireEvent.click(screen.getByRole('button', { name: 'Open settings' }))
}

const uploadBackup = (contents) => {
  const text = typeof contents === 'string' ? contents : JSON.stringify(contents)
  const file = new File([text], 'studyos-backup.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: async () => text })
  fireEvent.change(document.querySelector('input[type="file"]'), { target: { files: [file] } })
}

describe('workspace persistence', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('seeds a first-time workspace with demo records', async () => {
    render(<App />)

    await waitFor(() => expect(readWorkspace()).not.toBeNull())
    const saved = readWorkspace()

    expect(saved.tasks.length).toBeGreaterThan(0)
    expect(saved.sessions.length).toBeGreaterThan(0)
    expect(saved.events.length).toBeGreaterThan(0)
    expect(saved.goals.length).toBeGreaterThan(0)
    expect(saved.notes.length).toBeGreaterThan(0)
    expect(saved.tasks.some((task) => task.title === 'Finish algebra problem set')).toBe(true)
  })

  it('keeps a confirmed reset empty after the app is refreshed', async () => {
    const { unmount } = render(<App />)
    await waitFor(() => expect(readWorkspace()).not.toBeNull())
    expect(readWorkspace().tasks.length).toBeGreaterThan(0)

    openSettings()
    fireEvent.click(screen.getByRole('button', { name: 'Reset all data' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Clear all StudyOS records'))
    await waitFor(() => expect(readWorkspace().tasks).toEqual([]))
    const resetWorkspace = readWorkspace()
    expect(resetWorkspace).toMatchObject({
      subjects: expect.arrayContaining([
        expect.objectContaining({ id: 'sub-arabic' }),
        expect.objectContaining({ id: 'sub-english' }),
        expect.objectContaining({ id: 'sub-math' }),
        expect.objectContaining({ id: 'sub-history' }),
      ]),
      sessions: [],
      events: [],
      goals: [],
      notes: [],
      settings: { dailyGoalMinutes: 150, theme: 'light', studentName: '' },
    })

    unmount()
    render(<App />)
    await waitFor(() => expect(readWorkspace()).toEqual(resetWorkspace))
    expect(readWorkspace().tasks).toEqual([])
    expect(readWorkspace().sessions).toEqual([])
  })

  it('restores data from a valid backup', async () => {
    render(<App />)
    await waitFor(() => expect(readWorkspace()).not.toBeNull())
    const backup = createSeedData()
    backup.tasks = [{ ...backup.tasks[0], id: 'backup-task', title: 'Imported algebra task' }]
    backup.settings.studentName = 'Backup Student'

    openSettings()
    uploadBackup(backup)

    await screen.findByText('Backup imported successfully.')
    await waitFor(() => {
      expect(readWorkspace().tasks).toEqual(backup.tasks)
      expect(readWorkspace().settings.studentName).toBe('Backup Student')
    })
  })

  it('leaves current data untouched when a backup is malformed', async () => {
    render(<App />)
    await waitFor(() => expect(readWorkspace()).not.toBeNull())
    const beforeImport = window.localStorage.getItem(STORAGE_KEY)
    const invalidBackup = createSeedData()
    invalidBackup.tasks[0].title = ''

    openSettings()
    uploadBackup(invalidBackup)

    await screen.findByText('A task in the backup is invalid.')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(beforeImport)

    uploadBackup('{invalid json')
    await screen.findByText('This file is not valid JSON.')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe(beforeImport)
  })
})
