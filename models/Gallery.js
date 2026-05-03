import mongoose from "mongoose";

const gallerySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    cloudinaryId: {
        type: String,
        required: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    uploadedBy: {
        type: String,
        default: 'admin'
    },
    viewCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

const GalleryModel = mongoose.models.Gallery || mongoose.model("Gallery", gallerySchema);
export default GalleryModel;