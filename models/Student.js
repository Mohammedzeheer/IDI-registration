import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^\d{10}$/.test(v); // Validates 10-digit phone number
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  dob: {
    type: Date,
    required: true
  },
  name: {
    type: String,
    trim: true,
    default: null
  },
  place: {
    type: String,
    default: null
  },
  // division: {
  //   type: String,
  //   enum: ['Manjeshwar', 'Uppala', 'Kumbala', 'Badiyadka', 'Mulleriya', 'Kasaragod', 'Kanhangad', 'Uduma', 'Trikaripur'],
  //   default: null
  // },
  school: {
    type: String,
    default: null
  },
  class: {
    type: String,
    enum: ['6th', '7th', '8th', '9th', 'SSLC', '+1', '+2', 'Degree'],
    default: null
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  checkedIn: {
    type: Boolean,
    default: false
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  festId: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Create index for faster queries
studentSchema.index({ phone: 1, dob: 1 });
studentSchema.index({ festId: 1 });

// Generate unique fest ID before saving
studentSchema.pre('save', async function (next) {
  if (!this.festId && this.profileCompleted) {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.festId = `IDI${randomNum}`;
  }
  next();
});

export default mongoose.models.Student || mongoose.model('Student', studentSchema);