import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing from the environment.");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NEXA AI Image Generator is running",
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter an image prompt."
      });
    }

    const interaction = await ai.interactions.create({
      model: "gemini-3.1-flash-image",
      input: message
    });

    const generatedImage = interaction.output_image;

    if (!generatedImage || !generatedImage.data) {
      console.error("Gemini returned no image:", interaction);

      return res.status(500).json({
        error: "Gemini did not return an image."
      });
    }

    return res.json({
      imageUrl: `data:image/png;base64,${generatedImage.data}`
    });

  } catch (error) {
    console.error("NEXA Gemini error:", error);

    return res.status(500).json({
      error: error?.message || "NEXA could not generate the image."
    });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXA AI Image Generator running on port ${PORT}`);
});