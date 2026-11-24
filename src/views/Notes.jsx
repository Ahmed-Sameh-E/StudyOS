import { NotebookPen } from 'lucide-react'
import { EmptyState, SectionHeading } from '../components/ui'
import { prettyDate } from '../utils/formatters'

export default function NotesView({ data, subjectById, openModal, addNote }) {
  return <>
    <SectionHeading eyebrow="Keep useful thoughts close" title="Notes" copy="Quick references, ideas, and reminders for later." action="New note" onAction={addNote} />
    {data.notes.length ? <div className="grid note-grid">{data.notes.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((note) => <article className="card note-card" key={note.id} role="button" tabIndex="0" onClick={() => openModal('note', note)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openModal('note', note) } }}><div className="mini-stat-top"><span className="note-date">{prettyDate(note.updatedAt, { month: 'short', day: 'numeric' })}</span><span className="subject-pill" style={{ '--subject-color': subjectById(note.subjectId)?.color }}><i className="subject-dot" />{subjectById(note.subjectId)?.name || 'General'}</span></div><h3>{note.title || 'Untitled note'}</h3><p>{note.content || 'No content yet.'}</p></article>)}</div> : <section className="card"><EmptyState icon={NotebookPen} title="Your notes start here" copy="Save a formula, question, or thought before it slips away." action="Create a note" onAction={addNote} /></section>}
  </>
}
