import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '@govconnect/shared-types';

export interface IUserDocument extends Document {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  department?: mongoose.Types.ObjectId;
  isActive: boolean;
  isLocked?: boolean;
  loginAttempts?: number;
  lockUntil?: Date;
  refreshTokens?: string[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Record<string, any>;
}

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  role: UserRole;
  department?: mongoose.Types.ObjectId;
  isActive: boolean;
  isLocked?: boolean;
  loginAttempts?: number;
  lockUntil?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): Record<string, any>;
}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't return password in queries by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CITIZEN,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: function (this: IUserDocument) {
        return [UserRole.DEPT_OFFICER, UserRole.DEPT_ADMIN].includes(this.role);
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
    refreshTokens: {
      type: [String],
      select: false,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ department: 1 });
userSchema.index({ isActive: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function (): Record<string, any> {
  return {
    _id: this._id,
    id: this._id.toString(),
    email: this.email,
    name: this.name,
    role: this.role,
    department: this.department,
    isActive: this.isActive,
    isLocked: this.isLocked,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const User = mongoose.model<IUserDocument>('User', userSchema);
