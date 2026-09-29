import mongoose from 'mongoose';

import { DESIGNATIONS } from '../data/avanza';

export { DESIGNATIONS };

const delegateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // not schema-required so entries created before this field still save on check-in
  sector: {
    type: String,
    trim: true,
    default: ''
  },
  unit: {
    type: String,
    required: true,
    trim: true
  },
  designation: {
    type: String,
    required: true,
    enum: DESIGNATIONS
  },
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: v => /^\d{10}$/.test(v),
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  passId: {
    type: String,
    unique: true
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'avanza_delegates'
});

// Generate a unique pass ID like AVZ4821
delegateSchema.pre('save', async function (next) {
  if (!this.passId) {
    const Model = this.constructor;
    for (let i = 0; i < 20; i++) {
      const candidate = `AVZ${Math.floor(1000 + Math.random() * 9000)}`;
      if (!(await Model.exists({ passId: candidate }))) {
        this.passId = candidate;
        break;
      }
    }
    if (!this.passId) {
      this.passId = `AVZ${Date.now().toString().slice(-6)}`;
    }
  }
  next();
});

export const toPublicDelegate = d => ({
  passId: d.passId,
  name: d.name,
  sector: d.sector || '',
  unit: d.unit,
  designation: d.designation,
  phone: d.phone,
  checkedIn: d.checkedIn,
  checkedInAt: d.checkedInAt,
  createdAt: d.createdAt
});

export default mongoose.models.Delegate || mongoose.model('Delegate', delegateSchema);
