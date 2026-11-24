import { useState } from "react";
import {
  Check,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Modal } from "./ui";
import { today } from "../utils/formatters";
import { makeId } from "../data/studyData";

export default function EditorModal({
  modal,
  close,
  data,
  app,
  openModal,
  notify,
}) {
  const { kind, item } = modal;
  const [error, setError] = useState("");

  const [values, setValues] = useState(() => {
    if (kind === "task")
      return {
        title: item?.title || "",
        type: item?.type || "routine",
        subjectId:
          item?.subjectId || modal.subjectId || "",
        priority: item?.priority || "medium",
        dueDate: item?.dueDate || today(),
        subtasks: Array.isArray(item?.subtasks)
          ? item.subtasks.map((subtask) => ({
              id: subtask.id || makeId(),
              title: subtask.title || "",
              completed:
                typeof subtask.completed === "boolean"
                  ? subtask.completed
                  : false,
            }))
          : [],
      };

    if (kind === "event")
      return {
        title: item?.title || "",
        type: item?.type || "study",
        subjectId: item?.subjectId || "",
        date:
          item?.date || modal.date || today(),
        startTime:
          item?.startTime ||
          modal.startTime ||
          "15:00",
        endTime: item?.endTime || "16:00",
        notes: item?.notes || "",
      };

    if (kind === "note")
      return {
        title: item?.title || "",
        content: item?.content || "",
        subjectId: item?.subjectId || "",
      };

    if (kind === "goal")
      return {
        title: item?.title || "",
        period: item?.period || "daily",
        target: item
          ? String(
              item.period === "monthly"
                ? item.targetMinutes / 60
                : item.targetMinutes
            )
          : "150",
        subjectId: item?.subjectId || "",
        active: item?.active ?? true,
      };

    return {};
  });

  const set = (key, value) =>
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

  const entity = modal.entity || kind;

  const entityLabels = {
    task: "task",
    event: "event",
    note: "note",
    goal: "goal",
  };

  const addSubtask = () => {
    setValues((current) => ({
      ...current,
      subtasks: [
        ...current.subtasks,
        {
          id: makeId(),
          title: "",
          completed: false,
        },
      ],
    }));
  };

  const updateSubtask = (id, key, value) => {
    setValues((current) => ({
      ...current,
      subtasks: current.subtasks.map(
        (subtask) =>
          subtask.id === id
            ? {
                ...subtask,
                [key]: value,
              }
            : subtask
      ),
    }));
  };

  const removeSubtask = (id) => {
    setValues((current) => ({
      ...current,
      subtasks: current.subtasks.filter(
        (subtask) => subtask.id !== id
      ),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    setError("");

    const title = values.title?.trim();

    if (kind !== "delete" && !title) {
      setError("Add a title before saving.");
      return;
    }

    if (kind === "task") {
      const cleanedSubtasks =
        values.type === "core"
          ? values.subtasks
              .map((subtask) => ({
                id: subtask.id || makeId(),
                title: subtask.title.trim(),
                completed: !!subtask.completed,
              }))
              .filter((subtask) => subtask.title)
          : values.subtasks;

      const record = {
        title,
        type: values.type || "routine",
        subjectId: values.subjectId || null,
        priority: values.priority,
        dueDate: values.dueDate || "",
        completed: item?.completed || false,
        createdAt:
          item?.createdAt ||
          new Date().toISOString(),
        completedAt: item?.completedAt || null,
        subtasks: cleanedSubtasks,
      };

      if (item)
        app.edit("tasks", item.id, record);
      else app.add("tasks", record);

      notify(
        item
          ? "Task updated."
          : "Task added."
      );

      close();
    } else if (kind === "event") {
      if (
        !values.date ||
        !values.startTime ||
        !values.endTime
      ) {
        setError(
          "Choose a date and both event times."
        );
        return;
      }

      if (values.endTime <= values.startTime) {
        setError(
          "The end time must be later than the start time."
        );
        return;
      }

      const record = {
        title,
        type: values.type,
        subjectId:
          values.subjectId || null,
        date: values.date,
        startTime: values.startTime,
        endTime: values.endTime,
        notes: values.notes.trim(),
      };

      if (item)
        app.edit("events", item.id, record);
      else app.add("events", record);

      notify(
        item
          ? "Schedule event updated."
          : "Schedule event added."
      );

      close();
    } else if (kind === "note") {
      const now = new Date().toISOString();

      const record = {
        title,
        content: values.content,
        subjectId:
          values.subjectId || null,
        createdAt:
          item?.createdAt || now,
        updatedAt: now,
      };

      if (item)
        app.edit("notes", item.id, record);
      else app.add("notes", record);

      notify(
        item
          ? "Note updated."
          : "Note saved."
      );

      close();
    } else if (kind === "goal") {
      const value = Number(values.target);

      if (
        !Number.isFinite(value) ||
        value <= 0 ||
        (values.period === "daily" &&
          (!Number.isInteger(value) ||
            value > 720)) ||
        (values.period === "monthly" &&
          (!Number.isInteger(value) ||
            value > 744))
      ) {
        setError(
          values.period === "daily"
            ? "Daily targets must be whole minutes, from 1 to 720."
            : "Monthly targets must be whole hours, from 1 to 744."
        );

        return;
      }

      const record = {
        title,
        period: values.period,
        targetMinutes:
          values.period === "monthly"
            ? value * 60
            : value,
        subjectId:
          values.subjectId || null,
        active: values.active,
      };

      if (item)
        app.edit("goals", item.id, record);
      else app.add("goals", record);

      notify(
        item
          ? "Goal updated."
          : "Goal created."
      );

      close();
    } else if (kind === "delete") {
      const key = {
        task: "tasks",
        event: "events",
        note: "notes",
        goal: "goals",
      }[entity];

      if (key && item)
        app.remove(key, item.id);

      notify(
        `${entityLabels[entity] || "Item"} deleted.`
      );

      close();
    }
  };

  if (kind === "delete") {
    return (
      <Modal
        title={`Delete this ${
          entityLabels[entity] || "item"
        }?`}
        description="This action cannot be undone."
        onClose={close}
      >
        <p
          className="muted"
          style={{
            fontSize: 11,
            lineHeight: 1.6,
          }}
        >
          “{item?.title || "Untitled"}” will be
          removed from your local StudyOS
          workspace.
        </p>

        <div className="modal-actions">
          <button
            className="button secondary"
            type="button"
            onClick={close}
          >
            Keep it
          </button>

          <button
            className="button danger"
            type="button"
            onClick={submit}
          >
            <Trash2 size={14} />
            Delete{" "}
            {entityLabels[entity] || "item"}
          </button>
        </div>
      </Modal>
    );
  }

  const titleText = {
    task: item
      ? "Edit task"
      : "Add a task",
    event: item
      ? "Edit schedule event"
      : "Add to your schedule",
    note: item
      ? "Edit note"
      : "New note",
    goal: item
      ? "Edit goal"
      : "Create a goal",
  }[kind];

  return (
    <Modal
      title={titleText}
      description={
        {
          task:
            "Give your next step a clear name.",
          event:
            "Make a little room for the work ahead.",
          note:
            "Capture something worth remembering.",
          goal:
            "Choose a target that supports your study rhythm.",
        }[kind]
      }
      onClose={close}
      wide={kind === "note"}
    >
      <form onSubmit={submit}>
        {kind === "task" && (
          <>
            <div className="field">
              <label htmlFor="task-title">
                Task name
              </label>

              <input
                autoFocus
                id="task-title"
                className="input"
                maxLength={120}
                value={values.title}
                onChange={(event) =>
                  set(
                    "title",
                    event.target.value
                  )
                }
                placeholder="What needs to get done?"
              />
            </div>

            <div className="field-inline">
              <div className="field">
                <label htmlFor="task-type">
                  Type
                </label>

                <select
                  id="task-type"
                  className="select"
                  value={values.type}
                  onChange={(event) =>
                    set(
                      "type",
                      event.target.value
                    )
                  }
                >
                  <option value="core">
                    Core
                  </option>

                  <option value="routine">
                    Routine
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="task-priority">
                  Priority
                </label>

                <select
                  id="task-priority"
                  className="select"
                  value={values.priority}
                  onChange={(event) =>
                    set(
                      "priority",
                      event.target.value
                    )
                  }
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>
                </select>
              </div>
            </div>

            <div className="field-inline">
              <div className="field">
                <label htmlFor="task-subject">
                  Subject
                </label>

                <select
                  id="task-subject"
                  className="select"
                  value={values.subjectId}
                  onChange={(event) =>
                    set(
                      "subjectId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    No subject
                  </option>

                  {data.subjects.map(
                    (subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="field">
                <label htmlFor="task-date">
                  Due date
                </label>

                <input
                  id="task-date"
                  className="input"
                  type="date"
                  value={values.dueDate}
                  onChange={(event) =>
                    set(
                      "dueDate",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            {values.type === "core" && (
              <SubtasksEditor
                subtasks={values.subtasks}
                addSubtask={addSubtask}
                updateSubtask={updateSubtask}
                removeSubtask={removeSubtask}
              />
            )}
          </>
        )}

        {kind === "event" && (
          <>
            <div className="field">
              <label htmlFor="event-title">
                Event name
              </label>

              <input
                autoFocus
                id="event-title"
                className="input"
                maxLength={120}
                value={values.title}
                onChange={(event) =>
                  set(
                    "title",
                    event.target.value
                  )
                }
                placeholder="What is happening?"
              />
            </div>

            <div className="field-inline">
              <div className="field">
                <label htmlFor="event-type">
                  Type
                </label>

                <select
                  id="event-type"
                  className="select"
                  value={values.type}
                  onChange={(event) =>
                    set(
                      "type",
                      event.target.value
                    )
                  }
                >
                  <option value="school">
                    School
                  </option>

                  <option value="lesson">
                    Lesson
                  </option>

                  <option value="study">
                    Study
                  </option>

                  <option value="exam">
                    Exam
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="event-subject">
                  Subject
                </label>

                <select
                  id="event-subject"
                  className="select"
                  value={values.subjectId}
                  onChange={(event) =>
                    set(
                      "subjectId",
                      event.target.value
                    )
                  }
                >
                  <option value="">
                    No subject
                  </option>

                  {data.subjects.map(
                    (subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                      >
                        {subject.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="event-date">
                Date
              </label>

              <input
                id="event-date"
                className="input"
                type="date"
                value={values.date}
                onChange={(event) =>
                  set(
                    "date",
                    event.target.value
                  )
                }
              />
            </div>

            <div className="field-inline">
              <div className="field">
                <label htmlFor="event-start">
                  Start
                </label>

                <input
                  id="event-start"
                  className="input"
                  type="time"
                  value={values.startTime}
                  onChange={(event) =>
                    set(
                      "startTime",
                      event.target.value
                    )
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="event-end">
                  End
                </label>

                <input
                  id="event-end"
                  className="input"
                  type="time"
                  value={values.endTime}
                  onChange={(event) =>
                    set(
                      "endTime",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="event-notes">
                Notes (optional)
              </label>

              <textarea
                id="event-notes"
                className="textarea"
                maxLength={500}
                value={values.notes}
                onChange={(event) =>
                  set(
                    "notes",
                    event.target.value
                  )
                }
                placeholder="Anything to remember?"
              />
            </div>
          </>
        )}

        {kind === "note" && (
          <>
            <div className="field">
              <label htmlFor="note-title">
                Title
              </label>

              <input
                autoFocus
                id="note-title"
                className="input"
                maxLength={120}
                value={values.title}
                onChange={(event) =>
                  set(
                    "title",
                    event.target.value
                  )
                }
                placeholder="A formula, idea, or question"
              />
            </div>

            <div className="field">
              <label htmlFor="note-subject">
                Subject
              </label>

              <select
                id="note-subject"
                className="select"
                value={values.subjectId}
                onChange={(event) =>
                  set(
                    "subjectId",
                    event.target.value
                  )
                }
              >
                <option value="">
                  General
                </option>

                {data.subjects.map(
                  (subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="field">
              <label htmlFor="note-content">
                Your note
              </label>

              <textarea
                id="note-content"
                className="textarea"
                style={{ minHeight: 190 }}
                maxLength={12000}
                value={values.content}
                onChange={(event) =>
                  set(
                    "content",
                    event.target.value
                  )
                }
                placeholder="Write it down while it is fresh..."
              />
            </div>
          </>
        )}

        {kind === "goal" && (
          <>
            <div className="field">
              <label htmlFor="goal-title">
                Goal name
              </label>

              <input
                autoFocus
                id="goal-title"
                className="input"
                maxLength={100}
                value={values.title}
                onChange={(event) =>
                  set(
                    "title",
                    event.target.value
                  )
                }
                placeholder="A steady study day"
              />
            </div>

            <div className="field-inline">
              <div className="field">
                <label htmlFor="goal-period">
                  Period
                </label>

                <select
                  id="goal-period"
                  className="select"
                  value={values.period}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      period:
                        event.target.value,
                      target:
                        event.target.value ===
                        "monthly"
                          ? "100"
                          : "150",
                    }))
                  }
                >
                  <option value="daily">
                    Daily
                  </option>

                  <option value="monthly">
                    Monthly
                  </option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="goal-target">
                  {values.period === "monthly"
                    ? "Hours per month"
                    : "Minutes per day"}
                </label>

                <input
                  id="goal-target"
                  className="input"
                  type="number"
                  min="1"
                  step="1"
                  max={
                    values.period === "monthly"
                      ? "744"
                      : "720"
                  }
                  value={values.target}
                  onChange={(event) =>
                    set(
                      "target",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="goal-subject">
                Subject (optional)
              </label>

              <select
                id="goal-subject"
                className="select"
                value={values.subjectId}
                onChange={(event) =>
                  set(
                    "subjectId",
                    event.target.value
                  )
                }
              >
                <option value="">
                  All subjects
                </option>

                {data.subjects.map(
                  (subject) => (
                    <option
                      key={subject.id}
                      value={subject.id}
                    >
                      {subject.name}
                    </option>
                  )
                )}
              </select>
            </div>

            {item && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--muted)",
                  fontSize: 11,
                }}
              >
                <input
                  type="checkbox"
                  checked={values.active}
                  onChange={(event) =>
                    set(
                      "active",
                      event.target.checked
                    )
                  }
                />

                Keep this goal active
              </label>
            )}
          </>
        )}

        {error && (
          <div
            className="error-box"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="modal-actions">
          {item && (
            <button
              className="button ghost"
              type="button"
              style={{
                marginRight: "auto",
                color: "var(--danger)",
              }}
              onClick={() =>
                openModal(
                  "delete",
                  item,
                  {
                    entity: kind,
                  }
                )
              }
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}

          <button
            className="button secondary"
            type="button"
            onClick={close}
          >
            Cancel
          </button>

          <button
            className="button"
            type="submit"
          >
            <Check size={14} />

            {item
              ? "Save changes"
              : kind === "goal"
                ? "Create goal"
                : kind === "note"
                  ? "Save note"
                  : kind === "event"
                    ? "Add event"
                    : "Add task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SubtasksEditor({
  subtasks,
  addSubtask,
  updateSubtask,
  removeSubtask,
}) {
  const completedCount = subtasks.filter(
    (subtask) => subtask.completed
  ).length;

  return (
    <div className="subtasks-editor">
      <div className="subtasks-editor-header">
        <div>
          <div className="subtasks-editor-title">
            <span>Subtasks</span>

            {subtasks.length > 0 && (
              <span className="subtasks-editor-count">
                {completedCount}/{subtasks.length}
              </span>
            )}
          </div>

          <p>
            Break this Core task into smaller
            study steps.
          </p>
        </div>

        <button
          type="button"
          className="button secondary subtasks-add-button"
          onClick={addSubtask}
        >
          <Plus size={13} />
          Add
        </button>
      </div>

      {subtasks.length > 0 ? (
        <div className="subtasks-editor-list">
          {subtasks.map((subtask, index) => (
            <div
              className={`subtask-editor-row${
                subtask.completed
                  ? " completed"
                  : ""
              }`}
              key={subtask.id}
            >
              <button
                type="button"
                className={`subtask-check${
                  subtask.completed
                    ? " checked"
                    : ""
                }`}
                aria-label={
                  subtask.completed
                    ? "Mark subtask incomplete"
                    : "Complete subtask"
                }
                onClick={() =>
                  updateSubtask(
                    subtask.id,
                    "completed",
                    !subtask.completed
                  )
                }
              >
                {subtask.completed && (
                  <Check size={11} />
                )}
              </button>

              <input
                className="input subtask-input"
                value={subtask.title}
                maxLength={120}
                placeholder={`Step ${
                  index + 1
                }`}
                onChange={(event) =>
                  updateSubtask(
                    subtask.id,
                    "title",
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="subtask-remove"
                aria-label="Remove subtask"
                onClick={() =>
                  removeSubtask(subtask.id)
                }
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="subtasks-editor-empty">
          <span>
            No subtasks yet. Add smaller steps
            if this is a larger Core task.
          </span>
        </div>
      )}
    </div>
  );
}