import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  CheckSquare2,
  CircleHelp,
  ChevronRight,
  LayoutDashboard,
  Menu,
  Moon,
  NotebookPen,
  Search,
  Settings2,
  Sun,
  Timer,
  X,
  Target,
} from "lucide-react";
import { useStudyOS } from "./hooks/useStudyOS";
import { NAV_ITEMS, validateData } from "./data/studyData";
import { IconButton } from "./components/ui";
import EditorModal from "./components/EditorModal";
import Dashboard from "./views/Dashboard";
import FocusView from "./views/Focus";
import TasksView from "./views/Tasks";
import ScheduleView from "./views/Schedule";
import SubjectsView from "./views/Subjects";
import GoalsView from "./views/Goals";
import NotesView from "./views/Notes";
import SettingsView from "./views/Settings";
import { initials, today } from "./utils/formatters";

const icons = {
  LayoutDashboard,
  Timer,
  CheckSquare2,
  CalendarDays,
  BookOpen,
  Target,
  ChartNoAxesCombined,
  NotebookPen,
  Settings2,
};
const StatisticsView = lazy(() => import("./views/Statistics"));

function App() {
  const app = useStudyOS();
  const { data, stats, nextTask } = app;
  const [view, setView] = useState("dashboard");
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [taskFilter, setTaskFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [chartPeriod, setChartPeriod] = useState("week");
  const searchRef = useRef(null);
  const importRef = useRef(null);
  const toastTimer = useRef(null);

  const notify = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  };
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);
  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      data.settings.theme === "dark",
    );
  }, [data.settings.theme]);
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (app.storageWarning) notify(app.storageWarning, "error");
  }, [app.storageWarning]);

  const subjects = data.subjects;
  const subjectById = (id) => subjects.find((subject) => subject.id === id);
  const subjectLabel = (id) => subjectById(id)?.name || "No subject";
  const openModal = (kind, item = null, extra = {}) =>
    setModal({ kind, item, ...extra });
  const closeModal = () => setModal(null);
  const navigate = (next) => {
    setView(next);
    setDrawerOpen(false);
    setSearch("");
    setSearchOpen(false);
  };
  const setTheme = (theme) => {
    app.setSetting("theme", theme);
    notify(`${theme === "dark" ? "Dark" : "Light"} theme enabled.`);
  };
  const toggleComplete = (id) => app.toggleTask(id);
  const toggleSubtask = (taskId, subtaskId) =>
    app.toggleSubtask(taskId, subtaskId);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (query.length < 2) return [];
    const hits = [];
    data.tasks.forEach((item) => {
      if (
        `${item.title} ${subjectLabel(item.subjectId)}`
          .toLowerCase()
          .includes(query)
      )
        hits.push({ kind: "task", item, label: item.title });
    });
    data.notes.forEach((item) => {
      if (
        `${item.title} ${item.content} ${subjectLabel(item.subjectId)}`
          .toLowerCase()
          .includes(query)
      )
        hits.push({ kind: "note", item, label: item.title });
    });
    data.events.forEach((item) => {
      if (
        `${item.title} ${item.notes} ${subjectLabel(item.subjectId)}`
          .toLowerCase()
          .includes(query)
      )
        hits.push({ kind: "event", item, label: item.title });
    });
    subjects.forEach((item) => {
      if (item.name.toLowerCase().includes(query))
        hits.push({ kind: "subject", item, label: item.name });
    });
    return hits.slice(0, 7);
  }, [search, data.tasks, data.notes, data.events, subjects]);

  const openSearchHit = (hit) => {
    if (hit.kind === "task") {
      navigate("tasks");
      openModal("task", hit.item);
    }
    if (hit.kind === "note") {
      navigate("notes");
      openModal("note", hit.item);
    }
    if (hit.kind === "event") {
      navigate("schedule");
      openModal("event", hit.item);
    }
    if (hit.kind === "subject") navigate("subjects");
  };

  const addTask = () => openModal("task");
  const addEvent = (date = today(), startTime = "15:00") =>
    openModal("event", null, { date, startTime });
  const addNote = () => openModal("note");
  const addGoal = () => openModal("goal");
  const goNav = (id) => navigate(id);

  const doExport = () => {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `studyos-backup-${today()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      notify("Your StudyOS backup was downloaded.");
    } catch {
      notify("The backup could not be created in this browser.", "error");
    }
  };
  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      validateData(parsed);
      if (
        !window.confirm(
          "Import this backup and replace the study space currently saved in this browser?",
        )
      )
        return;
      app.importData(parsed);
      notify("Backup imported successfully.");
    } catch (error) {
      notify(
        error instanceof SyntaxError
          ? "This file is not valid JSON."
          : error.message || "The backup could not be imported.",
        "error",
      );
    }
  };
  const resetWorkspace = () => {
    if (
      !window.confirm(
        "Clear all StudyOS records saved in this browser? Tasks, sessions, schedule items, goals, notes, and settings will be reset. Your four core subjects will remain. This cannot be undone unless you have a backup.",
      )
    )
      return;
    app.reset();
    notify("Your workspace is now empty.");
  };

  const nav = (
    <>
      <div className="nav-label">Your workspace</div>
      <nav className="nav-list" aria-label="Workspace navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = icons[item.icon];
          return (
            <button
              className={`nav-item${view === item.id ? " active" : ""}`}
              key={item.id}
              type="button"
              title={item.label}
              aria-label={item.label}
              onClick={() => goNav(item.id)}
              aria-current={view === item.id ? "page" : undefined}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.id === "tasks" && (
                <span className="nav-count">
                  {data.tasks.filter((task) => !task.completed).length}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );

  const commonProps = {
    data,
    stats,
    nextTask,
    app,
    notify,
    openModal,
    navigate,
    subjectById,
    subjectLabel,
    toggleComplete,
  };

  return (
    <div className="app-shell">
      {drawerOpen && (
        <button
          className="scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <aside className={`sidebar${drawerOpen ? " drawer" : ""}`}>
        <a
          href="#dashboard"
          className="brand"
          onClick={(event) => {
            event.preventDefault();
            navigate("dashboard");
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-name">
            Study<span>OS</span>
          </span>
        </a>
        {nav}
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <div className="note-overline">A note to self</div>
            <strong>Small steps add up.</strong>
            <p>
              One focused block is enough to begin. Keep the next step simple.
            </p>
          </div>
          <div className="profile">
            <div className="avatar">{initials(data.settings.studentName)}</div>
            <div className="profile-copy">
              <div className="profile-name">
                {data.settings.studentName || "Student"}
              </div>
              <div className="profile-sub">Personal study space</div>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <IconButton
            className="mobile-menu"
            label="Open navigation"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu size={18} />
          </IconButton>
          <div className="crumb">
            <span>StudyOS</span>
            <ChevronRight size={13} />
            <strong>
              {NAV_ITEMS.find((item) => item.id === view)?.label || "Overview"}
            </strong>
          </div>
          <div className="search-wrap">
            <div className="search-box">
              <Search size={15} />
              <input
                ref={searchRef}
                value={search}
                onFocus={() => setSearchOpen(true)}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && searchResults[0])
                    openSearchHit(searchResults[0]);
                  if (event.key === "Escape") setSearchOpen(false);
                }}
                placeholder="Search anything..."
                aria-label="Search tasks, notes, schedule, and subjects"
              />
              <span className="key-hint">⌘ K</span>
            </div>
            {searchOpen && search.trim().length > 1 && (
              <div className="search-results" role="listbox">
                {searchResults.length ? (
                  searchResults.map((hit, index) => (
                    <button
                      className="search-result"
                      type="button"
                      key={`${hit.kind}-${hit.item.id}-${index}`}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => openSearchHit(hit)}
                    >
                      <Search size={13} />
                      <span>{hit.label}</span>
                      <span className="result-type">{hit.kind}</span>
                    </button>
                  ))
                ) : (
                  <div className="search-result muted">No matches found</div>
                )}
              </div>
            )}
          </div>
          <div className="top-actions">
            <IconButton
              label={
                data.settings.theme === "dark"
                  ? "Switch to light theme"
                  : "Switch to dark theme"
              }
              onClick={() =>
                setTheme(data.settings.theme === "dark" ? "light" : "dark")
              }
            >
              {data.settings.theme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Moon size={16} />
              )}
            </IconButton>
            <IconButton
              label="Open settings"
              onClick={() => navigate("settings")}
            >
              <Settings2 size={16} />
            </IconButton>
          </div>
        </header>

        <main
          className="content"
          id="main"
          onClick={() => {
            if (searchOpen) setSearchOpen(false);
          }}
        >
          {view === "dashboard" && <Dashboard {...commonProps} />}
          {view === "focus" && (
            <FocusView
              {...commonProps}
              timerRemainingSeconds={app.timerRemainingSeconds}
              notify={notify}
            />
          )}
          {view === "tasks" && (
            <TasksView
              {...commonProps}
              toggleSubtask={toggleSubtask}
              filter={taskFilter}
              setFilter={setTaskFilter}
              subjectFilter={subjectFilter}
              setSubjectFilter={setSubjectFilter}
            />
          )}
          {view === "schedule" && (
            <ScheduleView
              {...commonProps}
              weekOffset={weekOffset}
              setWeekOffset={setWeekOffset}
              addEvent={addEvent}
            />
          )}
          {view === "subjects" && <SubjectsView {...commonProps} />}
          {view === "goals" && <GoalsView {...commonProps} addGoal={addGoal} />}
          {view === "statistics" && (
            <Suspense
              fallback={
                <section className="card card-pad">Loading statistics…</section>
              }
            >
              <StatisticsView
                {...commonProps}
                period={chartPeriod}
                setPeriod={setChartPeriod}
              />
            </Suspense>
          )}
          {view === "notes" && <NotesView {...commonProps} addNote={addNote} />}
          {view === "settings" && (
            <SettingsView
              {...commonProps}
              setTheme={setTheme}
              onExport={doExport}
              onImport={() => importRef.current?.click()}
              onReset={resetWorkspace}
              onName={(value) => app.setSetting("studentName", value)}
              onDailyGoal={(value) => app.setSetting("dailyGoalMinutes", value)}
            />
          )}
          <input
            ref={importRef}
            hidden
            type="file"
            accept="application/json,.json"
            onChange={onImportFile}
          />
        </main>
      </div>

      <nav className="phone-nav" aria-label="Quick navigation">
        {["dashboard", "focus", "tasks", "schedule", "notes"].map((id) => {
          const item = NAV_ITEMS.find((navItem) => navItem.id === id);
          const Icon = icons[item.icon];
          return (
            <button
              type="button"
              key={id}
              className={view === id ? "active" : ""}
              onClick={() => navigate(id)}
              aria-current={view === id ? "page" : undefined}
            >
              <Icon size={17} />
              <span>
                {id === "dashboard" ? "Home" : item.label.replace(" timer", "")}
              </span>
            </button>
          );
        })}
      </nav>

      {toast && (
        <div className="toast-stack" role="status" aria-live="polite">
          <div className={`toast ${toast.type === "error" ? "error" : ""}`}>
            {toast.type === "error" ? (
              <CircleHelp size={15} />
            ) : (
              <Check size={15} />
            )}
            <span>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToast(null)}
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      {modal && (
        <EditorModal modal={modal} close={closeModal} {...commonProps} />
      )}
    </div>
  );
}

export default App;
