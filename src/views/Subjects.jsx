import { ArrowRight, BookOpen } from "lucide-react";
import { EmptyState, SectionHeading } from "../components/ui";
import { formatMinutes } from "../utils/formatters";
import { studyNow } from "../data/studyData";

export default function SubjectsView({ data, openModal }) {
  const recent = studyNow();
  recent.setDate(recent.getDate() - 30);

  const totalSessions = data.sessions.filter(
    (session) => new Date(session.completedAt) >= recent,
  );

  return (
    <>
      <SectionHeading
        eyebrow="One place for every class"
        title="Subjects"
        copy="See where your study time is going and what still needs attention."
      />

      <div
        className="grid subject-list subject-card-grid"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}
      >
        {data.subjects.map((subject) => {
          const sessions = totalSessions.filter(
            (session) => session.subjectId === subject.id,
          );

          const minutes = sessions.reduce(
            (sum, session) => sum + session.durationMinutes,
            0,
          );

          const tasks = data.tasks.filter(
            (task) => task.subjectId === subject.id,
          );

          const openTasks = tasks.filter((task) => !task.completed).length;

          const completion = tasks.length
            ? Math.round(((tasks.length - openTasks) / tasks.length) * 100)
            : 0;

          return (
            <article
              key={subject.id}
              className="card subject-card"
              style={{ "--subject-color": subject.color }}
            >
              <div className="card-head" style={{ marginBottom: 3 }}>
                <div>
                  <div className="subject-name">{subject.name}</div>
                  <div className="card-caption">Your last 30 days</div>
                </div>

                <BookOpen size={16} color={subject.color} />
              </div>

              <div className="subject-stats">
                <div>
                  <strong>{formatMinutes(minutes)}</strong>study time
                </div>

                <div>
                  <strong>{sessions.length}</strong>sessions
                </div>

                <div>
                  <strong>{openTasks}</strong>open tasks
                </div>
              </div>

              <div
                className="progress-line"
                aria-label={`${completion}% of subject tasks completed`}
              >
                <span
                  style={{
                    width: `${completion}%`,
                    background: subject.color,
                  }}
                />
              </div>

              <div className="metric-sub">
                {tasks.length
                  ? `${completion}% of tasks complete`
                  : "No tasks yet"}
              </div>

              <button
                type="button"
                className="text-link"
                style={{ marginTop: 12, padding: 0 }}
                onClick={() =>
                  openModal("task", null, { subjectId: subject.id })
                }
              >
                Add a {subject.name} task <ArrowRight size={13} />
              </button>
            </article>
          );
        })}
      </div>

      {!data.subjects.length && (
        <div className="card">
          <EmptyState
            title="No subjects yet"
            copy="Subjects will appear here when they are available in your study space."
          />
        </div>
      )}

      <section className="card card-pad section-gap">
        <div className="card-head">
          <div>
            <h2 className="card-title">Study by subject</h2>
            <div className="card-caption">
              Sessions recorded in the last 30 days
            </div>
          </div>

          <span className="muted" style={{ fontSize: 10 }}>
            {formatMinutes(
              totalSessions.reduce(
                (sum, session) => sum + session.durationMinutes,
                0,
              ),
            )}{" "}
            total
          </span>
        </div>

        {data.subjects.length ? (
          data.subjects.map((subject) => {
            const amount = totalSessions
              .filter((session) => session.subjectId === subject.id)
              .reduce((sum, session) => sum + session.durationMinutes, 0);

            const total = Math.max(
              1,
              totalSessions.reduce(
                (sum, session) => sum + session.durationMinutes,
                0,
              ),
            );

            return (
              <div
                key={subject.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr 55px",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 0",
                }}
              >
                <span
                  className="subject-pill"
                  style={{ "--subject-color": subject.color }}
                >
                  <i className="subject-dot" />
                  {subject.name}
                </span>

                <div className="progress-line" style={{ margin: 0 }}>
                  <span
                    style={{
                      width: `${(amount / total) * 100}%`,
                      background: subject.color,
                    }}
                  />
                </div>

                <span
                  className="muted"
                  style={{ textAlign: "right", fontSize: 10 }}
                >
                  {formatMinutes(amount)}
                </span>
              </div>
            );
          })
        ) : (
          <EmptyState
            title="Your study breakdown will appear here"
            copy="Complete a focus session to start building your subject history."
          />
        )}
      </section>
    </>
  );
}