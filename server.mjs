import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "NEXA AI Image Generator is running",
    geminiKeyConfigured: Boolean(process.env.GEMINI_API_KEY)
  });
});

// Image generation
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Check prompt
    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please enter an image prompt."
      });
    }

    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured on the server."
      });
    }

    // Send request to Gemini
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          model: "gemini-3.1-flash-image",
          input: message,
          response_format: {
            type: "image",
            mime_type: "image/jpeg",
            aspect_ratio: "1:1",
            image_size: "1K"
          }
        })
      }
    );

    const data = await response.json();

    // Gemini API error
    if (!response.ok) {
      console.error("Gemini API response:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API request failed."
      });
    }

    // Try the convenience output_image field first
    let image = data.output_image;

    // If not available, search through the steps
    if (!image?.data) {
      for (const step of data.steps || []) {
        for (const block of step.content || []) {
          if (block.type === "image" && block.data) {
            image = block;
            break;
          }
        }

        if (image?.data) {
          break;
        }
      }
    }

    // No image found
    if (!image?.data) {
      console.error("Gemini returned no image:", data);

      return res.status(500).json({
        error: "Gemini did not return an image."
      });
    }

    // Send image back to NEXA frontend
    return res.json({
      imageUrl: `data:${image.mime_type || "image/jpeg"};base64,${image.data}`
    });

  } catch (error) {
    console.error("NEXA Gemini error:", error);

    return res.status(500).json({
      error:
        error?.message ||
        "NEXA could not generate the image."
    });
  }
});

// Serve NEXA frontend
app.get("/{*splat}", (req, res) => {
  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `NEXA AI Image Generator running on port ${PORT}`
  );
});