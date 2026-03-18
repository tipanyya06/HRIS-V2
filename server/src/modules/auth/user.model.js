import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { encrypt } from '../../utils/encrypt.js';

/**
 * MODEL POLICY - Madison 88 HRIS
 *
 * User is the SINGLE source of truth for all identity,
 * profile, government IDs, and payroll account data.
 *
 * Rules:
 * - All auth/reports/profile queries -> User model only
 * - Employee model (if it exists) -> extension-only
 *   stores: jobHistory, promotions, disciplinary records
 *   NEVER duplicates: personalInfo, govIds, payroll
 * - seed.js may reference Employee for legacy seeding only
 *   - never import Employee in runtime service files
 * - Always use User.sanitizeUser() before sending to client
 * - Always use .select('+password') only in auth flows
 */

const encryptedFieldRegex = /^[a-f0-9]{32}:[a-f0-9]+$/i;

const shouldEncrypt = (value) => {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return !encryptedFieldRegex.test(value);
};

const userSchema = new mongoose.Schema(
  {
    supabaseUid: String,
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['super-admin', 'admin', 'hr', 'employee', 'applicant'],
      default: 'applicant',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    terminatedAt: Date,

    // Basic Employment
    dateOfEmployment: Date,
    classification: {
      type: String,
      enum: ['Regular', 'Probationary', 'Fixed-term', 'Intern'],
    },
    countryOfEmployment: {
      type: String,
      enum: ['Philippines', 'USA', 'Indonesia'],
      default: 'Philippines',
    },
    positionTitle: String,
    department: String,
    directSupervisor: String,
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    companyName: String,
    source: {
      type: String,
      enum: ['Direct', 'PESO', 'Referral', 'LinkedIn', 'JobStreet', 'Other', ''],
      default: 'Direct',
    },

    // Personal Info
    personalInfo: {
      givenName: String,
      middleName: String,
      lastName: String,
      suffix: String,
      dateOfBirth: String,
      sex: String,
      civilStatus: String,
      religion: String,
      nationality: String,
    },

    // Contact Info
    contactInfo: {
      personalEmail: String,
      companyEmail: String,
      mainContactNo: String,
      emergencyContactNo: String,
      address: {
        addressLine: String,
        city: String,
        province: String,
        zipCode: String,
        country: String,
      },
    },

    // Educational Background
    education: {
      schoolName: String,
      attainment: {
        type: String,
        enum: ['High School', 'Vocational', 'Associate', "Bachelor's", "Master's", 'Doctoral'],
      },
      course: String,
      yearGraduated: String,
    },

    // Emergency Contact
    emergencyContact: {
      name: String,
      relationship: String,
      contact: String,
      address: {
        addressLine: String,
        city: String,
        province: String,
        zipCode: String,
        country: String,
      },
    },

    // HMO
    hmoInfo: {
      provider: String,
      cardNumber: String,
      dependents: [String],
      bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', "I don't know"],
      },
      bloodDonationConsent: Boolean,
    },

    // Government IDs
    governmentIds: {
      ssn: String,
      tin: String,
      sss: String,
      pagIbig: String,
      philhealth: String,
    },

    // Payroll
    payrollInfo: {
      bankName: String,
      accountNumber: String,
      basicSalary: String,
      accountName: String,
    },

    // Licenses
    licenses: [
      {
        name: String,
        dateObtained: String,
      },
    ],

    // Profile Picture
    profilePicUrl: {
      type: String,
      default: '',
    },

    // Documents
    documents: [
      {
        url: String,
        originalName: String,
        type: String,
        uploadedAt: Date,
      },
    ],

    // Saved Jobs
    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function preSave(next) {
  try {
    if (this.isModified('password')) {
      this.password = await bcryptjs.hash(this.password, 10);
    }

    const encryptedPaths = [
      'personalInfo.dateOfBirth',
      'contactInfo.mainContactNo',
      'contactInfo.emergencyContactNo',
      'emergencyContact.contact',
      'governmentIds.ssn',
      'governmentIds.tin',
      'governmentIds.sss',
      'governmentIds.pagIbig',
      'governmentIds.philhealth',
      'payrollInfo.accountNumber',
      'payrollInfo.basicSalary',
    ];

    for (const path of encryptedPaths) {
      if (!this.isModified(path)) {
        continue;
      }

      const value = this.get(path);
      if (shouldEncrypt(value)) {
        this.set(path, encrypt(value));
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  return bcryptjs.compare(plainPassword, this.password);
};

export default mongoose.model('User', userSchema);
