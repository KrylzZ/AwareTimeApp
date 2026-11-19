import React from "react";
import "./styles/report-view.css";

const focusSeries = [
  { day: "Mon", hours: 1.8 },
  { day: "Tue", hours: 2.4 },
  { day: "Wed", hours: 1.3 },
  { day: "Thu", hours: 3.1 },
  { day: "Fri", hours: 2.6 },
  { day: "Sat", hours: 4.2 },
  { day: "Sun", hours: 3.1 },
];

const completedSeries = [
  { day: "Mon", count: 2 },
  { day: "Tue", count: 4 },
  { day: "Wed", count: 3 },
  { day: "Thu", count: 2 },
  { day: "Fri", count: 5 },
  { day: "Sat", count: 4 },
  { day: "Sun", count: 4 },
];

const workBreakdown = [
  { label: "Do now", value: 35, color: "#2563eb" },
  { label: "Scheduled", value: 30, color: "#16a34a" },
  { label: "Delegated", value: 20, color: "#8b5cf6" },
  { label: "Completed", value: 15, color: "#94a3b8" },
];

const focusPoints = focusSeries.map((item, index) => ({
  ...item,
  x: 54 + index * 86,
  y: 190 - (item.hours / 6) * 142,
}));

const focusLinePath = focusPoints
  .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
  .join(" ");

const focusAreaPath = `M ${focusPoints[0].x} 190 ${focusPoints
  .map((point) => `L ${point.x} ${point.y}`)
  .join(" ")} L ${focusPoints[focusPoints.length - 1].x} 190 Z`;

const FocusTrendChart = () => (
  <svg
    className="report-trend-svg"
    viewBox="0 0 640 242"
    role="img"
    aria-label="Mock focus hours for each day of the week"
  >
    <defs>
      <linearGradient id="report-focus-gradient" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[0, 2, 4, 6].map((tick) => {
      const y = 190 - (tick / 6) * 142;
      return (
        <g key={tick}>
          <line className="report-grid-line" x1="44" x2="590" y1={y} y2={y} />
          <text className="report-axis-label" x="34" y={y + 4} textAnchor="end">
            {tick}h
          </text>
        </g>
      );
    })}
    <path d={focusAreaPath} fill="url(#report-focus-gradient)" />
    <path className="report-trend-line" d={focusLinePath} />
    {focusPoints.map((point) => (
      <g key={point.day}>
        <circle
          className="report-trend-point"
          cx={point.x}
          cy={point.y}
          r="4"
        />
        <text className="report-axis-label" x={point.x} y="222" textAnchor="middle">
          {point.day}
        </text>
      </g>
    ))}
  </svg>
);

const WorkBreakdownChart = () => {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="report-donut-layout">
      <svg
        className="report-donut-svg"
        viewBox="0 0 168 168"
        role="img"
        aria-label="Mock distribution of work by status"
      >
        <circle
          className="report-donut-track"
          cx="84"
          cy="84"
          r={radius}
          fill="none"
          strokeWidth="17"
        />
        <g transform="rotate(-90 84 84)">
          {workBreakdown.map((item) => {
            const segmentLength = (item.value / 100) * circumference;
            const circle = (
              <circle
                key={item.label}
                cx="84"
                cy="84"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-offset}
                strokeWidth="17"
              />
            );
            offset += segmentLength;
            return circle;
          })}
        </g>
        <text className="report-donut-total" x="84" y="82" textAnchor="middle">
          24
        </text>
        <text className="report-donut-caption" x="84" y="101" textAnchor="middle">
          work items
        </text>
      </svg>
      <ul className="report-legend">
        {workBreakdown.map((item) => (
          <li key={item.label}>
            <span className="report-legend-label">
              <span className="report-legend-dot" style={{ background: item.color }} />
              {item.label}
            </span>
            <strong>{item.value}%</strong>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CompletedTasksChart = () => (
  <div
    className="report-bars"
    role="img"
    aria-label="Mock completed tasks by day: Monday 2, Tuesday 4, Wednesday 3, Thursday 2, Friday 5, Saturday 4, Sunday 4"
  >
    {completedSeries.map((item) => (
      <div className="report-bar-column" key={item.day} title={`${item.count} tasks`}>
        <span className="report-bar-value">{item.count}</span>
        <div className="report-bar-track">
          <span style={{ height: `${(item.count / 6) * 100}%` }} />
        </div>
        <span className="report-bar-day">{item.day}</span>
      </div>
    ))}
  </div>
);

const Report = () => (
  <section className="report-page" aria-labelledby="report-title">
    <header className="report-header">
      <div>
        <p className="report-eyebrow">REPORTS / SAMPLE DATA</p>
        <h1 id="report-title">Weekly overview</h1>
        <p className="report-description">
          A quick look at focus time and work completed this week.
        </p>
      </div>
      <span className="report-date-range">Nov 16 – Nov 22, 2026</span>
    </header>

    <section className="report-summary" aria-label="Weekly summary">
      <article className="report-summary-card">
        <span>Focus time</span>
        <strong>18h 30m</strong>
        <small>+12% from last week</small>
      </article>
      <article className="report-summary-card">
        <span>Tasks completed</span>
        <strong>24</strong>
        <small>4 more than last week</small>
      </article>
      <article className="report-summary-card">
        <span>Current streak</span>
        <strong>5 days</strong>
        <small>Keep the momentum going</small>
      </article>
    </section>

    <section className="report-charts" aria-label="Weekly charts">
      <article className="report-card report-focus-card">
        <div className="report-card-header">
          <div>
            <h2>Focus time</h2>
            <p>Hours tracked each day</p>
          </div>
          <strong>18.5h</strong>
        </div>
        <FocusTrendChart />
      </article>

      <article className="report-card">
        <div className="report-card-header">
          <div>
            <h2>Work distribution</h2>
            <p>Items by status</p>
          </div>
        </div>
        <WorkBreakdownChart />
      </article>

      <article className="report-card report-completion-card">
        <div className="report-card-header">
          <div>
            <h2>Tasks completed</h2>
            <p>Daily total · 24 this week</p>
          </div>
          <span className="report-trend-badge">+20%</span>
        </div>
        <CompletedTasksChart />
      </article>
    </section>
  </section>
);

export default Report;
