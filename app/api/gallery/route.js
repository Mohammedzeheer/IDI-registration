import { NextResponse } from 'next/server';
import connectMongo from "../../../libs/mongoDB";
import GalleryModel from "../../../models/Gallery";
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectMongo();

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('image');
        const title = formData.get('title');
        const description = formData.get('description');
        const tags = formData.get('tags');
        const isActive = formData.get('isActive') === 'true';

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded', status: 400 });
        }

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'gallery',
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            ).end(buffer);
        });

        // Create gallery entry
        const galleryItem = await GalleryModel.create({
            title,
            description,
            imageUrl: uploadResult.secure_url,
            cloudinaryId: uploadResult.public_id,
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            isActive,
            isDeleted: false
        });

        return NextResponse.json({ 
            message: 'Gallery item created successfully', 
            gallery: galleryItem,
            status: 202 
        });
    } catch (error) {
        console.log("Failed to create gallery item", error);
        return NextResponse.json({ message: "Failed to create gallery item", status: 210 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const skip = (page - 1) * limit;

        let query = { isDeleted: false };

        const galleries = await GalleryModel.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await GalleryModel.countDocuments(query);

        return NextResponse.json({ 
            galleries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.log("Failed to fetch galleries", error);
        return NextResponse.json({ message: "Failed to fetch galleries", status: 210 });
    }
}

export async function PUT(req) {
    try {
        const { id, title, description, tags, isActive } = await req.json();

        const updatedGallery = await GalleryModel.findByIdAndUpdate(
            id,
            { 
                title, 
                description, 
                tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
                isActive 
            },
            { new: true }
        );

        if (!updatedGallery) {
            return NextResponse.json({ message: "Gallery item not found", status: 404 });
        }

        return NextResponse.json({ 
            message: 'Gallery item updated successfully', 
            gallery: updatedGallery, 
            status: 200 
        });
    } catch (error) {
        console.log("Failed to update gallery item", error);
        return NextResponse.json({ message: "Failed to update gallery item", status: 210 });
    }
}

export async function DELETE(req) {
    try {
        const { id } = await req.json();

        const gallery = await GalleryModel.findById(id);
        if (!gallery) {
            return NextResponse.json({ message: "Gallery item not found", status: 404 });
        }

        // Delete from Cloudinary
        try {
            await cloudinary.uploader.destroy(gallery.cloudinaryId);
        } catch (cloudinaryError) {
            console.log("Failed to delete from Cloudinary:", cloudinaryError);
        }

        // Soft delete from database
        await GalleryModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

        return NextResponse.json({ message: 'Gallery item deleted successfully', status: 200 });
    } catch (error) {
        console.log("Failed to delete gallery item", error);
        return NextResponse.json({ message: "Failed to delete gallery item", status: 210 });
    }
}