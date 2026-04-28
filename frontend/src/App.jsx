import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";
const PERSONAL_TIPS = {
  "Statistics 101": "Revise probability basics and practice 10 short quiz questions daily.",
  "AI Foundations": "Focus on supervised vs unsupervised concepts and build one mini project.",
  "SQL Fundamentals": "Practice joins and aggregations using 2-3 real datasets.",
  "Python Basics": "Spend 30 minutes daily on loops, functions, and list comprehensions.",
  "Data Visualization": "Create one chart story per day using meaningful labels and color contrast.",
};

function SectionCard({ title, children, tone = "default", isLight = false, className = "" }) {
  const toneClass =
    tone === "warning"
      ? "border-rose-400/30"
      : tone === "success"
        ? "border-emerald-400/30"
        : "border-indigo-300/20";

  return (
    <div
      className={`rounded-2xl border ${toneClass} p-5 transition duration-300 hover:-translate-y-1 ${className} ${
        isLight
          ? "glass-panel-light"
          : "glass-panel"
      }`}
    >
      <h2 className={`mb-4 text-lg font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{title}</h2>
      {children}
    </div>
  );
}

function ScoreRing({ score, size = 48, strokeWidth = 4, isLight = false }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={isLight ? "#e2e8f0" : "#1e293b"}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={score >= 80 ? "#10b981" : score >= 60 ? "#6366f1" : "#f43f5e"}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className={`absolute text-xs font-bold ${isLight ? "text-slate-800" : "text-slate-200"}`}>
        {Math.round(score)}
      </span>
    </div>
  );
}

function CourseCard({ course, score, category, difficulty, isLight }) {
  return (
    <div className={`course-card-hover relative flex flex-col justify-between overflow-hidden rounded-xl border p-4 ${isLight ? "glass-panel-light border-indigo-200" : "glass-panel border-indigo-500/30"}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-bold leading-tight ${isLight ? "text-slate-900" : "text-white"}`}>{course}</h3>
          <p className={`mt-1 text-xs font-medium uppercase tracking-wider ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
            {category || "Course"}
          </p>
        </div>
        <ScoreRing score={score * 100} size={42} strokeWidth={3} isLight={isLight} />
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <span className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-widest ${
          difficulty === "Beginner" 
            ? (isLight ? "bg-emerald-100 text-emerald-800" : "bg-emerald-900/50 text-emerald-300")
            : difficulty === "Intermediate"
              ? (isLight ? "bg-amber-100 text-amber-800" : "bg-amber-900/50 text-amber-300")
              : (isLight ? "bg-rose-100 text-rose-800" : "bg-rose-900/50 text-rose-300")
        }`}>
          {difficulty || "Unknown"}
        </span>
      </div>
    </div>
  );
}

function Avatar({ seed, isLight }) {
  // A simple deterministic color based on seed string
  const colors = ["bg-indigo-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-violet-500"];
  const colorIndex = String(seed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return (
    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white font-bold shadow-inner ${colors[colorIndex]}`}>
      {String(seed).substring(0, 2).toUpperCase()}
    </div>
  );
}

function EmptyState({ text, isLight = false }) {
  return <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>{text}</p>;
}

