import mongoose from 'mongoose';

const avanzaFeedbackSchema = new mongoose.Schema({
  delegate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delegate',
    required: true
  },
  // one feedback per pass
  passId: {
    type: String,
    required: true,
    unique: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true,
  collection: 'avanza_feedbacks'
});

export default mongoose.models.AvanzaFeedback || mongoose.model('AvanzaFeedback', avanzaFeedbackSchema);
