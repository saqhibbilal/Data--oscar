import { Router, Request, Response } from "express";
import * as fs from "fs";
import * as path from "path";

export const uploadRouter = Router();
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");

uploadRouter.post("/", (req: Request, res: Response) => {
  try {
    const { file: base64, filename: suggestedName } = req.body as {
      file?: string;
      filename?: string;
    };
    if (!base64 || typeof base64 !== "string") {
      res.status(400).json({ error: "file (base64) required" });
      return;
    }
    const buffer = Buffer.from(base64, "base64");
    const ext = path.extname(suggestedName || "") || ".bin";
    const safeName = (suggestedName || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
    const name = `${Date.now()}-${safeName}`.slice(0, 80) + ext;
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    const filePath = path.join(UPLOADS_DIR, name);
    fs.writeFileSync(filePath, buffer);
    res.status(201).json({ url: `/uploads/${name}` });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});
