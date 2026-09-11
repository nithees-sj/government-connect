import mongoose, { Schema, Document } from 'mongoose';

export interface ICitizenDocument extends Document {
  userId: mongoose.Types.ObjectId;
  fullName: string;
  dateOfBirth: Date;
  dob?: Date;
  aadhaarNumber?: string;
  panNumber?: string;
  isIdentityVerified: boolean;
  contact: {
    email: string;
    phone: string;
  };
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const citizenSchema = new Schema<ICitizenDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    aadhaarNumber: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    isIdentityVerified: {
      type: Boolean,
      default: false,
    },
    contact: {
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true, trim: true },
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' },
      country: { type: String, default: 'India' },
    },
  },
  {
    timestamps: true,
  },
);

// Virtuals for convenience
citizenSchema.virtual('dob').get(function () {
  return this.dateOfBirth;
});
citizenSchema.virtual('phone').get(function () {
  return this.contact?.phone;
});

citizenSchema.index({ userId: 1 }, { unique: true });
citizenSchema.index({ 'contact.email': 1 });
citizenSchema.index({ panNumber: 1 });

export const Citizen = mongoose.model<ICitizenDocument>(
  'Citizen',
  citizenSchema,
);
