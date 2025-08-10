/* eslint-env node */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const public_id = body.public_id;

    if (!public_id) {
      res.status(400).json({ error: "public_id_required" });
      return;
    }

    // public_id NÃO pode conter ':'
    if (public_id.includes(":")) {
      res.status(400).json({ error: "invalid_public_id", details: "public_id cannot contain ':'" });
      return;
    }

    const result = await cloudinary.uploader.destroy(public_id); // se estiver em pasta, usar 'pasta/nome'
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: "cloudinary_destroy_failed", details: err?.message });
  }
}
