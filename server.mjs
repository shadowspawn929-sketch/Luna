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

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NEXA AI Image Generator is running"
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

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: message,
      config: {
        responseModalities: ["IMAGE"],
        responseFormat: {
          image: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      }
    });

    const parts = response.candidates?.[0]?.content?.parts || [];

    for (const part of parts) {
      if (part.inlineData?.data) {
        return res.json({
          imageUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`
        });
      }
    }

    console.error("Gemini response contained no image:", response);

    return res.status(500).json({
      error: "Gemini did not return an image."
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