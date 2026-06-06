import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/generate", async (req, res) => {
  const { text, voiceId, modelId, languageCode } = req.body;

  if (!text || !voiceId) {
    return res.status(400).json({ error: "text and voiceId are required" });
  }

  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY not set on server" });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId || "eleven_v3",
          language_code: languageCode || "en",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.4,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err?.detail?.message || `ElevenLabs error ${response.status}`,
      });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "attachment; filename=voiceover.mp3");
    response.body.pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate audio" });
  }
});

app.listen(PORT, () => {
  console.log(`VoiceForge running at http://localhost:${PORT}`);
});
