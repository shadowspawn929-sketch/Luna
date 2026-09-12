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
    message: "Alucard AI Free Image Generator is running"
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

    const hfToken = process.env.HF_TOKEN;
    if (!hfToken) {
      return res.status(500).json({
        error: "HF_TOKEN is missing in Render environment variables."
      });
    }

    // Master prompt tuning for detailed anime style
    const fullPrompt = `${message}, masterpiece, best quality, highly detailed anime visual style, vibrant background`;

    // Free anime model endpoint on Hugging Face
    const hfUrl = "https://api-inference.huggingface.co/models/cagliostrolab/animagine-xl-3.1";

    const response = await fetch(hfUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json",
        "x-use-cache": "false"
      },
      body: JSON.stringify({
        inputs: fullPrompt
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Handle model loading warm-up phase
      if (response.status === 503) {
        return res.status(503).json({
          error: "Model is waking up! Please try sending your request again in 20 seconds."
        });
      }

      return res.status(response.status).json({
        error: errorData?.error || "Hugging Face failed to generate image."
      });
    }

    // Convert raw binary image buffer into a base64 Data URL for display
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`;

    return res.json({
      imageUrl: imageDataUrl
    });

  } catch (error) {
    console.error("Alucard generation error:", error);
    res.status(500).json({
      error: "Alucard could not process your image request."
    });
  }
});

app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Alucard AI Image Generator running on port ${PORT}`);
});
