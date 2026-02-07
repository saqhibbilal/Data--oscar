import express from "express";
import { tasksRouter } from "./routes/tasks";
import { submitRouter } from "./routes/submit";
import { getDb } from "./db";

const app = express();
app.use(express.json());

app.use("/tasks", tasksRouter);
app.use("/", submitRouter);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

getDb(); // ensure DB and tables exist

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
