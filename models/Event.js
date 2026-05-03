import mongoose from 'mongoose';
import { FaBullseye } from 'react-icons/fa';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  eventDate: {
    type: Date,
    required: false
  },
  eventTime: {
    type: String,
    required: FaBullseye
  },
  imageUrl: {
    type: String,
    required: true
  },
  cloudinaryId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

eventSchema.index({ eventDate: 1, isActive: 1, isDeleted: 1 });

const EventModel = mongoose.models.Event || mongoose.model('Event', eventSchema);

export default EventModel;