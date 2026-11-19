import { useEffect, useState } from "react";
import { api } from "./api";
import "./App.css";

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState(null);
  const [health, setHealth] = useState("checking...");

  useEffect(() => {
    api.health().then((h) => setHealth(h.status)).catch((e) => setHealth("down"));
    api.list().then(setTodos).catch((e) => setError(e.message));
  }, []);

  async function addTodo(e) {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const t = await api.create(text.trim());
      setTodos([...todos, t]);
      setText("");
    } catch (e) { setError(e.message); }
  }

  async function toggle(todo) {
    try {
      const t = await api.update(todo.id, { completed: !todo.completed });
      setTodos(todos.map((x) => (x.id === t.id ? t : x)));
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    try {
      await api.remove(id);
      setTodos(todos.filter((x) => x.id !== id));
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="container">
      <h1>Todo App</h1>
      <p className="status">API: {health}</p>
      {error && <p className="error">{error}</p>}
      <form onSubmit={addTodo}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="New todo..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {todos.map((t) => (
          <li key={t.id} className={t.completed ? "done" : ""}>
            <input type="checkbox" checked={t.completed} onChange={() => toggle(t)} />
            <span>{t.text}</span>
            <button onClick={() => remove(t.id)}>x</button>
          </li>
        ))}
      </ul>
    </div>
  );
}