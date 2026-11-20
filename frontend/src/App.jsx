import { Component, useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import "./App.css";

/* ───────────────────────── constants ───────────────────────── */
const FILTERS = [
  { id: "all", label: "all" },
  { id: "active", label: "active" },
  { id: "done", label: "done" },
];

const LEAVE_MS = 180;

const EMPTY_COPY = {
  all: { title: "nothing here yet", body: "drop your first task above and start shipping." },
  active: { title: "inbox zero. you're cracked.", body: "no active tasks. go touch grass." },
  done: { title: "nothing done yet", body: "finish something and it'll show up here. lock in." },
};

/* ───────────────────────── icons (inline SVG) ───────────────────────── */
const Svg = ({ children, size = 18, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

const SunIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);
const MoonIcon = () => (
  <Svg>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
);
const ArrowIcon = () => (
  <Svg size={16}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
);
const TrashIcon = () => (
  <Svg size={16}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v5M14 11v5" />
  </Svg>
);
const CloseIcon = () => (
  <Svg size={16}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);
const AlertIcon = () => (
  <Svg size={18}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </Svg>
);

/* ───────────────────────── theme ───────────────────────── */
function getInitialTheme() {
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage blocked — fall through */
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#06060b" : "#f5f5fb");
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      try {
        localStorage.setItem("theme", next);
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { theme, toggle };
}

/* ───────────────────────── helpers ───────────────────────── */
function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "up late?";
  if (h < 12) return "mornin";
  if (h < 18) return "hey";
  return "evening";
}

function readableError(err) {
  const msg = (err && err.message) || "something broke";
  return msg.length > 140 ? `${msg.slice(0, 137)}…` : msg;
}

let tempCounter = 0;
const makeTempId = () => `tmp-${Date.now()}-${tempCounter++}`;

/* ───────────────────────── error boundary ───────────────────────── */
class ErrorBoundary extends Component {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error, info) {
    console.error("UI crashed:", error, info);
  }

  render() {
    if (this.state.crashed) {
      return (
        <main className="shell">
          <div className="card crash" role="alert">
            <p className="eyebrow">~/error</p>
            <h1 className="crash-title">well, that broke.</h1>
            <p className="muted">the UI hit an unexpected error. your tasks are safe on the server.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              reload
            </button>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}

/* ───────────────────────── small components ───────────────────────── */
function Toast({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="toast" role="alert">
      <span className="toast-icon">
        <AlertIcon />
      </span>
      <span className="toast-msg">{error.message}</span>
      {error.retry && (
        <button
          className="toast-btn"
          onClick={() => {
            const retry = error.retry;
            onDismiss();
            retry();
          }}
        >
          retry
        </button>
      )}
      <button className="icon-btn toast-close" onClick={onDismiss} aria-label="Dismiss error">
        <CloseIcon />
      </button>
    </div>
  );
}

function ApiStatus({ status }) {
  const label = status === "ok" ? "api online" : status === "down" ? "api offline" : "checking api";
  return (
    <span className={`pill pill-${status}`} role="status" aria-live="polite">
      <span className="dot" aria-hidden="true" />
      {label}
    </span>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="icon-btn theme-btn"
      onClick={onToggle}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function Skeleton() {
  const widths = ["72%", "54%", "81%", "46%"];
  return (
    <ul className="list" aria-busy="true" aria-label="Loading tasks">
      {widths.map((w, i) => (
        <li className="skeleton-row" key={i}>
          <span className="skeleton skeleton-box" />
          <span className="skeleton skeleton-line" style={{ width: w }} />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ filter }) {
  const copy = EMPTY_COPY[filter];
  return (
    <div className="empty">
      <svg className="empty-art" width="84" height="84" viewBox="0 0 84 84" fill="none" aria-hidden="true">
        <rect x="6" y="14" width="72" height="56" rx="12" fill="var(--card-2)" stroke="var(--border-strong)" />
        <circle cx="18" cy="26" r="2.5" fill="var(--danger)" />
        <circle cx="27" cy="26" r="2.5" fill="var(--accent-2)" />
        <circle cx="36" cy="26" r="2.5" fill="var(--ok)" />
        <path d="M6 35h72" stroke="var(--border)" />
        <path d="M19 47l9 7-9 7" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect className="cursor" x="35" y="58" width="14" height="3.5" rx="1.75" fill="var(--accent-2)" />
      </svg>
      <p className="empty-title">{copy.title}</p>
      <p className="empty-body">{copy.body}</p>
    </div>
  );
}

function TodoRow({ todo, onToggle, onRemove }) {
  const inputId = `todo-${todo.id}`;
  const cls = ["row", todo.completed && "is-done", todo.leaving && "is-leaving", todo.pending && "is-pending"]
    .filter(Boolean)
    .join(" ");

  return (
    <li className={cls}>
      <div className="row-inner">
        <input
          id={inputId}
          className="check"
          type="checkbox"
          checked={todo.completed}
          disabled={todo.pending || todo.leaving}
          onChange={() => onToggle(todo)}
        />
        <label className="row-text" htmlFor={inputId}>
          {todo.text}
        </label>
        <button
          className="icon-btn danger row-delete"
          onClick={() => onRemove(todo)}
          disabled={todo.pending || todo.leaving}
          aria-label={`Delete todo: ${todo.text}`}
          title="Delete"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  );
}

/* ───────────────────────── main app ───────────────────────── */
function TodoApp() {
  const { theme, toggle: toggleTheme } = useTheme();

  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState(null);
  const [health, setHealth] = useState("checking");
  const inputRef = useRef(null);

  const showError = useCallback((err, retry) => {
    setError({ message: readableError(err), retry });
  }, []);

  /* initial load */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.list();
      setTodos(Array.isArray(list) ? list : []);
      setError(null);
    } catch (err) {
      showError(err, () => load());
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  /* api health, re-checked every 30s */
  useEffect(() => {
    let alive = true;
    const check = () =>
      api
        .health()
        .then((h) => alive && setHealth(h && h.status === "ok" ? "ok" : "down"))
        .catch(() => alive && setHealth("down"));
    check();
    const id = setInterval(check, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  /* "/" focuses the input */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ── optimistic actions ── */
  const createTodo = useCallback(
    async (value) => {
      const tempId = makeTempId();
      setTodos((prev) => [...prev, { id: tempId, text: value, completed: false, pending: true }]);
      try {
        const created = await api.create(value);
        setTodos((prev) => prev.map((t) => (t.id === tempId ? created : t)));
      } catch (err) {
        setTodos((prev) => prev.filter((t) => t.id !== tempId));
        showError(err, () => createTodo(value));
      }
    },
    [showError]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText("");
    setFilter((f) => (f === "done" ? "all" : f));
    createTodo(value);
  };

  const toggleTodo = useCallback(
    async (todo) => {
      const next = !todo.completed;
      setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: next } : t)));
      try {
        await api.update(todo.id, { completed: next });
      } catch (err) {
        setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, completed: !next } : t)));
        showError(err, () => toggleTodo(todo));
      }
    },
    [showError]
  );

  const removeTodo = useCallback(
    async (todo) => {
      let index = -1;
      setTodos((prev) => {
        index = prev.findIndex((t) => t.id === todo.id);
        return prev.map((t) => (t.id === todo.id ? { ...t, leaving: true } : t));
      });
      // after the collapse animation, drop it from state (unless the request failed and we rolled back)
      setTimeout(() => {
        setTodos((prev) => prev.filter((t) => !(t.id === todo.id && t.leaving)));
      }, LEAVE_MS);

      try {
        await api.remove(todo.id);
      } catch (err) {
        setTodos((prev) => {
          if (prev.some((t) => t.id === todo.id)) {
            return prev.map((t) => (t.id === todo.id ? { ...t, leaving: false } : t));
          }
          const copy = [...prev];
          copy.splice(Math.min(Math.max(index, 0), copy.length), 0, { ...todo, leaving: false });
          return copy;
        });
        showError(err, () => removeTodo(todo));
      }
    },
    [showError]
  );

  const clearCompleted = useCallback(async () => {
    const targets = todos.filter((t) => t.completed && !t.pending && !t.leaving);
    if (targets.length === 0) return;
    const ids = new Set(targets.map((t) => t.id));

    setTodos((prev) => prev.map((t) => (ids.has(t.id) ? { ...t, leaving: true } : t)));
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !(ids.has(t.id) && t.leaving)));
    }, LEAVE_MS);

    const results = await Promise.allSettled(targets.map((t) => api.remove(t.id)));
    const failed = targets.filter((_, i) => results[i].status === "rejected");
    if (failed.length > 0) {
      const failedIds = new Set(failed.map((t) => t.id));
      setTodos((prev) => {
        const present = new Set(prev.map((t) => t.id));
        const restored = prev.map((t) => (failedIds.has(t.id) ? { ...t, leaving: false } : t));
        failed.forEach((t) => {
          if (!present.has(t.id)) restored.push({ ...t, leaving: false });
        });
        return restored;
      });
      showError(
        new Error(`couldn't clear ${failed.length} ${failed.length === 1 ? "task" : "tasks"}`),
        () => clearCompleted()
      );
    }
  }, [todos, showError]);

  /* ── derived state ── */
  const live = todos.filter((t) => !t.leaving);
  const total = live.length;
  const doneCount = live.filter((t) => t.completed).length;
  const activeCount = total - doneCount;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;

  const counts = { all: total, active: activeCount, done: doneCount };
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.completed : t.completed
  );
  const showEmpty = !loading && visible.filter((t) => !t.leaving).length === 0;

  return (
    <main className="shell">
      <Toast error={error} onDismiss={() => setError(null)} />

      {/* This wrapper keeps the title and name perfectly centered together */}
      <div className="heading-group">
        <h1 className="app-title">tasks.exe</h1>
      </div>

      <section className="card" aria-labelledby="app-title">
      <header className="header">
        <div className="header-top">
          <div className="header-actions">
            <ApiStatus status={health} />
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        <h1 id="app-title" className="title">
          {greeting()}, <span className="grad">builder</span>
        </h1>
          <p className="subtitle">
            {loading
              ? "booting up your tasks…"
              : total === 0
              ? "clean slate. what are we shipping?"
              : `${activeCount} to ship · ${doneCount} shipped`}
          </p>

          <div
            className="progress"
            role="progressbar"
            aria-label="Completed tasks"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
          >
            <span className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="progress-label" aria-hidden="true">
            {pct}% complete
          </p>
        </header>

        <form className="composer" onSubmit={handleSubmit}>
          <span className="prompt" aria-hidden="true">
            &gt;
          </span>
          <label htmlFor="new-todo" className="sr-only">
            New todo
          </label>
          <input
            id="new-todo"
            ref={inputRef}
            className="composer-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setText("");
                e.currentTarget.blur();
              }
            }}
            placeholder="add a task…"
            autoComplete="off"
            maxLength={200}
          />
          <kbd className="kbd" aria-hidden="true">
            /
          </kbd>
          <button className="btn btn-primary" type="submit" disabled={!text.trim()}>
            <span>add</span>
            <ArrowIcon />
          </button>
        </form>

        <div className="toolbar">
          <div className="seg" role="group" aria-label="Filter todos">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`seg-btn ${filter === f.id ? "is-active" : ""}`}
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
              >
                {f.label}
                <span className="count">{counts[f.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Skeleton />
        ) : showEmpty ? (
          <EmptyState filter={filter} />
        ) : (
          <ul className="list">
            {visible.map((t) => (
              <TodoRow key={t.id} todo={t} onToggle={toggleTodo} onRemove={removeTodo} />
            ))}
          </ul>
        )}

        {!loading && total > 0 && (
          <footer className="footer">
            <span className="footer-count">
              <strong>{activeCount}</strong> {activeCount === 1 ? "item" : "items"} left
            </span>
            <button className="text-btn" onClick={clearCompleted} disabled={doneCount === 0}>
              clear completed
            </button>
          </footer>
        )}
      </section>

      <p className="credit">
        press <kbd className="kbd">/</kbd> to focus · <kbd className="kbd">esc</kbd> to clear
      </p>
      <p className="author">built by Lakshaya Sharma</p>
    </main>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TodoApp />
    </ErrorBoundary>
  );
}