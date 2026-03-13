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

const LUX_PATH = path.join(process.cwd(), "lux");
const LUX_URL = "https://github.com/iawia002/lux/releases/download/v0.24.0/lux_0.24.0_Linux_64-bit.tar.gz";

async function downloadLux() {
  if (fs.existsSync(LUX_PATH)) {
    console.log("lux binary already exists.");
    return;
  }

  console.log("Downloading lux binary from GitHub...");
  const tempTarPath = path.join(process.cwd(), "lux.tar.gz");
  try {
    const response = await fetch(LUX_URL);
    if (!response.ok) throw new Error(`Failed to download lux: ${response.statusText}`);
    
    const fileStream = fs.createWriteStream(tempTarPath);
    // @ts-ignore
    await pipeline(response.body, fileStream);
    
    console.log("Extracting lux...");
    await execPromise(`tar -xzf ${tempTarPath} lux`);
    fs.chmodSync(LUX_PATH, 0o755);
    fs.unlinkSync(tempTarPath);
    console.log("lux binary downloaded and extracted.");
  } catch (error) {
    console.error("Error downloading lux:", error);
    if (fs.existsSync(tempTarPath)) fs.unlinkSync(tempTarPath);
    throw error;
  }
}

async function startServer() {
  await downloadLux();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // API Route to get video info
  app.post("/api/info", async (req, res) => {
    const { url, cookies } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let cookieFile: string | null = null;

    try {
      console.log(`Fetching info for: ${url} using lux`);
      let luxCommand = `${LUX_PATH} -j`;
      
      if (cookies && cookies.trim() !== "") {
        cookieFile = path.join(process.cwd(), `cookies_lux_${Date.now()}.txt`);
        fs.writeFileSync(cookieFile, cookies);
        luxCommand += ` -c "${cookieFile}"`;
      }
      
      luxCommand += ` "${url}"`;
      const { stdout } = await execPromise(luxCommand);
      const luxInfo = JSON.parse(stdout)[0]; // lux returns an array

      const mappedInfo = {
        title: luxInfo.title,
        thumbnail: "", // lux doesn't always provide thumbnail in JSON
        duration_string: "N/A",
        webpage_url: url,
        id: url,
        formats: Object.entries(luxInfo.streams || {}).map(([id, stream]: [string, any]) => ({
          format_id: id,
          ext: stream.extension,
          resolution: stream.quality,
          fps: 0,
          filesize: stream.size,
          vcodec: "unknown",
          acodec: "unknown",
          url: stream.urls?.[0]?.url || "",
          format_note: stream.quality
        }))
      };
      res.json(mappedInfo);
    } catch (error: any) {
      console.error("lux error:", error);
      res.status(500).json({ error: error.message || "Failed to fetch video info" });
    } finally {
      if (cookieFile && fs.existsSync(cookieFile)) {
        try {
          fs.unlinkSync(cookieFile);
          console.log("Temporary cookie file deleted");
        } catch (unlinkError) {
          console.error("Error deleting temporary cookie file:", unlinkError);
        }
      }
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
