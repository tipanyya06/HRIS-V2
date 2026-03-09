import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { encrypt, decrypt } from '../../utils/encrypt.js';

const employeeSchema = new mongoose.Schema(
  {
    supabaseUid: String,
    applicantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Applicant',
    },
    firstName: String,
    lastName: String,
    email: {
      type: String,
      lowercase: true,
    },
    password: String, // bcrypt hashed
    personalInfo: {
      birthdate: {
        type: String,
        set: (val) => val ? encrypt(val) : val,
        get: (val) => val ? decrypt(val) : val,
      },
      address: String,
      gender: String,
    },
    governmentIds: {
      ssn: {
        type: String,
        set: (val) => val ? encrypt(val) : val,
        get: (val) => val ? decrypt(val) : val,
      },
      philhealth: String,
      sss: String,
      hdmf: String,
    },
    payrollInfo: {
      bankAccount: {
        type: String,
        set: (val) => val ? encrypt(val) : val,
        get: (val) => val ? decrypt(val) : val,
      },
      salary: {
        type: Number,
        set: (val) => val ? encrypt(String(val)) : val,
        get: (val) => val ? decrypt(val) : val,
      },
    },
    hmoInfo: {
      provider: String,
      cardNumber: String,
      dependents: [String],
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: {
        type: String,
        set: (val) => val ? encrypt(val) : val,
        get: (val) => val ? decrypt(val) : val,
      },
    },
    department: String,
    position: String,
    role: {
      type: String,
      enum: ['employee', 'admin', 'super-admin'],
      default: 'employee',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'on-leave', 'terminated'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    onboardingStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
    },
    offboardingStatus: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
    },
  },
  { timestamps: true, getters: true }
);

// Hash password before saving
employeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcryptjs.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
employeeSchema.methods.comparePassword = async function (plainPassword) {
  return bcryptjs.compare(plainPassword, this.password);
};

export default mongoose.model('Employee', employeeSchema);
