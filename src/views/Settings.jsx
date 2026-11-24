import { Download, FileUp, Moon, RotateCcw, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { SectionHeading } from "../components/ui";
import { formatMinutes } from "../utils/formatters";

export default function SettingsView({
  data,
  onName,
  onDailyGoal,
  setTheme,
  onExport,
  onImport,
  onReset,
  notify,
}) {
  const [nameDraft, setNameDraft] = useState(data.settings.studentName || "");
  const [goalDraft, setGoalDraft] = useState(
    String(data.settings.dailyGoalMinutes || 150),
  );
  useEffect(() => {
    setNameDraft(data.settings.studentName || "");
  }, [data.settings.studentName]);
  useEffect(() => {
    setGoalDraft(String(data.settings.dailyGoalMinutes || 150));
  }, [data.settings.dailyGoalMinutes]);
  const saveName = () => {
    const name = nameDraft.trim() || "Student";
    setNameDraft(name);
    onName(name);
    notify("Student profile saved.");
  };
  const saveGoal = () => {
    const minutes = Number(goalDraft);
    if (!Number.isInteger(minutes) || minutes < 15 || minutes > 720) {
      notify("Choose a daily goal from 15 to 720 whole minutes.", "error");
      return;
    }
    onDailyGoal(minutes);
    notify("Daily study goal updated.");
  };
  return (
    <>
      <SectionHeading
        eyebrow="Make your space yours"
        title="Settings"
        copy="Your study information lives in this browser. Nothing is synced to an account or server."
      />
      <div className="settings-grid">
        <section className="card setting-card">
          <h2>Student profile</h2>
          <p>Choose how StudyOS greets you in your workspace.</p>
          <div className="field">
            <label htmlFor="student-name">Your name</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="student-name"
                className="input"
                value={nameDraft}
                maxLength={40}
                onChange={(event) => setNameDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveName();
                }}
              />
              <button
                className="button secondary"
                type="button"
                onClick={saveName}
              >
                Save
              </button>
            </div>
          </div>
        </section>
        <section className="card setting-card">
          <h2>Daily study goal</h2>
          <p>Your dashboard tracks focused study against this target.</p>
          <div className="field">
            <label htmlFor="daily-goal">Minutes per day</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                id="daily-goal"
                className="input"
                type="number"
                min="15"
                max="720"
                step="5"
                value={goalDraft}
                onChange={(event) => setGoalDraft(event.target.value)}
              />
              <button
                className="button secondary"
                type="button"
                onClick={saveGoal}
              >
                Save
              </button>
            </div>
            <span className="card-caption">
              Choose 15–720 minutes. Current:{" "}
              {formatMinutes(data.settings.dailyGoalMinutes)}
            </span>
          </div>
        </section>
        <section className="card setting-card">
          <h2>Appearance</h2>
          <p>Pick the theme that feels comfortable for your study sessions.</p>
          <div className="theme-choice">
            <button
              className={data.settings.theme === "light" ? "selected" : ""}
              type="button"
              onClick={() => setTheme("light")}
            >
              <Sun size={14} />
              Light
            </button>
            <button
              className={data.settings.theme === "dark" ? "selected" : ""}
              type="button"
              onClick={() => setTheme("dark")}
            >
              <Moon size={14} />
              Dark
            </button>
          </div>
        </section>
        <section className="card setting-card">
          <h2>Your local data</h2>
          <p>
            Export a JSON backup or restore a previous one. Data is stored only
            in this browser’s LocalStorage.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button
              className="button secondary"
              type="button"
              onClick={onExport}
            >
              <Download size={14} />
              Export backup
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={onImport}
            >
              <FileUp size={14} />
              Import backup
            </button>
          </div>
        </section>
        <section
          className="card setting-card"
          style={{
            gridColumn: "1 / -1",
            borderColor: "color-mix(in srgb, var(--danger) 25%, var(--line))",
          }}
        >
          <h2>Reset study space</h2>
          <p>
            Clear the saved tasks, sessions, schedule, goals, and notes in this
            browser. Your four core subjects remain, and settings return to
            their defaults. This cannot be undone unless you have a backup.
          </p>
          <button className="button danger" type="button" onClick={onReset}>
            <RotateCcw size={14} />
            Reset all data
          </button>
        </section>
      </div>
    </>
  );
}
