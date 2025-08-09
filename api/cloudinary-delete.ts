/**
 * Rota serverless para destruir imagens no Cloudinary (Admin API).
 *
 * ENV (server-only | Vercel Settings → Environment Variables):
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 * - ADMIN_API_TOKEN   (token para Authorization: Bearer)
 *
 * Requisição (POST):
 *   Headers:
 *     Authorization: Bearer <ADMIN_API_TOKEN>
 *     Content-Type: application/json
 *   Body:
 *     { "publicId": "folder/my_public_id" }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { v2 as cloudinary } from "cloudinary";

export const config = { runtime: "nodejs18.x" };

const {
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  ADMIN_API_TOKEN,
} = process.env;

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
  secure: true,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return res.status(500).json({ ok: false, error: "Cloudinary envs ausentes" });
    }
    if (!ADMIN_API_TOKEN) {
      return res.status(500).json({ ok: false, error: "ADMIN_API_TOKEN ausente" });
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice("Bearer ".length).trim() : "";
    if (token !== ADMIN_API_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const { publicId } = req.body || {};
    if (!publicId || typeof publicId !== "string") {
      return res.status(400).json({ ok: false, error: "publicId inválido" });
    }

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true });
    return res.status(200).json({ ok: true, result });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message || "Erro interno" });
  }
}
