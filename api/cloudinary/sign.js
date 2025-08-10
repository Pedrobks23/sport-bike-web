/* eslint-env node */
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const folder = body.folder || process.env.CLOUDINARY_FOLDER || "sportbike";
    const public_id = body.public_id; // opcional — se quiser definir nome fixo
    const timestamp = Math.floor(Date.now() / 1000);

    // Monte somente os campos que quer assinar (ordem alfabética)
    const params = [];
    if (folder) params.push(`folder=${folder}`);
    if (public_id) params.push(`public_id=${public_id}`);
    params.push(`timestamp=${timestamp}`);

    const toSign = params.sort().join("&");
    const signature = crypto
      .createHash("sha1")
      .update(toSign + process.env.CLOUDINARY_API_SECRET)
      .digest("hex");

    res.status(200).json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      public_id,
      signature,
    });
  } catch (err) {
    res.status(500).json({ error: "sign_failed", details: err?.message });
  }
}
