import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client with user-agent
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Log status
console.log(`Gemini API Key loaded: ${apiKey ? "YES (Active)" : "NO"}`);

// API endpoint for generating fragment shaders
app.post("/api/generate-shader", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (!ai) {
    return res.status(503).json({
      error: "Gemini AI is not configured. Please add GEMINI_API_KEY to your workspace Secrets.",
      fallback: true
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Create a highly creative, visually stunning, modern 2D WebGL 1.0 Fragment Shader based on the request: "${prompt}".

The space of the fragment shader should be beautifully abstract, organic or geometric. Ensure it incorporates real-time movement and looks incredibly high-fidelity (matching professional modern web prototypes).

Use the following strict WebGL 1.0 rules and uniform definitions:
- It must start with: "precision mediump float;"
- It must have the following exact uniforms:
  - "uniform vec2 u_resolution;" (dimensions of viewport)
  - "uniform float u_time;" (elapsed time in seconds)
  - "uniform vec2 u_mouse;" (mouse coordinates normalized between 0.0 and 1.0, where center is roughly 0.5)
  - "uniform vec3 u_color_primary;" (RGB normalized colors from 0.0 to 1.0 for styling)
  - "uniform vec3 u_color_secondary;" (RGB normalized colors from 0.0 to 1.0 for styling)
  - "uniform float u_speed;" (multiplier for speed, where default is 1.0)
  - "uniform float u_scale;" (multiplier for noise or shape patterns, where default is 1.0)

Instructions inside the shader:
- Inside void main() {, calculate normalized coordinates (e.g. vec2 uv = gl_FragCoord.xy / u_resolution.xy;).
- Make sure u_mouse coordinates affect the shader dynamics (e.g., distorting noise, creating lights or adding ripples when u_mouse is active or near).
- Mix u_color_primary and u_color_secondary to shape the aesthetic, so changes on the UI sliders/color pickers instantly reflect inside the shader render.
- Multiply u_time with u_speed (e.g., u_time * u_speed) to enable the user to pause or accelerate the flow.
- Multiply pattern coordinates with u_scale (e.g., uv * u_scale * 5.0) to enable zooming/scaling of the GLSL pattern.
- Ensure the output color is assigned to "gl_FragColor" (e.g., gl_FragColor = vec4(finalColor, 1.0);).
- It MUST compile on standard WebGL 1.0. Avoid any WebGL 2.0 textures or syntax. Avoid features requiring headers or extensions. Do not use texture2D or texture coordinates since there is no texture attached, calculate everything programmatically (signed distance fields, modern procedural noise, cellular noise, fbm, sinusoids, math).
- Keep code robust, safe, and clean. All variables must be floats (no mixed types like multiplying float with int; write "2.0" instead of "2").

Return the result as a raw JSON response.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Short creative title of the shader (e.g., 'Retro Synthwave Net')."
            },
            description: {
              type: Type.STRING,
              description: "A friendly, descriptive sentence about what the shader is and how to interact with it."
            },
            shaderCode: {
              type: Type.STRING,
              description: "The complete, standalone GLSL fragment shader code starting with precision mediump float; and ending with gl_FragColor assignment."
            },
            primaryColorHex: {
              type: Type.STRING,
              description: "A matching visual recommendation for the primary uniform color in hex format (e.g., '#FF0055')."
            },
            secondaryColorHex: {
              type: Type.STRING,
              description: "A matching visual recommendation for the secondary uniform color in hex format (e.g., '#00FFAA')."
            },
            suggestedScale: {
              type: Type.NUMBER,
              description: "A suggested starting multiplier value for the scale uniform (e.g., 1.5)."
            },
            suggestedSpeed: {
              type: Type.NUMBER,
              description: "A suggested starting multiplier value for the speed uniform (e.g., 0.8)."
            }
          },
          required: ["title", "description", "shaderCode", "primaryColorHex", "secondaryColorHex"]
        }
      }
    });

    const text = response.text;
    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate custom shader." });
  }
});

// Proxy route for fetching shader configuration from user's custom external REST API
app.post("/api/fetch-external-shader", async (req, res) => {
  const { endpointUrl } = req.body;
  if (!endpointUrl) {
    return res.status(400).json({ error: "endpointUrl parameter is required." });
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const fetchRes = await fetch(endpointUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "User-Agent": "FigmaShaderStudio-Server-Proxy"
      },
      signal: controller.signal
    });
    
    clearTimeout(id);

    const contentType = fetchRes.headers.get("content-type") || "";
    let data;

    if (contentType.includes("application/json")) {
      data = await fetchRes.json();
    } else {
      const text = await fetchRes.text();
      // Raw GLSL code loaded directly
      data = {
        isRawGlsl: true,
        shaderCode: text,
        title: "Fetched External GLSL",
        description: `Direct shader program loaded from ${endpointUrl}`
      };
    }

    res.json({
      status: "success",
      statusCode: fetchRes.status,
      data: data
    });
  } catch (error: any) {
    console.error("External connection proxy failed:", error);
    res.status(502).json({ 
      error: `Proxy failed to connect to external host: ${error.message || "No response received"}` 
    });
  }
});

// Setup Vite or static serving based on environment
async function init() {
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
    console.log(`Figma Shader Studio server running on http://localhost:${PORT}`);
  });
}

init();
