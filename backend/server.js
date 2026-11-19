const express = require("express");
const cors = require("cors");
const path = require("path");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const app = express();
const PORT = process.env.PORT || 3000;
const TABLE = process.env.TABLE_NAME || "todos";
const REGION = process.env.AWS_REGION || "ap-south-1";
const USE_MEMORY = process.env.USE_MEMORY === "1";

app.use(cors());
app.use(express.json());

const ddb = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(ddb, {
  marshallOptions: { removeUndefinedValues: true },
});

let memStore = [];

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), table: TABLE, mode: USE_MEMORY ? "memory" : "dynamodb" });
});

app.get("/api/todos", async (req, res) => {
  if (USE_MEMORY) return res.json(memStore);
  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE }));
    res.json(result.Items || []);
  } catch (err) {
    console.error("Scan error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/todos", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  const todo = { id: Date.now().toString(), text, completed: false, createdAt: new Date().toISOString() };
  if (USE_MEMORY) {
    memStore.push(todo);
    return res.status(201).json(todo);
  }
  try {
    await docClient.send(new PutCommand({ TableName: TABLE, Item: todo }));
    res.status(201).json(todo);
  } catch (err) {
    console.error("Put error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  if (USE_MEMORY) {
    const todo = memStore.find((t) => t.id === id);
    if (!todo) return res.status(404).json({ error: "not found" });
    if (typeof req.body.completed === "boolean") todo.completed = req.body.completed;
    if (typeof req.body.text === "string") todo.text = req.body.text;
    return res.json(todo);
  }
  try {
    const updates = [];
    const values = {};
    const names = {};
    if (typeof req.body.completed === "boolean") {
      updates.push("#c = :c"); names["#c"] = "completed"; values[":c"] = req.body.completed;
    }
    if (typeof req.body.text === "string") {
      updates.push("#t = :t"); names["#t"] = "text"; values[":t"] = req.body.text;
    }
    if (updates.length === 0) return res.status(400).json({ error: "no fields" });
    const result = await docClient.send(new UpdateCommand({
      TableName: TABLE, Key: { id },
      UpdateExpression: "SET " + updates.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    }));
    res.json(result.Attributes);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  const { id } = req.params;
  if (USE_MEMORY) {
    const before = memStore.length;
    memStore = memStore.filter((t) => t.id !== id);
    if (memStore.length === before) return res.status(404).json({ error: "not found" });
    return res.status(204).send();
  }
  try {
    const existing = await docClient.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (!existing.Item) return res.status(404).json({ error: "not found" });
    await docClient.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    res.status(204).send();
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ error: err.message });
  }
});

const frontendPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendPath));
app.get("/{*splat}", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendPath, "index.html"), (err) => { if (err) next(); });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}, table=${TABLE}, mode=${USE_MEMORY ? "MEMORY" : "DYNAMODB"}`);
});