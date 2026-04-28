import { NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function POST(request) {
  const data = await request.formData()
  const file = data.get('file')

  if (!file) {
    return NextResponse.json({ success: false, message: 'No file found' }, { status: 400 })
  }

  // Ubah file menjadi buffer
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  try {
    // Unggah buffer ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'vuexy-pmp/uploads', // Opsional: atur folder di Cloudinary
          resource_type: 'auto' // Mendukung auto deteksi tipe file
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )
      uploadStream.end(buffer)
    })

    // Kembalikan URL Cloudinary
    return NextResponse.json({ success: true, url: uploadResult.secure_url })
  } catch (error) {
    console.error('🔴 GAGAL UPLOAD FILE KE CLOUDINARY:', error)

    return NextResponse.json({ success: false, message: 'File upload failed' }, { status: 500 })
  }
}
