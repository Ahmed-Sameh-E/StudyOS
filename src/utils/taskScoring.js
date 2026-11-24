import { studyNow, safeDate } from "../data/studyData";

const priorityScore = {
  high: 30,
  medium: 18,
  low: 8,
};

const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return 7;

  const today = new Date(studyNow());
  today.setHours(12, 0, 0, 0);

  const due = safeDate(dueDate);

  if (!due) return 7;

  due.setHours(12, 0, 0, 0);

  return Math.round(
    (due.getTime() - today.getTime()) / 86400000
  );
};

const getDueScore = (dueDate) => {
  const days = getDaysUntilDue(dueDate);

  if (days < 0) return 60;
  if (days === 0) return 50;
  if (days === 1) return 38;
  if (days === 2) return 28;
  if (days <= 4) return 18;
  if (days <= 7) return 10;

  return 3;
};

const getSubtaskScore = (task) => {
  if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) {
    return 0;
  }

  const completed = task.subtasks.filter(
    (subtask) => subtask.completed
  ).length;

  if (completed === task.subtasks.length) {
    return 8;
  }

  if (completed > 0) {
    return 12;
  }

  return 5;
};

export const scoreTask = (task) => {
  if (!task || task.completed) return -Infinity;

  let score = 0;

  // Core tasks represent actual study progress.
  if (task.type === "core") {
    score += 50;
  } else {
    score += 10;
  }

  // Priority.
  score += priorityScore[task.priority] || 0;

  // Due date / urgency.
  score += getDueScore(task.dueDate);

  // Continuing an already-started Core task gets a small boost.
  score += getSubtaskScore(task);

  return score;
};

export const getNextTask = (tasks = []) => {
  const pendingTasks = tasks.filter(
    (task) => !task.completed
  );

  if (pendingTasks.length === 0) {
    return null;
  }

  return [...pendingTasks].sort((a, b) => {
    const scoreDifference =
      scoreTask(b) - scoreTask(a);

    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const aCreated = safeDate(a.createdAt)?.getTime() || 0;
    const bCreated = safeDate(b.createdAt)?.getTime() || 0;

    return aCreated - bCreated;
  })[0];
};