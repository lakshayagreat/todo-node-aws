const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory store (temporary — DynamoDB comes later)
let todos = [];

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Get all todos
app.get("/api/todos", (req, res) => {
  res.json(todos);
});

// Create todo
app.post("/api/todos", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  const todo = { id: Date.now().toString(), text, completed: false };
  todos.push(todo);
  res.status(201).json(todo);
});

// Update todo
app.patch("/api/todos/:id", (req, res) => {
  const todo = todos.find((t) => t.id === req.params.id);
  if (!todo) return res.status(404).json({ error: "not found" });
  if (typeof req.body.completed === "boolean") todo.completed = req.body.completed;
  if (typeof req.body.text === "string") todo.text = req.body.text;
  res.json(todo);
});

// Delete todo
app.delete("/api/todos/:id", (req, res) => {
  const before = todos.length;
  todos = todos.filter((t) => t.id !== req.params.id);
  if (todos.length === before) return res.status(404).json({ error: "not found" });
  res.status(204).send();
});

// Serve frontend production build (used later in Docker)
const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));

// SPA fallback (must be AFTER api routes)
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendPath, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});