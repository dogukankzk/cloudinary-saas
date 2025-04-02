import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { NextResponse, NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';



// Configuration
cloudinary.config({ 
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface cloudinaryUploadResult{
    public_id : string
    bytes : number
    duration?: number
    [key: string]: unknown
}

const prisma = new PrismaClient()
export async function POST(request:NextRequest) {
    
    try {
        const { userId } = await auth();
        if (!userId) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      
        if (
          !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
          !process.env.CLOUDINARY_API_KEY ||
          !process.env.CLOUDINARY_API_SECRET
        ) {
          console.error("Cloudinary credentials missing");
          return NextResponse.json({ error: "Cloudinary credentials missing" }, { status: 500 });
        }
      
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string;
        const originalSize = formData.get("originalSize") as string;
      
        console.log("Form data received:", { title, description, originalSize });
      
        if (!file) {
          console.error("No file received");
          return NextResponse.json({ error: "File not found" }, { status: 400 });
        }
      
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
      
        console.log("Uploading to Cloudinary...");
      
        const result = await new Promise<cloudinaryUploadResult>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "video",
              folder: "video-uploads",
              transformation: [{ quality: "auto", fetch_format: "mp4" }],
            },
            (error, result) => {
              if (error || !result) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                console.log("Cloudinary result:", result);
                resolve(result as cloudinaryUploadResult);
              }
            }
          );
          uploadStream.end(buffer);
        });
      
        console.log("Saving to DB...");
      
        const video = await prisma.video.create({
          data: {
            title,
            description,
            publicId: result.public_id,
            originalSize: originalSize,
            compressedSize: String(result.bytes),
            duration: result.duration || 0,
          },
        });
      
        console.log("Video saved:", video);
        return NextResponse.json(video);
      } catch (error) {
        console.error("Upload video failed", error);
        return NextResponse.json({ error: "Upload video failed" }, { status: 500 });
      } finally {
        await prisma.$disconnect();
      }
      
}