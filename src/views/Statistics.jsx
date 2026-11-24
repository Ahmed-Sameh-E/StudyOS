import { Activity, BookOpen, Target, TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { EmptyState, SectionHeading, ChartTip } from "../components/ui";

import {
  formatHours,
  formatMinutes,
  prettyDate,
  toDateKey,
  weekStart,
} from "../utils/formatters";

import { studyNow } from "../data/studyData";

export default function StatisticsView({
  data,
  stats,
  period,
  setPeriod,
  subjectById,
}) {
  const now = studyNow();
  const sessions = Array.isArray(data.sessions) ? data.sessions : [];

  // Read the daily target directly from Settings.
  // No fixed target is stored in this component.
  const dailyGoal = Number(data.settings?.dailyGoalMinutes);
  const hasValidGoal = Number.isFinite(dailyGoal) && dailyGoal > 0;

  const week = weekStart(now);
  const weekEnd = new Date(week);
  weekEnd.setDate(weekEnd.getDate() + 7);

  // =========================
  // Main Study Time Chart
  // =========================

  let chartData = [];

  if (period === "day") {
    chartData = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - 13 + index);
      const key = toDateKey(date);

      return {
        label: new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
        }).format(date),
        minutes: stats.dayMinutes(key),
      };
    });
  } else if (period === "week") {
    chartData = Array.from({ length: 8 }, (_, index) => {
      const start = new Date(week);
      start.setDate(week.getDate() - (7 - index) * 7);

      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const minutes = sessions
        .filter((session) => {
          const date = new Date(session.completedAt);
          return date >= start && date < end;
        })
        .reduce(
          (sum, session) => sum + Number(session.durationMinutes || 0),
          0,
        );

      return {
        label: new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
        }).format(start),
        minutes,
      };
    });
  } else {
    chartData = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 11 + index,
        1,
      );
      const next = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        1,
      );

      const minutes = sessions
        .filter((session) => {
          const day = new Date(session.completedAt);
          return day >= date && day < next;
        })
        .reduce(
          (sum, session) => sum + Number(session.durationMinutes || 0),
          0,
        );

      return {
        label: new Intl.DateTimeFormat(undefined, {
          month: "short",
        }).format(date),
        minutes,
      };
    });
  }

  // =========================
  // Subject Statistics
  // =========================

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const subjectData = data.subjects
    .map((subject) => ({
      name: subject.name,
      minutes: sessions
        .filter(
          (session) =>
            session.subjectId === subject.id &&
            new Date(session.completedAt) >= thirtyDaysAgo,
        )
        .reduce(
          (sum, session) => sum + Number(session.durationMinutes || 0),
          0,
        ),
      color: subject.color,
    }))
    .filter((item) => item.minutes > 0);

  // =========================
  // Daily & Weekly Statistics
  // =========================

  const totalToday = stats.daily;

  const thisWeek = sessions
    .filter((session) => {
      const date = new Date(session.completedAt);
      return date >= week && date < weekEnd;
    })
    .reduce(
      (sum, session) => sum + Number(session.durationMinutes || 0),
      0,
    );

  // =========================
  // Shared session totals by date
  // =========================

  const sessionMinutesByDate = {};

  sessions.forEach((session) => {
    const key = toDateKey(new Date(session.completedAt));
    sessionMinutesByDate[key] =
      (sessionMinutesByDate[key] || 0) +
      Number(session.durationMinutes || 0);
  });

  const firstSessionTime = sessions.length
    ? Math.min(
        ...sessions.map((session) =>
          new Date(session.completedAt).getTime(),
        ),
      )
    : null;

  const firstSessionDate =
    firstSessionTime !== null && Number.isFinite(firstSessionTime)
      ? new Date(firstSessionTime)
      : null;

  // =========================
  // Study Rhythm
  // Average study time by weekday.
  // Uses up to the last 8 weeks, but never counts days
  // before the first recorded study session.
  // =========================

  const weekdayTotals = Array.from({ length: 7 }, () => ({
    total: 0,
    days: 0,
  }));

  if (firstSessionDate) {
    const rhythmStart = new Date(now);
    rhythmStart.setDate(now.getDate() - 55);

    const actualStart =
      firstSessionDate > rhythmStart ? firstSessionDate : rhythmStart;

    const cursor = new Date(actualStart);
    cursor.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(0, 0, 0, 0);

    while (cursor <= todayEnd) {
      const weekday = cursor.getDay();
      const key = toDateKey(cursor);

      weekdayTotals[weekday].total += sessionMinutesByDate[key] || 0;
      weekdayTotals[weekday].days += 1;

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const weekdayData = weekdayTotals.map((item, index) => ({
    day: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
    }).format(new Date(2026, 0, 4 + index)),
    minutes:
      item.days > 0 ? Math.round(item.total / item.days) : 0,
  }));

  // =========================
  // Study Progress
  // Average daily study time per week, starting from
  // the week of the first recorded session.
  // =========================

  const progressData = [];

  if (firstSessionDate) {
    const progressStart = weekStart(firstSessionDate);
    const currentWeekStart = weekStart(now);
    const cursor = new Date(progressStart);

    while (cursor <= currentWeekStart) {
      const nextWeek = new Date(cursor);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const weekSessions = sessions.filter((session) => {
        const date = new Date(session.completedAt);
        return date >= cursor && date < nextWeek;
      });

      const totalMinutes = weekSessions.reduce(
        (sum, session) => sum + Number(session.durationMinutes || 0),
        0,
      );

      const firstDayOfWeek =
        cursor < firstSessionDate ? firstSessionDate : cursor;

      const lastDayOfWeek = nextWeek > now ? now : nextWeek;

      const elapsedDays = Math.max(
        1,
        Math.ceil((lastDayOfWeek - firstDayOfWeek) / 86400000) + 1,
      );

      progressData.push({
        label: new Intl.DateTimeFormat(undefined, {
          month: "short",
          day: "numeric",
        }).format(cursor),
        minutes: Math.round(totalMinutes / elapsedDays),
        totalMinutes,
      });

      cursor.setDate(cursor.getDate() + 7);
    }
  }

  // =========================
  // Goal Achievement
  // Last 14 days, using the current goal from Settings.
  // =========================

  const goalData = Array.from({ length: 14 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(now.getDate() - 13 + index);

    const key = toDateKey(date);
    const actual = sessionMinutesByDate[key] || 0;

    return {
      label: new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
      }).format(date),
      actual,
      goal: hasValidGoal ? dailyGoal : 0,
      achieved: hasValidGoal && actual >= dailyGoal,
    };
  });

  const achievedDays = hasValidGoal
    ? goalData.filter((day) => day.achieved).length
    : 0;

  // =========================
  // Render
  // =========================

  return (
    <>
      <style>{`
        /* Prevent the browser/Recharts focus ring from appearing as a white box
           after tapping chart elements on touch screens. */
        .chart-wrap,
        .chart-wrap *,
        .chart-wrap svg,
        .chart-wrap svg * {
          -webkit-tap-highlight-color: transparent;
        }

        .chart-wrap svg:focus,
        .chart-wrap svg *:focus,
        .chart-wrap svg *:focus-visible,
        .recharts-wrapper:focus,
        .recharts-surface:focus,
        .recharts-sector:focus,
        .recharts-rectangle:focus,
        .recharts-dot:focus {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>

      <SectionHeading
        eyebrow="Your effort, made visible"
        title="Statistics"
        copy="Patterns matter more than perfect days. See how your time adds up."
      />

      {/* Main Statistics Cards */}

      <div className="grid stat-grid">
        <article className="card stat-card">
          <div className="stat-label">Today</div>
          <div className="stat-number">{formatMinutes(totalToday)}</div>
          <div className="stat-detail">of focused study</div>
        </article>

        <article className="card stat-card">
          <div className="stat-label">This week</div>
          <div className="stat-number">{formatHours(thisWeek)}</div>
          <div className="stat-detail">
            {stats.streak} day current streak · {stats.longest} longest
          </div>
        </article>

        <article className="card stat-card">
          <div className="stat-label">This month</div>
          <div className="stat-number">{formatHours(stats.monthly)}</div>
          <div className="stat-detail">focused study time</div>
        </article>
      </div>

      {/* Study Time Chart */}

      <section className="card card-pad">
        <div className="card-head">
          <div>
            <h2 className="card-title">Study time</h2>
            <div className="card-caption">
              {period === "day"
                ? "Daily totals over the last 14 days"
                : period === "week"
                  ? "Weekly totals over the last 8 weeks"
                  : "Monthly totals over the last 12 months"}
            </div>
          </div>

          <div className="filter-bar" style={{ margin: 0 }}>
            {[
              ["day", "Daily"],
              ["week", "Weekly"],
              ["month", "Monthly"],
            ].map(([value, label]) => (
              <button
                className={`preset${period === value ? " selected" : ""}`}
                key={value}
                type="button"
                onClick={() => setPeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {sessions.length ? (
          <div className="chart-wrap" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 10, left: -16, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="var(--line)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  interval={period === "day" ? 1 : 0}
                  tick={{ fill: "var(--muted)", fontSize: 9 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 9 }}
                />

                <Tooltip content={<ChartTip />} cursor={false} />

                <Line
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={Activity}
            title="No study history yet"
            copy="Finish a focus session and your real study data will appear here."
          />
        )}
      </section>

      {/* Study Rhythm Chart */}

      <section className="card card-pad section-gap">
        <div className="card-head">
          <div>
            <h2 className="card-title">Study Rhythm</h2>
            <div className="card-caption">
              Average daily study time by weekday · Up to the last 8 weeks
            </div>
          </div>

          <span className="muted" style={{ fontSize: 10 }}>
            Daily average
          </span>
        </div>

        {firstSessionDate ? (
          <>
            <div className="chart-wrap" style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weekdayData}
                  margin={{ top: 12, right: 10, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--line)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 10 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 9 }}
                  />

                  <Tooltip content={<ChartTip />} cursor={false} />

                  <Bar
                    dataKey="minutes"
                    fill="var(--accent)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                    activeBar={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card-caption">
              Days without study are counted as zero, starting from your first
              recorded session.
            </div>
          </>
        ) : (
          <EmptyState
            icon={Activity}
            title="Not enough data yet"
            copy="Your weekday study rhythm will appear after your first completed session."
          />
        )}
      </section>

      {/* Study Progress Chart */}

      <section className="card card-pad section-gap">
        <div className="card-head">
          <div>
            <h2 className="card-title">Study Progress</h2>
            <div className="card-caption">
              Average study minutes per day · From your first session
            </div>
          </div>

          <TrendingUp size={18} color="var(--accent)" />
        </div>

        {progressData.length ? (
          <div className="chart-wrap" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={progressData}
                margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="studyProgressFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--accent)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--accent)"
                      stopOpacity={0.02}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="var(--line)"
                  vertical={false}
                />

                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={22}
                  tick={{ fill: "var(--muted)", fontSize: 9 }}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted)", fontSize: 9 }}
                />

                <Tooltip content={<ChartTip />} cursor={false} />

                <Area
                  type="monotone"
                  dataKey="minutes"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  fill="url(#studyProgressFill)"
                  activeDot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState
            icon={TrendingUp}
            title="Your progress will appear here"
            copy="Complete a focus session to start building your weekly progress chart."
          />
        )}
      </section>

      {/* Goal Achievement Chart */}

      <section className="card card-pad section-gap">
        <div className="card-head">
          <div>
            <h2 className="card-title">Goal Achievement</h2>
            <div className="card-caption">
              Daily study time compared with your Settings goal · Last 14 days
            </div>
          </div>

          <Target size={18} color="var(--accent)" />
        </div>

        {hasValidGoal ? (
          <>
            <div className="mini-stat-top" style={{ marginBottom: 14 }}>
              <span className="card-caption">
                Daily target: {formatMinutes(dailyGoal)}
              </span>

              <strong style={{ color: "var(--ink)", fontSize: 12 }}>
                {achievedDays}/14 days reached
              </strong>
            </div>

            <div className="chart-wrap" style={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={goalData}
                  margin={{ top: 12, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--line)"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                    tick={{ fill: "var(--muted)", fontSize: 9 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 9 }}
                  />

                  <Tooltip content={<ChartTip />} cursor={false} />

                  <ReferenceLine
                    y={dailyGoal}
                    stroke="var(--success, var(--accent))"
                    strokeDasharray="5 5"
                    label={{
                      value: "Goal",
                      position: "insideTopRight",
                      fill: "var(--muted)",
                      fontSize: 10,
                    }}
                  />

                  <Bar
                    dataKey="actual"
                    name="actual"
                    fill="var(--accent)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={30}
                    activeBar={false}
                  />

                  <Line
                    type="monotone"
                    dataKey="goal"
                    name="goal"
                    stroke="var(--success, var(--accent))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="card-caption">
              Changing the daily goal in Settings updates this chart
              automatically. Previous days are recalculated against the current
              goal.
            </div>
          </>
        ) : (
          <EmptyState
            icon={Target}
            title="Set a daily goal first"
            copy="Choose your daily study target in Settings to see your goal achievement."
          />
        )}
      </section>

      {/* Subject & Recent Sessions */}

      <div
        className="grid section-gap"
        style={{ gridTemplateColumns: "1fr 1fr" }}
      >
        {/* Time by Subject */}

        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h2 className="card-title">Time by subject</h2>
              <div className="card-caption">Last 30 days</div>
            </div>
          </div>

          {subjectData.length ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "150px 1fr",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ height: 165 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      dataKey="minutes"
                      nameKey="name"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={3}
                      stroke="none"
                      activeShape={false}
                    >
                      {subjectData.map((item) => (
                        <Cell
                          key={item.name}
                          fill={item.color}
                        />
                      ))}
                    </Pie>

                    <Tooltip
                      content={<ChartTip />}
                      cursor={false}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {subjectData.map((item) => (
                  <div
                    className="mini-stat-top"
                    key={item.name}
                  >
                    <span
                      className="subject-pill"
                      style={{ "--subject-color": item.color }}
                    >
                      <i className="subject-dot" />
                      {item.name}
                    </span>

                    <strong
                      style={{
                        color: "var(--ink)",
                        fontSize: 10,
                      }}
                    >
                      {formatMinutes(item.minutes)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No subject data yet"
              copy="Choose a subject during a focus session to build this view."
            />
          )}
        </section>

        {/* Recent Sessions */}

        <section className="card card-pad">
          <div className="card-head">
            <div>
              <h2 className="card-title">Recent sessions</h2>
              <div className="card-caption">
                {sessions.length} completed focus blocks stored locally
              </div>
            </div>
          </div>

          {sessions.length ? (
            sessions
              .slice()
              .sort(
                (a, b) =>
                  new Date(b.completedAt) -
                  new Date(a.completedAt),
              )
              .slice(0, 5)
              .map((session) => (
                <div
                  className="event-row"
                  key={session.id}
                >
                  <div className="event-time">
                    {prettyDate(session.completedAt, {
                      month: "short",
                      day: "numeric",
                    })}
                    <br />
                    {new Date(
                      session.completedAt,
                    ).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>

                  <div
                    className="event-mark"
                    style={{
                      background:
                        subjectById(session.subjectId)?.color ||
                        "var(--accent)",
                    }}
                  />

                  <div className="event-details">
                    <strong>
                      {subjectById(session.subjectId)?.name ||
                        "Independent study"}
                    </strong>
                    <span>Focused work</span>
                  </div>

                  <span className="event-kind">
                    {formatMinutes(session.durationMinutes)}
                  </span>
                </div>
              ))
          ) : (
            <EmptyState
              title="Sessions will show here"
              copy="Your focus timer logs a session only when a full block is complete."
            />
          )}
        </section>
      </div>
    </>
  );
}