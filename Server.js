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

app.use(express.json({ limit: "1mb" }));

// Serve the website
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NEXA AI is running"
  });
});

// Chat endpoint
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
        error: "OPENAI_API_KEY is missing from Render."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const previousMessages = Array.isArray(history)
      ? history
          .filter(
            (item) =>
              item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string"
          )
          .slice(-20)
      : [];

    const input = [
      ...previousMessages,
      {
        role: "user",
        content: message
      }
    ];

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-5.6-luna",

      instructions:
        "You are NEXA, a helpful general-purpose AI assistant. " +
        "Give clear, useful and honest answers. " +
        "Keep responses age-appropriate. " +
        "Do not provide sexual content involving minors or help with dangerous or illegal activities.",

      input: input
    });

    const reply =
      response.output_text || "Sorry, I couldn't generate a response.";

    res.json({
      reply: reply
    });

  } catch (error) {
    console.error("NEXA ERROR:", error);

    res.status(500).json({
      error: "NEXA could not process your request."
    });
  }
});

// Send all other routes to the frontend
app.get("/{*splat}", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXA AI running on port ${PORT}`);
});
