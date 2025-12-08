/* eslint-env node */
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function respond(res, status, payload) {
  res.status(status).json(payload)
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    respond(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED" })
    return
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {}
    const publicId = body.publicId || body.public_id

    if (!publicId || typeof publicId !== "string") {
      respond(res, 400, { ok: false, code: "BAD_REQUEST", message: "publicId is required" })
      return
    }

    if (publicId.includes(":")) {
      respond(res, 400, { ok: false, code: "INVALID_PUBLIC_ID", message: "publicId cannot contain ':'" })
      return
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      respond(res, 500, { ok: false, code: "MISSING_ENV", message: "Cloudinary environment variables are missing" })
      return
    }

    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
    respond(res, 200, { ok: true, result })
  } catch (err) {
    const details = err?.response?.data || err?.message || "unknown_error"
    respond(res, 500, { ok: false, code: "INTERNAL", message: details })
  }
}
