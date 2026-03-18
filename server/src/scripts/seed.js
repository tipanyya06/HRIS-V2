/**
 * Seed script to create a test admin user and sample jobs
 * Run with: node src/scripts/seed.js
 */

import dotenv from 'dotenv';
import User from '../modules/auth/user.model.js';
import Job from '../modules/jobs/job.model.js';
import { connectDB } from '../config/db.js';

dotenv.config();

async function runSeed() {
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Clear existing data (optional - comment out to keep existing data)
    // await User.deleteMany({});
    // await Job.deleteMany({});

    // 1. Create admin user
    const adminEmail = 'admin@madison88.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      // Don't hash here - let the User model pre-save hook handle it
      const admin = new User({
        email: adminEmail,
        password: 'Admin123456', // Plain password - let pre-save hook hash it
        role: 'super-admin',
        isVerified: true,
        personalInfo: {
          givenName: 'Admin',
          lastName: 'User',
        },
        department: 'HR',
        positionTitle: 'System Administrator',
        companyName: 'Madison 88',
      });
      await admin.save();
      console.log('✓ Created admin user: admin@madison88.com / Admin123456');
    } else {
      // Keep admin credentials consistent for local development if it already exists.
      existingAdmin.password = 'Admin123456';
      existingAdmin.role = existingAdmin.role || 'super-admin';
      existingAdmin.isVerified = true;
      if (!existingAdmin.personalInfo) {
        existingAdmin.personalInfo = {};
      }
      existingAdmin.personalInfo.givenName = existingAdmin.personalInfo.givenName || 'Admin';
      existingAdmin.personalInfo.lastName = existingAdmin.personalInfo.lastName || 'User';
      await existingAdmin.save();
      console.log('✓ Admin user already exists, password reset to: Admin123456');
    }

    // SEED ONLY - Employee model reference kept for legacy seed compatibility.
    // Do NOT import Employee in any runtime service file. Use User model with role filter.
    // Ensure legacy Employee admin also exists for modules still referencing Employee.
    // This keeps compatibility while auth now uses User.
    const { default: Employee } = await import('../modules/employees/employee.model.js');
    const existingLegacyAdmin = await Employee.findOne({ email: adminEmail });
    if (!existingLegacyAdmin) {
      const legacyAdmin = new Employee({
        email: adminEmail,
        password: 'Admin123456', // Plain password - let pre-save hook hash it
        firstName: 'Admin',
        lastName: 'User',
        department: 'HR',
        position: 'System Administrator',
        role: 'super-admin',
        status: 'active',
        isVerified: true,
      });
      await legacyAdmin.save();
      console.log('✓ Created legacy employee admin for compatibility');
    }
    // TODO Phase 1: migrate seed to create User only,
    // remove Employee creation after migration verified.

    // 2. Create sample jobs
    const jobs = [
      {
        title: 'Senior React Developer',
        department: 'Engineering',
        slots: 2,
        status: 'active',
        description: 'We are looking for an experienced React developer with 5+ years of experience.',
        requirements: ['React 18+', 'Node.js', 'TypeScript', 'MongoDB'],
      },
      {
        title: 'HR Manager',
        department: 'HR',
        slots: 1,
        status: 'active',
        description: 'Manage recruitment, onboarding, and employee relations.',
        requirements: ['5+ years HR experience', 'Recruitment', 'Employee relations'],
      },
      {
        title: 'Data Analyst',
        department: 'Finance',
        slots: 3,
        status: 'active',
        description: 'Analyze business data and provide insights.',
        requirements: ['SQL', 'Python', 'Tableau', 'Analytics'],
      },
    ];

    for (const jobData of jobs) {
      const existing = await Job.findOne({ title: jobData.title });
      if (!existing) {
        const job = new Job({
          ...jobData,
          postedBy: null, // Will be set by admin
        });
        await job.save();
        console.log(`✓ Created job: ${jobData.title}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest Login:');
    console.log('  Email: admin@madison88.com');
    console.log('  Password: Admin123456');
    console.log('\nVisit: http://localhost:5174/login');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

runSeed();
