import express from "express";
import path from "path";
import { tasksRouter } from "./routes/tasks";
import { submitRouter } from "./routes/submit";
import { labelerRouter } from "./routes/labeler";
import { uploadRouter } from "./routes/upload";
import { getDb } from "./db";

const app = express();

// CORS: allow frontend (Vite default port)
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (_req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

app.use("/tasks", tasksRouter);
app.use("/labeler", labelerRouter);
app.use("/upload", uploadRouter);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
app.use("/", submitRouter);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

getDb(); // ensure DB and tables exist

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
