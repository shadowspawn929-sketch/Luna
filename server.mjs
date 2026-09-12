import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    // Build image stream URL with zero token requirements
    const formattedPrompt = encodeURIComponent(`masterpiece, best quality, highly detailed anime visual style, ${message}`);
    const imageUrl = `https://image.pollinations.ai/prompt/${formattedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    return res.json({
      imageUrl: imageUrl
    });

  } catch (error) {
    console.error("NEXA generation error:", error);
    res.status(500).json({
      error: "NEXA could not process your image request."
    });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`NEXA AI Image Generator running on port ${PORT}`);
});
