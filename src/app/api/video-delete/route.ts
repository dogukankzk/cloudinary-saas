import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaClient } from '@prisma/client';
import { auth } from '@clerk/nextjs/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { publicId } = await req.json();

    // Supprimer la vidéo de Cloudinary
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });

    // Supprimer la vidéo de la base de données
    await prisma.video.delete({
      where: { publicId },
    });

    return NextResponse.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Delete failed:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
