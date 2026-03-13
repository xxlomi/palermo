import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import cors from "cors";
import { promisify } from "util";
import fs from "fs";
import { pipeline } from "stream/promises";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YTDLP_PATH = path.join(process.cwd(), "yt-dlp");
const YTDLP_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp";

async function downloadYtDlp() {
  if (fs.existsSync(YTDLP_PATH)) {
    console.log("yt-dlp binary already exists.");
    return;
  }

  console.log("Downloading yt-dlp binary from GitHub...");
  try {
    const response = await fetch(YTDLP_URL);
    if (!response.ok) throw new Error(`Failed to download yt-dlp: ${response.statusText}`);
    
    const fileStream = fs.createWriteStream(YTDLP_PATH);
    // @ts-ignore - fetch body is a ReadableStream in Node 18+
    await pipeline(response.body, fileStream);
    
    fs.chmodSync(YTDLP_PATH, 0o755);
    console.log("yt-dlp binary downloaded and made executable.");
  } catch (error) {
    console.error("Error downloading yt-dlp:", error);
    throw error;
  }
}

async function startServer() {
  await downloadYtDlp();

  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to get video info
  app.post("/api/info", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Fetching info for: ${url} using yt-dlp`);
      // Use the downloaded yt-dlp binary with aggressive flags to bypass bot detection
      // The 'tv' client is often the most successful at bypassing bot checks in cloud environments
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";
      const command = `${YTDLP_PATH} --dump-single-json --no-check-certificates --user-agent "${userAgent}" --extractor-args "youtube:player_client=tv,android,ios" --no-cache-dir --force-ipv4 "${url}"`;
      
      const { stdout, stderr } = await execPromise(command);
      
      if (stderr) {
        console.warn("yt-dlp stderr:", stderr);
      }

      if (!stdout || stdout.trim() === "") {
        throw new Error("yt-dlp returned empty output. The video might be restricted or the URL is invalid.");
      }

      const info = JSON.parse(stdout);
      
      // Map yt-dlp info to the format expected by the frontend
      const mappedInfo = {
        title: info.title,
        thumbnail: info.thumbnail,
        duration_string: info.duration_string || (info.duration ? new Date(info.duration * 1000).toISOString().substr(11, 8) : "N/A"),
        webpage_url: info.webpage_url,
        id: info.id,
        formats: info.formats.map((f: any) => ({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || f.format_note || "N/A",
          fps: f.fps || 0,
          filesize: f.filesize || f.filesize_approx || 0,
          vcodec: f.vcodec || "none",
          acodec: f.acodec || "none",
          url: f.url,
          format_note: f.format_note || f.resolution
        }))
      };
      
      res.json(mappedInfo);
    } catch (error: any) {
      console.error("yt-dlp error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch video info" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
