import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY is not set.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    message: "NEXA AI server is running"
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter a message."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured on the server."
      });
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter(item =>
            item &&
            (item.role === "user" || item.role === "assistant") &&
            typeof item.content === "string"
          )
          .slice(-20)
      : [];

    const input = [
      ...safeHistory.map(item => ({
        role: item.role,
        content: item.content
      })),
      {
        role: "user",
        content: message
      }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",
      instructions:
        "You are NEXA, a helpful general-purpose AI assistant. " +
        "Be clear, useful, honest, and age-appropriate. " +
        "Do not provide sexual content involving minors or help users access dangerous or illegal activities.",
      input
    });

    res.json({
      reply: response.output_text || "I couldn't generate a response."
    });

  } catch (error) {
    console.error("AI error:", error);

    res.status(500).json({
      error: "The AI request failed. Check the Render logs for details."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`NEXA AI running on port ${PORT}`);
});
