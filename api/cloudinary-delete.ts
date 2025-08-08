/**
 * Serverless route to delete images from Cloudinary using the Admin API.
 *
 * Environment variables (set in Vercel -> Project -> Settings -> Environment Variables):
 * CLOUDINARY_CLOUD_NAME
 * CLOUDINARY_API_KEY
 * CLOUDINARY_API_SECRET
 * ADMIN_API_TOKEN
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
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.split(' ')[1]
  if (!token || token !== process.env.ADMIN_API_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const { publicId } = req.body || {}
  if (!publicId) {
    return res.status(400).json({ ok: false, error: 'Missing publicId' })
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { invalidate: true })
    return res.status(200).json({ ok: true, result })
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
