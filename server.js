import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { resolveIntent } from "./intentResolver.js";
import { executeAction } from "./actions.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.post("/intent", async (req, res) => {
  try {
    const resolved = await resolveIntent(req.body);

    if (resolved.status === "ambiguous") {
      return res.json(resolved);
    }

    const result = await executeAction(
      resolved.action,
      resolved.parameters
    );

    res.json({
      status: "success",
      action: resolved.action,
      parameters: resolved.parameters,
      result,
      confidence: resolved.confidence,
      explanation: resolved.explanation
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message
    });
  }
});

app.listen(3000, () => {
  console.log("🚀 IBAPI-LLM running on http://localhost:3000");
});