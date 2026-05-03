import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true
    },

    festId: {
      type: String,
      required: true,
      index: true
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },

    comment: {
      type: String,
      trim: true,
      default: null
    },

    givenAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Prevent multiple feedbacks from same student for same fest
feedbackSchema.index({ studentId: 1, festId: 1 }, { unique: true });

export default mongoose.models.Feedback ||
  mongoose.model("Feedback", feedbackSchema);
