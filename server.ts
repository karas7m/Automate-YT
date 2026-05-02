import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper for YouTube OAuth client
  const getOAuthClient = (req: express.Request) => {
    // In this environment, use the protocol and host from headers which are reliable behind the proxy
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const redirectUri = `${protocol}://${host}/api/auth/youtube/callback`;
    
    console.log(`[AUTH_DEBUG] Protocol: ${protocol}, Host: ${host} -> Redirect URI: ${redirectUri}`);
    
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );
  };

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      youtubeConfigured: !!process.env.GOOGLE_CLIENT_ID
    });
  });

  app.get("/api/auth/youtube/url", (req, res) => {
    const client = getOAuthClient(req);
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });

    res.json({ url });
  });

  app.get("/api/auth/youtube/callback", async (req, res) => {
    const { code, state } = req.query;
    const client = getOAuthClient(req);
    try {
      const { tokens } = await client.getToken(code as string);
      
      // Return a script that sends the token back to the opener and closes
      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #F9F9F8;">
            <div style="text-align: center;">
              <h2 style="color: #1A1A1A;">Authentication Successful</h2>
              <p style="color: #666;">Syncing with Nova AI engine... This window will close automatically.</p>
              <script>
                if (window.opener) {
                  window.opener.postMessage({ 
                    type: 'YOUTUBE_AUTH_SUCCESS', 
                    tokens: ${JSON.stringify(tokens)} 
                  }, '*');
                  setTimeout(() => window.close(), 1000);
                } else {
                  window.location.href = '/channel?youtube_connected=true&refresh_token=${tokens.refresh_token}';
                }
              </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Error getting tokens:", error);
      res.status(500).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #FFF5F5;">
            <div style="text-align: center; color: #C53030;">
              <h2>Authentication Failed</h2>
              <p>${error.message || "Failed to exchange code for tokens."}</p>
              <button onclick="window.close()" style="padding: 8px 16px; background: #C53030; color: white; border: none; rounded: 4px; cursor: pointer;">Close Window</button>
            </div>
          </body>
        </html>
      `);
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
    console.log(`[ACTION_REQUIRED] Ensure authorized Redirect URI in Google Console matches:`);
    console.log(`https://${process.env.HOST || 'YOUR_APP_URL'}/api/auth/youtube/callback`);
  });
}

startServer().catch(console.error);
