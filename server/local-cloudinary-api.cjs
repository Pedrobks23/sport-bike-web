/* eslint-env node */
// CommonJS: Node roda sem "type": "module"
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const fetch = global.fetch || require("node-fetch"); // Node 18+ já tem fetch. Se der erro, instale: npm i node-fetch

// Carrega .env.local (útil no dev)
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else {
  // carrega .env padrão se existir
  require("dotenv").config();
}

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.CLOUDINARY_LOCAL_PORT || 8787;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

app.post("/api/cloudinary/sign", (req, res) => {
  try {
    const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requireEnv("CLOUDINARY_API_KEY");
    const apiSecret = requireEnv("CLOUDINARY_API_SECRET");
    const defaultFolder = process.env.CLOUDINARY_FOLDER || "sportbike";

    const { folder, public_id } = req.body || {};
    const timestamp = Math.floor(Date.now() / 1000);

    const effectiveFolder = folder || defaultFolder;
    const paramsToSign = {};
    if (effectiveFolder) paramsToSign.folder = effectiveFolder;
    if (public_id) paramsToSign.public_id = public_id;
    paramsToSign.timestamp = timestamp;

    const sorted = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const toSign = `${sorted}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    res.json({
      timestamp,
      signature,
      cloudName,
      apiKey,
      folder: effectiveFolder,
      public_id,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to sign upload" });
  }
});

app.post("/api/cloudinary/destroy", async (req, res) => {
  try {
    const cloudName = requireEnv("CLOUDINARY_CLOUD_NAME");
    const apiKey = requireEnv("CLOUDINARY_API_KEY");
    const apiSecret = requireEnv("CLOUDINARY_API_SECRET");

    const { public_id, publicId } = req.body || {};
    const pid = public_id || publicId;
    if (!pid) return res.status(400).json({ error: "public_id_required" });
    if (pid.includes(":")) {
      return res.status(400).json({ error: "invalid_public_id", details: "public_id cannot contain ':'" });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const paramsToSign = { public_id: pid, timestamp };

    const sorted = Object.keys(paramsToSign)
      .sort()
      .map((k) => `${k}=${paramsToSign[k]}`)
      .join("&");

    const toSign = `${sorted}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const form = new URLSearchParams();
    form.append("public_id", pid);
    form.append("timestamp", String(timestamp));
    form.append("api_key", apiKey);
    form.append("signature", signature);

    const resp = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
      method: "POST",
      body: form,
    });

    const json = await resp.json();
    res.json(json);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to destroy image" });
  }
});

app.listen(PORT, () => {
  console.log(`[cloudinary-api] listening on http://localhost:${PORT}`);
});
