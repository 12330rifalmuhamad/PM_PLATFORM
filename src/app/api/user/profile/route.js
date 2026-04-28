import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = BigInt(session.user.id)

    const user = await prisma.user.findUnique({
      where: { userId }
    })

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user.userId.toString(),
        name: user.userName,
        email: user.email,
        phone: user.txtPhone || '',
        bio: user.txtBio || '',
        company: user.txtCompany || '',
        jobTitle: user.txtJobTitle || '',
        location: user.txtLocation || '',
        image: user.txtImage || session.user.image || null
      }
    })
  } catch (error) {
    console.error('Failed to fetch user profile:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, phone, bio, company, jobTitle, location, image } = body
    const userId = BigInt(session.user.id)

    let uploadedImageUrl = undefined
    if (image && image.startsWith('data:')) {
      try {
        const uploadResult = await cloudinary.uploader.upload(image, {
          folder: 'vuexy-pmp/profiles',
        })
        uploadedImageUrl = uploadResult.secure_url
      } catch (err) {
        console.error('Failed to upload profile image to Cloudinary:', err)
        return NextResponse.json({ message: 'Failed to upload image' }, { status: 500 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: {
        userName: name || undefined,
        txtPhone: phone || undefined,
        txtBio: bio || undefined,
        txtCompany: company || undefined,
        txtJobTitle: jobTitle || undefined,
        txtLocation: location || undefined,
        txtImage: uploadedImageUrl || undefined,
        txtUpdatedBy: session.user.email,
      }
    })

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.userId.toString(),
        name: updatedUser.userName,
        email: updatedUser.email,
        phone: updatedUser.txtPhone,
        bio: updatedUser.txtBio,
        company: updatedUser.txtCompany,
        jobTitle: updatedUser.txtJobTitle,
        location: updatedUser.txtLocation,
        image: updatedUser.txtImage
      }
    })
  } catch (error) {
    console.error('Failed to update user profile:', error)
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 })
  }
}




