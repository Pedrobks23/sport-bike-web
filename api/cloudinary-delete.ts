/**
 * Rota serverless para deletar imagens no Cloudinary.
 *
 * Variáveis de ambiente necessárias (somente no backend/Vercel):
 * CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, ADMIN_API_TOKEN
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const { publicId } = req.body as { publicId?: string }
  if (!publicId) {
    return res.status(400).json({ ok: false, error: 'Missing publicId' })
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
    return res.status(200).json({ ok: true, result })
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e.message })
  }
}