function MetricBar({ label, value, colorClass = "bg-indigo-500", isLight = false }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${isLight ? "text-slate-700" : "text-slate-200"}`}>{label}</span>
        <span className={isLight ? "text-slate-500" : "text-slate-400"}>{value.toFixed(1)}%</span>
      </div>
      <div className={`h-2 rounded-full ${isLight ? "bg-slate-200" : "bg-slate-700/70"}`}>
        <div className={`h-2 rounded-full ${colorClass}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

function PerformanceOverviewChart({ data, isLight = false, selectedLabel = null, onSelect }) {
  const width = 520;
  const height = 260;
  const leftPadding = 30;
  const rightPadding = 14;
  const topPadding = 18;
  const bottomPadding = 52;
  const innerWidth = width - leftPadding - rightPadding;
  const innerHeight = height - topPadding - bottomPadding;

  const colorByClass = {
    "bg-indigo-500": "#6366f1",
    "bg-emerald-500": "#10b981",
    "bg-rose-500": "#f43f5e",
    "bg-amber-500": "#f59e0b",
    "bg-cyan-500": "#06b6d4",
    "bg-violet-500": "#8b5cf6",
  };

  const safeData = (data ?? []).map((item) => ({
    ...item,
    value: Math.max(0, Math.min(Number(item.value) || 0, 100)),
    chartColor: colorByClass[item.color] ?? "#6366f1",
  }));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (safeData.length === 0) {
    return (
      <div className={`rounded-xl border p-4 text-sm ${isLight ? "border-slate-200 bg-white text-slate-500" : "border-slate-700 bg-slate-900/50 text-slate-400"}`}>
        No performance metrics available for charting.
      </div>
    );
  }

  const denominator = safeData.length + (safeData.length - 1) * 0.75;
  const barWidth = Math.max(28, Math.min(70, innerWidth / denominator));
  const spacing = barWidth * 0.75;
  const usedWidth = safeData.length * barWidth + (safeData.length - 1) * spacing;
  const startX = leftPadding + Math.max((innerWidth - usedWidth) / 2, 0);
  const selectedIndex = safeData.findIndex((item) => item.label === selectedLabel);
  const activeIndex = hoveredIndex ?? (selectedIndex >= 0 ? selectedIndex : 0);
  const selected = safeData[Math.min(activeIndex, safeData.length - 1)];

  const averageScore = safeData.reduce((sum, item) => sum + item.value, 0) / safeData.length;
  const strongestMetric = safeData.reduce((best, item) => (item.value > best.value ? item : best), safeData[0]);

  const points = safeData
    .map((item, index) => {
      const x = startX + index * (barWidth + spacing) + barWidth / 2;
      const y = topPadding + innerHeight - (item.value / 100) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `${points} ${startX + (safeData.length - 1) * (barWidth + spacing) + barWidth / 2},${topPadding + innerHeight} ${startX + barWidth / 2},${topPadding + innerHeight}`;

  return (
    <div className={`rounded-xl border p-3 ${isLight ? "border-slate-200 bg-white" : "border-slate-700/80 bg-slate-900/55"}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {safeData.map((item, index) => (
          <button
            key={`legend-${item.label}`}
            type="button"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            onClick={() => onSelect?.(item.label)}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] ${
              isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.chartColor }} />
            {item.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-60 w-full"
        role="img"
        aria-label="Learning performance chart"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = topPadding + innerHeight - (tick / 100) * innerHeight;
          return (
            <g key={tick}>
              <line
                x1={leftPadding}
                y1={y}
                x2={width - rightPadding}
                y2={y}
                stroke={isLight ? "#e2e8f0" : "#334155"}
                strokeDasharray="3 4"
              />
              <text
                x={6}
                y={y + 4}
                fontSize="10"
                fill={isLight ? "#64748b" : "#94a3b8"}
              >
                {tick}
              </text>
            </g>
          );
        })}

        <polygon
          points={areaPath}
          fill={isLight ? "rgba(99, 102, 241, 0.14)" : "rgba(99, 102, 241, 0.22)"}
        />

        {safeData.map((item, index) => {
          const x = startX + index * (barWidth + spacing);
          const barHeight = (item.value / 100) * innerHeight;
          const y = topPadding + innerHeight - barHeight;
          const isActive = index === activeIndex;

          return (
            <g
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => onSelect?.(item.label)}
              tabIndex={0}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="5"
                fill={item.chartColor}
                opacity={isActive ? 1 : (isLight ? 0.85 : 0.72)}
              />
              <text
                x={x + barWidth / 2}
                y={topPadding + innerHeight + 17}
                textAnchor="middle"
                fontSize="10"
                fill={isLight ? "#475569" : "#94a3b8"}
              >
                {item.label.length > 12 ? `${item.label.slice(0, 12)}...` : item.label}
              </text>
              <text
                x={x + barWidth / 2}
                y={Math.max(y - 6, topPadding + 8)}
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={isLight ? "#0f172a" : "#e2e8f0"}
              >
                {item.value.toFixed(1)}%
              </text>
            </g>
          );
        })}

        <polyline
          points={points}
          fill="none"
          stroke={isLight ? "#4f46e5" : "#818cf8"}
          strokeWidth="2.5"
        />

        {safeData.map((item, index) => {
          const x = startX + index * (barWidth + spacing) + barWidth / 2;
          const y = topPadding + innerHeight - (item.value / 100) * innerHeight;
          const isActive = index === activeIndex;
          return (
            <circle
              key={`${item.label}-dot`}
              cx={x}
              cy={y}
              r={isActive ? "5" : "3.5"}
              fill={isLight ? "#4f46e5" : "#a5b4fc"}
              onMouseEnter={() => setHoveredIndex(index)}
              onClick={() => onSelect?.(item.label)}
              style={{ cursor: "pointer" }}
            />
          );
        })}
      </svg>

      <div className={`mb-2 rounded-lg border px-3 py-2 text-xs ${isLight ? "border-indigo-100 bg-indigo-50 text-indigo-800" : "border-indigo-300/30 bg-indigo-900/30 text-indigo-100"}`}>
        Selected metric: <span className="font-semibold">{selected.label}</span> at <span className="font-semibold">{selected.value.toFixed(1)}%</span>
      </div>

      <div className={`mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2 ${isLight ? "text-slate-600" : "text-slate-300"}`}>
        <p>
          Average performance: <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{averageScore.toFixed(1)}%</span>
        </p>
        <p>
          Strongest metric: <span className={`font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>{strongestMetric.label}</span>
        </p>
      </div>
    </div>
  );
}

function SimilarLearnersChart({ entries, isLight = false, selectedUserId = null, onSelect }) {
  const safeData = (entries ?? [])
    .slice(0, 7)
    .map(([userId, similarity]) => ({
      userId: String(userId),
      label: `User ${userId}`,
      value: Math.max(0, Math.min(Number(similarity) * 100, 100)),
    }));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (safeData.length === 0) {
    return <EmptyState text="No analytics available for similar users." isLight={isLight} />;
  }

  const selectedIndex = safeData.findIndex((item) => item.userId === String(selectedUserId ?? ""));
  const activeIndex = hoveredIndex ?? (selectedIndex >= 0 ? selectedIndex : 0);

  const width = 460;
  const leftPadding = 96;
  const rightPadding = 18;
  const topPadding = 16;
  const rowHeight = 18;
  const rowGap = 12;
  const innerWidth = width - leftPadding - rightPadding;
  const innerHeight = safeData.length * rowHeight + (safeData.length - 1) * rowGap;
  const height = topPadding + innerHeight + 16;
  const selected = safeData[Math.min(activeIndex, safeData.length - 1)];

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full" role="img" aria-label="Top similar learners chart">
        {safeData.map((item, index) => {
          const y = topPadding + index * (rowHeight + rowGap);
          const fillWidth = (item.value / 100) * innerWidth;
          const isActive = index === activeIndex;

          return (
            <g
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(index)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => onSelect?.(item.userId)}
              tabIndex={0}
              style={{ cursor: "pointer" }}
            >
              <text x={10} y={y + rowHeight - 4} fontSize="11" fill={isLight ? "#334155" : "#e2e8f0"}>
                {item.label}
              </text>
              <rect
                x={leftPadding}
                y={y}
                width={innerWidth}
                height={rowHeight}
                rx="6"
                fill={isLight ? "#e2e8f0" : "#1e293b"}
              />
              <rect
                x={leftPadding}
                y={y}
                width={fillWidth}
                height={rowHeight}
                rx="6"
                fill={isActive ? "#10b981" : "#34d399"}
                opacity={isActive ? 1 : 0.82}
              />
              <text
                x={leftPadding + Math.min(fillWidth + 6, innerWidth - 10)}
                y={y + rowHeight - 4}
                fontSize="10"
                fontWeight="700"
                fill={isLight ? "#065f46" : "#d1fae5"}
              >
                {item.value.toFixed(1)}%
              </text>
            </g>
          );
        })}
      </svg>
      <div className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-emerald-400/30 bg-emerald-950/30 text-emerald-100"}`}>
        Active learner: <span className="font-semibold">{selected.label}</span> with <span className="font-semibold">{selected.value.toFixed(1)}%</span> match.
      </div>
    </div>
  );
}

function RiskCompositionChart({ weakAreas, isLight = false, selectedSegmentLabel = null, onSelect }) {
  const palette = ["#f43f5e", "#fb7185", "#e11d48", "#be123c", "#9f1239"];
  const weakCount = Math.min(weakAreas?.length ?? 0, 5);
  const stableCount = Math.max(5 - weakCount, 0);
  const segments = [
    ...(weakAreas ?? []).slice(0, 5).map((area, index) => ({
      label: area,
      value: 20,
      color: palette[index % palette.length],
      type: "risk",
    })),
    ...(stableCount > 0
      ? [
          {
            label: "Stable Skills",
            value: stableCount * 20,
            color: "#10b981",
            type: "stable",
          },
        ]
      : []),
  ];

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const selectedIndex = segments.findIndex((segment) => segment.label === selectedSegmentLabel);
  const activeIndex = hoveredIndex ?? (selectedIndex >= 0 ? selectedIndex : 0);
  const selected = segments[Math.min(activeIndex, segments.length - 1)] ?? null;

  if (segments.length === 0) {
    return <EmptyState text="No weak area risks detected yet." isLight={isLight} />;
  }

  const size = 260;
  const cx = 130;
  const cy = 130;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-56 w-56" role="img" aria-label="Risk composition donut chart">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke={isLight ? "#e2e8f0" : "#334155"} strokeWidth="22" />
        {segments.map((segment, index) => {
          const dash = (segment.value / 100) * circumference;
          const offset = cumulative;
          cumulative += dash;
          const isActive = index === activeIndex;

          return (
            <circle
              key={segment.label}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={isActive ? "26" : "22"}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => onSelect?.(segment)}
              style={{ cursor: "pointer", transition: "all 160ms ease" }}
            />
          );
        })}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="12" fill={isLight ? "#64748b" : "#cbd5e1"}>
          Focus Risk
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="24" fontWeight="700" fill={isLight ? "#0f172a" : "#f8fafc"}>
          {weakCount * 20}%
        </text>
      </svg>

      {selected ? (
        <div className={`rounded-lg border px-3 py-2 text-xs ${isLight ? "border-rose-200 bg-rose-50 text-rose-800" : "border-rose-400/30 bg-rose-950/30 text-rose-100"}`}>
          Selected slice: <span className="font-semibold">{selected.label}</span> ({selected.value.toFixed(0)}%)
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {segments.map((segment, index) => (
          <button
            key={`segment-${segment.label}`}
            type="button"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            onFocus={() => setHoveredIndex(index)}
            onBlur={() => setHoveredIndex(null)}
            onClick={() => onSelect?.(segment)}
            className={`rounded-full border px-2 py-1 text-[11px] ${
              isLight ? "border-slate-200 bg-white text-slate-700" : "border-slate-700 bg-slate-900 text-slate-300"
            }`}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
            {segment.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="8" height="8" rx="2" />
      <rect x="13" y="3" width="8" height="5" rx="2" />
      <rect x="13" y="10" width="8" height="11" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" />
    </svg>
  );
}

function RecommendationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16" />
      <path d="M4 12h10" />
      <path d="M4 17h7" />
      <path d="m15 14 2 2 4-4" />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 20V9" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20V12" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M3 12h18" />
      <path d="M3 18h18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <path d="M6 10h.01" />
      <path d="M10 10h.01" />
      <path d="M14 10h.01" />
      <path d="M18 10h.01" />
      <path d="M6 14h12" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v2" />
      <path d="M12 19v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M3 12h2" />
      <path d="M19 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function ShortcutHint({ id, text }) {
  return (
    <span id={id} className="sr-only">
      {text}
    </span>
  );
}

function App() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [similarUsers, setSimilarUsers] = useState({});
  const [weakAreas, setWeakAreas] = useState([]);
  const [evaluation, setEvaluation] = useState({
    actual_courses: [],
    predicted_courses: [],
    precision_at_5: null,
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [analyticsSelection, setAnalyticsSelection] = useState({ type: null, label: null });
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("lms-theme") ?? "dark");
  const desktopMenuRefs = useRef([]);
  const mobileMenuRefs = useRef([]);
  const isLight = theme === "light";

  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE_URL}/users`);
        setUsers(response.data ?? []);
      } catch (apiError) {
        setError("Unable to load users. Please check if backend is running.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const clearData = () => {
    setRecommendations([]);
    setSimilarUsers({});
    setWeakAreas([]);
    setEvaluation({ actual_courses: [], predicted_courses: [], precision_at_5: null });
    setAnalyticsSelection({ type: null, label: null });
  };

  const handleFetch = async () => {
    if (!selectedUser) return;

    setLoadingData(true);
    setError("");
    clearData();

    try {
      const [recommendRes, similarRes, gapRes, evaluationRes] = await Promise.all([
        axios.post(`${API_BASE_URL}/recommend/${selectedUser}`),
        axios.get(`${API_BASE_URL}/similar-users/${selectedUser}`),
        axios.get(`${API_BASE_URL}/learning-gap/${selectedUser}`),
        axios.get(`${API_BASE_URL}/evaluation/${selectedUser}`),
      ]);

      setRecommendations(recommendRes.data?.recommendations ?? []);
      setSimilarUsers(similarRes.data?.similar_users ?? recommendRes.data?.similar_users ?? {});
      setWeakAreas(gapRes.data?.weak_areas ?? recommendRes.data?.weak_areas ?? []);
      setEvaluation({
        actual_courses: evaluationRes.data?.actual_courses ?? [],
        predicted_courses: evaluationRes.data?.predicted_courses ?? [],
        precision_at_5: evaluationRes.data?.precision_at_5 ?? null,
      });
    } catch (apiError) {
      if (apiError.response?.status === 404) {
        setError("User not found. Please select a valid user.");
      } else {
        setError("Failed to fetch recommendation data. Try again.");
      }
    } finally {
      setLoadingData(false);
    }
  };

  const similarEntries = useMemo(() => Object.entries(similarUsers ?? {}), [similarUsers]);
  const topSimilarity = Number(similarEntries[0]?.[1] ?? 0);
  const topRecommendation = recommendations[0]?.course;

  const customRecommendations = useMemo(() => {
    const tips = [];
    weakAreas?.forEach((course) => {
      if (PERSONAL_TIPS[course]) {
        tips.push(`Improve ${course}: ${PERSONAL_TIPS[course]}`);
      } else {
        tips.push(`Improve ${course}: revisit fundamentals and complete one practice module.`);
      }
    });

    if (topRecommendation) {
      tips.unshift(`Start next with ${topRecommendation} to maximize learning momentum this week.`);
    }

    if (similarEntries.length > 0) {
      tips.push(`Compare your progress with User ${similarEntries[0][0]} and mirror high-performing topics.`);
    }
    return tips.slice(0, 4);
  }, [weakAreas, topRecommendation, similarEntries]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    { id: "recommendations", label: "Recommendations", icon: <RecommendationIcon /> },
    { id: "analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  ];

  const recommendationStrength = recommendations.length
    ? (recommendations.reduce((sum, item) => sum + Number(item.score), 0) / recommendations.length) * 20
    : 0;

  const analyticsBars = [
    { label: "Recommendation Strength", value: recommendationStrength, color: "bg-indigo-500" },
    { label: "Peer Match Score", value: topSimilarity * 100, color: "bg-emerald-500" },
    {
      label: "Learning Risk (Weak Areas)",
      value: Math.min((weakAreas.length / 5) * 100, 100),
      color: "bg-rose-500",
    },
  ];

  const filteredRecommendations = useMemo(() => {
    const normalizedWeakAreaSet = new Set((weakAreas ?? []).map((area) => String(area).toLowerCase()));

    if (!analyticsSelection.type || !analyticsSelection.label) {
      return recommendations.slice(0, 6);
    }

    if (analyticsSelection.type === "metric") {
      if (analyticsSelection.label === "Learning Risk (Weak Areas)") {
        return recommendations.filter((item) => normalizedWeakAreaSet.has(String(item.course).toLowerCase()));
      }
      if (analyticsSelection.label === "Recommendation Strength") {
        return [...recommendations].sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 6);
      }
      return recommendations.slice(0, 6);
    }

    if (analyticsSelection.type === "risk") {
      if (analyticsSelection.label === "Stable Skills") {
        return recommendations.filter((item) => !normalizedWeakAreaSet.has(String(item.course).toLowerCase()));
      }
      return recommendations.filter(
        (item) => String(item.course).toLowerCase() === String(analyticsSelection.label).toLowerCase()
      );
    }

    if (analyticsSelection.type === "learner") {
      return recommendations.slice(0, 4);
    }

    return recommendations.slice(0, 6);
  }, [analyticsSelection, recommendations, weakAreas]);

  const selectedLearnerMatch = useMemo(() => {
    if (analyticsSelection.type !== "learner") return null;
    const hit = similarEntries.find(([userId]) => String(userId) === String(analyticsSelection.label));
    return hit ? Number(hit[1]) * 100 : null;
  }, [analyticsSelection, similarEntries]);

  const analyticsSelectionSummary = useMemo(() => {
    if (!analyticsSelection.type || !analyticsSelection.label) {
      return "No active chart filter. Click any chart element to focus recommendations.";
    }

    if (analyticsSelection.type === "metric") {
      return `Metric focus: ${analyticsSelection.label}`;
    }

    if (analyticsSelection.type === "risk") {
      return `Risk focus: ${analyticsSelection.label}`;
    }

    if (analyticsSelection.type === "learner") {
      return selectedLearnerMatch === null
        ? `Learner focus: User ${analyticsSelection.label}`
        : `Learner focus: User ${analyticsSelection.label} (${selectedLearnerMatch.toFixed(1)}% match)`;
    }

    return "Chart filter active";
  }, [analyticsSelection, selectedLearnerMatch]);

  const handleMetricSelect = (label) => {
    setAnalyticsSelection((prev) =>
      prev.type === "metric" && prev.label === label
        ? { type: null, label: null }
        : { type: "metric", label }
    );
  };

  const handleLearnerSelect = (userId) => {
    setAnalyticsSelection((prev) =>
      prev.type === "learner" && prev.label === String(userId)
        ? { type: null, label: null }
        : { type: "learner", label: String(userId) }
    );
  };

  const handleRiskSelect = (segment) => {
    if (!segment?.label) return;
    setAnalyticsSelection((prev) =>
      prev.type === "risk" && prev.label === segment.label
        ? { type: null, label: null }
        : { type: "risk", label: segment.label }
    );
  };

  const handleMenuClick = (sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);
  };

  const handleMenuKeyDown = (event, index, refs) => {
    const lastIndex = menuItems.length - 1;
    let targetIndex = null;

    if (event.key === "ArrowDown") {
      targetIndex = index === lastIndex ? 0 : index + 1;
    } else if (event.key === "ArrowUp") {
      targetIndex = index === 0 ? lastIndex : index - 1;
    } else if (event.key === "Home") {
      targetIndex = 0;
    } else if (event.key === "End") {
      targetIndex = lastIndex;
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      refs.current[index]?.click();
      return;
    } else {
      return;
    }

    event.preventDefault();
    refs.current[targetIndex]?.focus();
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        setShowKeyboardHelp(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    localStorage.setItem("lms-theme", theme);
  }, [theme]);

  const menuBadgeById = {
    dashboard: recommendations.length || null,
    recommendations: customRecommendations.length || null,
    analytics: weakAreas.length || null,
  };

  return (
    <div
      className={`min-h-screen ${
        isLight
          ? "bg-gradient-to-br from-slate-50 via-indigo-50 to-cyan-50 text-slate-800"
          : "bg-[#070b1a] text-slate-100"
      }`}
    >
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-950/70 backdrop-blur-[3px] lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 hidden h-screen w-64 p-6 lg:block ${
          isLight
            ? "border-r border-slate-200 bg-white text-slate-800"
            : "border-r border-indigo-300/20 bg-gradient-to-b from-[#0c1227] to-[#0a1022] text-slate-100"
        }`}
      >
        <div className="mb-10">
          <p className={`text-xs uppercase tracking-[0.2em] ${isLight ? "text-indigo-500" : "text-indigo-300"}`}>Logo</p>
          <h1 className={`mt-2 text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>LMS AI</h1>
          <p className={`mt-2 text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>Smart learning dashboard</p>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeSection === item.id ? "page" : undefined}
              aria-describedby={`menu-shortcuts-${item.id}`}
              ref={(el) => {
                desktopMenuRefs.current[menuItems.findIndex((menuItem) => menuItem.id === item.id)] = el;
              }}
              onClick={() => handleMenuClick(item.id)}
              onKeyDown={(event) =>
                handleMenuKeyDown(
                  event,
                  menuItems.findIndex((menuItem) => menuItem.id === item.id),
                  desktopMenuRefs
                )
              }
              className={`group relative w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
                  : isLight
                    ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition ${
                  activeSection === item.id ? "bg-cyan-300 opacity-100" : "opacity-0 group-hover:opacity-50"
                }`}
              />
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.label}
                </span>
                {menuBadgeById[item.id] ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeSection === item.id
                        ? "bg-white/20 text-white"
                        : isLight
                          ? "bg-slate-200 text-slate-700 group-hover:bg-slate-300"
                          : "bg-slate-700 text-slate-200 group-hover:bg-slate-600"
                    }`}
                  >
                    {menuBadgeById[item.id]}
                  </span>
                ) : null}
              </span>
              <ShortcutHint
                id={`menu-shortcuts-${item.id}`}
                text="Keyboard shortcuts: Arrow Up and Arrow Down to move, Enter or Space to activate, Home and End to jump."
              />
            </button>
          ))}
        </nav>
      </aside>

      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-72 p-6 transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
          isLight
            ? "border-r border-slate-200 bg-white text-slate-800"
            : "border-r border-indigo-300/20 bg-gradient-to-b from-[#0c1227] to-[#0a1022] text-slate-100"
        }`}
      >
        <div className="mb-8 flex items-start justify-between">
          <div>
            <p className={`text-xs uppercase tracking-[0.2em] ${isLight ? "text-indigo-500" : "text-indigo-300"}`}>Logo</p>
            <h1 className={`mt-2 text-2xl font-bold ${isLight ? "text-slate-900" : "text-white"}`}>LMS AI</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className={`rounded-md p-1 transition ${
              isLight ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
            }`}
            aria-label="Close sidebar"
          >
            <CloseIcon />
          </button>
        </div>
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-current={activeSection === item.id ? "page" : undefined}
              aria-describedby={`mobile-menu-shortcuts-${item.id}`}
              ref={(el) => {
                mobileMenuRefs.current[menuItems.findIndex((menuItem) => menuItem.id === item.id)] = el;
              }}
              onClick={() => handleMenuClick(item.id)}
              onKeyDown={(event) =>
                handleMenuKeyDown(
                  event,
                  menuItems.findIndex((menuItem) => menuItem.id === item.id),
                  mobileMenuRefs
                )
              }
              className={`group relative w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 ${
                activeSection === item.id
                  ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg"
                  : isLight
                    ? "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition ${
                  activeSection === item.id ? "bg-cyan-300 opacity-100" : "opacity-0 group-hover:opacity-50"
                }`}
              />
              <span className="flex items-center justify-between gap-2">
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {menuBadgeById[item.id] ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      activeSection === item.id
                        ? "bg-white/20 text-white"
                        : isLight
                          ? "bg-slate-200 text-slate-700 group-hover:bg-slate-300"
                          : "bg-slate-700 text-slate-200 group-hover:bg-slate-600"
                    }`}
                  >
                    {menuBadgeById[item.id]}
                  </span>
                ) : null}
              </span>
              <ShortcutHint
                id={`mobile-menu-shortcuts-${item.id}`}
                text="Keyboard shortcuts: Arrow Up and Arrow Down to move, Enter or Space to activate, Home and End to jump. Press Escape to close mobile sidebar."
              />
            </button>
          ))}
        </nav>
      </aside>

      <div className="lg:ml-64">
        <header
          className={`sticky top-0 z-10 border-b backdrop-blur-xl ${
            isLight ? "border-slate-200 bg-white/85" : "border-indigo-300/20 bg-slate-950/55"
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-4 sm:px-8">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className={`rounded-lg border p-2 transition lg:hidden ${
                isLight
                  ? "border-slate-300 text-slate-700 hover:bg-slate-100"
                  : "border-slate-600 text-slate-200 hover:bg-slate-800"
              }`}
              aria-label="Open sidebar"
            >
              <HamburgerIcon />
            </button>
            <h2 className={`flex-1 text-lg font-semibold sm:text-2xl ${isLight ? "text-slate-900" : "text-slate-100"}`}>Personalized Learning Recommendation System</h2>
            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                isLight
                  ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                  : "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
              }`}
            >
              <ThemeIcon />
              {isLight ? "Dark" : "Light"}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowKeyboardHelp((prev) => !prev)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                  isLight
                    ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    : "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                }`}
                aria-haspopup="dialog"
                aria-expanded={showKeyboardHelp}
                aria-controls="keyboard-help-popover"
              >
                <KeyboardIcon />
                Keyboard Help
              </button>
              {showKeyboardHelp && (
                <div
                  id="keyboard-help-popover"
                  role="dialog"
                  aria-label="Keyboard shortcuts"
                  className={`absolute right-0 z-20 mt-2 w-72 rounded-xl border p-4 text-xs shadow-2xl ${
                    isLight
                      ? "border-slate-200 bg-white text-slate-700"
                      : "border-indigo-300/20 bg-slate-900 text-slate-200"
                  }`}
                >
                  <p className={`mb-2 text-sm font-semibold ${isLight ? "text-slate-900" : "text-slate-100"}`}>Shortcuts</p>
                  <ul className="space-y-1.5">
                    <li>
                      <span className="font-semibold">Arrow Up / Down</span>: Move between sidebar items
                    </li>
                    <li>
                      <span className="font-semibold">Home / End</span>: Jump to first or last menu item
                    </li>
                    <li>
                      <span className="font-semibold">Enter / Space</span>: Open focused section
                    </li>
                    <li>
                      <span className="font-semibold">Esc</span>: Close mobile sidebar or keyboard help
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-5 sm:p-8">
          <div
            className={`mb-6 rounded-2xl border p-5 backdrop-blur-md ${
              isLight
                ? "border-slate-200 bg-white shadow-sm"
                : "border-indigo-300/20 bg-slate-900/55 shadow-[0_12px_40px_rgba(2,6,23,0.45)]"
            }`}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full md:max-w-sm">
                <label htmlFor="user-select" className={`mb-2 block text-sm font-medium ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                  Select User ID
                </label>
                <select
                  id="user-select"
                  value={selectedUser}
                  onChange={(event) => setSelectedUser(event.target.value)}
                  disabled={loadingUsers}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition disabled:cursor-not-allowed disabled:opacity-70 ${
                    isLight
                      ? "border-slate-300 bg-white text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      : "border-slate-600 bg-slate-950/70 text-slate-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-300"
                  }`}
                >
                  <option value="">{loadingUsers ? "Loading users..." : "Choose a user"}</option>
                  {users?.map((userId) => (
                    <option key={userId} value={userId}>
                      {userId}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleFetch}
                disabled={!selectedUser || loadingData}
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingData ? "Loading..." : "Get Recommendations"}
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-rose-400/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}
          </div>

          <div
            key={activeSection}
            className="animate-[fadeSlide_260ms_ease-out] transition-all duration-300"
          >
            {activeSection === "dashboard" && (
              <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="kpi-glow rounded-2xl p-[1px]">
                  <div className="rounded-2xl border border-indigo-300/30 bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-xl">
                    <p className="text-sm text-indigo-100">Top Recommendation</p>
                    <p className="mt-2 text-lg font-semibold">{topRecommendation ?? "Not available"}</p>
                  </div>
                </div>
                <div className={`rounded-2xl border border-emerald-400/30 p-4 backdrop-blur-md ${isLight ? "bg-white shadow-sm" : "bg-slate-900/60 shadow-lg"}`}>
                  <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Similar Learners Found</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">{similarEntries.length}</p>
                </div>
                <div className={`rounded-2xl border border-rose-400/30 p-4 backdrop-blur-md ${isLight ? "bg-white shadow-sm" : "bg-slate-900/60 shadow-lg"}`}>
                  <p className={`text-sm ${isLight ? "text-slate-500" : "text-slate-400"}`}>Weak Areas Tracked</p>
                  <p className="mt-2 text-2xl font-bold text-rose-400">{weakAreas?.length ?? 0}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-3 mb-5">
                <SectionCard title="Recommendations" isLight={isLight}>
                  {recommendations.length === 0 ? (
                    <EmptyState text="No recommendations to display." isLight={isLight} />
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {recommendations.slice(0, 3).map((item) => (
                        <CourseCard 
                          key={item.course} 
                          course={item.course} 
                          score={item.score} 
                          category={item.category} 
                          difficulty={item.difficulty} 
                          isLight={isLight} 
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Similar Users" tone="success" isLight={isLight}>
                  {similarEntries.length === 0 ? (
                    <EmptyState text="No similar users found." isLight={isLight} />
                  ) : (
                    <ul className="space-y-3">
                      {similarEntries.map(([userId, similarity]) => (
                        <li
                          key={userId}
                          className={`flex items-center gap-4 rounded-xl px-4 py-3 ${isLight ? "glass-panel-light border-emerald-200" : "glass-panel border-emerald-500/30"}`}
                        >
                          <Avatar seed={userId} isLight={isLight} />
                          <div className="flex-1">
                            <span className={`block font-bold ${isLight ? "text-slate-800" : "text-slate-100"}`}>User {userId}</span>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>
                              Match
                            </span>
                          </div>
                          <ScoreRing score={Number(similarity) * 100} size={36} strokeWidth={3} isLight={isLight} />
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard title="Weak Areas" tone="warning" isLight={isLight}>
                  {weakAreas?.length === 0 ? (
                    <EmptyState text="Weak areas will appear here." isLight={isLight} />
                  ) : (
                    <ul className="space-y-2">
                      {weakAreas?.map((course) => (
                        <li
                          key={course}
                          className={`rounded-lg border px-3 py-2 text-sm font-medium ${isLight ? "border-rose-200 bg-rose-50 text-rose-700" : "border-rose-400/30 bg-rose-950/20 text-rose-300"}`}
                        >
                          {course}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SectionCard title="My Smart Plan" isLight={isLight}>
                  {customRecommendations.length === 0 ? (
                    <EmptyState text="Generate recommendations to see your custom plan." isLight={isLight} />
                  ) : (
                    <ul className="space-y-2">
                      {customRecommendations.map((tip) => (
                        <li
                          key={tip}
                          className={`rounded-lg border px-3 py-2 text-sm ${isLight ? "border-violet-200 bg-violet-50 text-violet-800" : "border-violet-300/30 bg-violet-950/25 text-violet-200"}`}
                        >
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>

                <SectionCard title="Precision@5 Evaluation" tone="success" isLight={isLight}>
                  {evaluation.precision_at_5 === null ? (
                    <EmptyState text="Evaluation appears after fetching recommendations." isLight={isLight} />
                  ) : (
                    <div className="space-y-3">
                      <div className={`rounded-lg border px-3 py-2 ${isLight ? "border-emerald-200 bg-emerald-50" : "border-emerald-400/30 bg-emerald-950/25"}`}>
                        <p className={`text-xs ${isLight ? "text-emerald-700" : "text-emerald-300"}`}>Precision@5</p>
                        <p className={`text-lg font-bold ${isLight ? "text-emerald-800" : "text-emerald-200"}`}>
                          {Number(evaluation.precision_at_5).toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className={`mb-1 text-xs font-semibold uppercase ${isLight ? "text-slate-500" : "text-slate-400"}`}>Actual Courses</p>
                        {evaluation.actual_courses.length === 0 ? (
                          <EmptyState text="No test courses for this user." isLight={isLight} />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {evaluation.actual_courses.map((course) => (
                              <span
                                key={`actual-${course}`}
                                className={`rounded-full px-2 py-1 text-xs ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-200"}`}
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={`mb-1 text-xs font-semibold uppercase ${isLight ? "text-slate-500" : "text-slate-400"}`}>Predicted Courses</p>
                        {evaluation.predicted_courses.length === 0 ? (
                          <EmptyState text="No predicted courses generated." isLight={isLight} />
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {evaluation.predicted_courses.map((course) => (
                              <span
                                key={`pred-${course}`}
                                className={`rounded-full px-2 py-1 text-xs ${isLight ? "bg-indigo-100 text-indigo-700" : "bg-indigo-900/60 text-indigo-200"}`}
                              >
                                {course}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>
              </>
            )}

            {activeSection === "recommendations" && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <SectionCard title="Recommended Course Ranking" isLight={isLight}>
                  {recommendations.length === 0 ? (
                    <EmptyState text="No recommendations yet. Choose a user and click Get Recommendations." isLight={isLight} />
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {recommendations.map((item, index) => (
                        <div key={item.course} className="relative mt-2 ml-2">
                          <div className={`absolute -left-3 -top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-lg ${isLight ? "bg-indigo-600 text-white" : "bg-indigo-500 text-white"}`}>
                            {index + 1}
                          </div>
                          <CourseCard 
                            course={item.course} 
                            score={item.score} 
                            category={item.category} 
                            difficulty={item.difficulty} 
                            isLight={isLight} 
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Personalized Action Plan" tone="success" isLight={isLight}>
                  {customRecommendations.length === 0 ? (
                    <EmptyState text="Your custom action plan will appear here." isLight={isLight} />
                  ) : (
                    <ul className="space-y-3">
                      {customRecommendations.map((tip, index) => (
                        <li
                          key={tip}
                          className={`rounded-lg border px-3 py-2 text-sm ${isLight ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-emerald-400/30 bg-emerald-950/25 text-emerald-200"}`}
                        >
                          <span className="mr-2 font-semibold">Step {index + 1}:</span>
                          {tip}
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </div>
            )}

            {activeSection === "analytics" && (
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
                <SectionCard title="Top Similar Learners" tone="success" isLight={isLight} className="xl:col-span-2">
                  <SimilarLearnersChart
                    entries={similarEntries}
                    isLight={isLight}
                    selectedUserId={analyticsSelection.type === "learner" ? analyticsSelection.label : null}
                    onSelect={handleLearnerSelect}
                  />
                </SectionCard>

                <SectionCard title="Risk Focus Areas" tone="warning" isLight={isLight} className="xl:col-span-2">
                  <RiskCompositionChart
                    weakAreas={weakAreas}
                    isLight={isLight}
                    selectedSegmentLabel={analyticsSelection.type === "risk" ? analyticsSelection.label : null}
                    onSelect={handleRiskSelect}
                  />
                </SectionCard>

                <SectionCard title="Learning Performance Overview" isLight={isLight} className="xl:col-span-4">
                  <div className="space-y-4">
                    <PerformanceOverviewChart
                      data={analyticsBars}
                      isLight={isLight}
                      selectedLabel={analyticsSelection.type === "metric" ? analyticsSelection.label : null}
                      onSelect={handleMetricSelect}
                    />
                    {analyticsBars.map((item) => (
                      <MetricBar key={item.label} label={item.label} value={item.value} colorClass={item.color} isLight={isLight} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Interactive Filter Results" isLight={isLight} className="xl:col-span-4">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className={`text-sm ${isLight ? "text-slate-700" : "text-slate-200"}`}>{analyticsSelectionSummary}</p>
                    <button
                      type="button"
                      onClick={() => setAnalyticsSelection({ type: null, label: null })}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        isLight
                          ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          : "border-slate-600 bg-slate-900/70 text-slate-200 hover:bg-slate-800"
                      }`}
                    >
                      Clear Filter
                    </button>
                  </div>

                  {filteredRecommendations.length === 0 ? (
                    <EmptyState
                      text="No recommendations match the active chart selection yet. Try another chart segment."
                      isLight={isLight}
                    />
                  ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {filteredRecommendations.map((item) => (
                        <CourseCard
                          key={`analytics-${item.course}`}
                          course={item.course}
                          score={item.score}
                          category={item.category}
                          difficulty={item.difficulty}
                          isLight={isLight}
                        />
                      ))}
                    </div>
                  )}
                </SectionCard>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
