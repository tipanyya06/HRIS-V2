import User from '../auth/user.model.js';
import { encrypt, decrypt } from '../../utils/encrypt.js';
import { logger } from '../../utils/logger.js';

const createError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

const maybeDecrypt = (value) => {
  if (!value || typeof value !== 'string') {
    return value;
  }
  return value.includes(':') ? decrypt(value) : value;
};

const decryptSensitiveFields = (employeeDoc) => {
  const employee = employeeDoc?.toObject ? employeeDoc.toObject() : { ...employeeDoc };

  if (!employee) {
    return employee;
  }

  if (employee.governmentIds) {
    employee.governmentIds = {
      ...employee.governmentIds,
      ssn: maybeDecrypt(employee.governmentIds.ssn),
      tin: maybeDecrypt(employee.governmentIds.tin),
      sss: maybeDecrypt(employee.governmentIds.sss),
      pagIbig: maybeDecrypt(employee.governmentIds.pagIbig),
      philhealth: maybeDecrypt(employee.governmentIds.philhealth),
    };
  }

  if (employee.payrollInfo) {
    employee.payrollInfo = {
      ...employee.payrollInfo,
      accountNumber: maybeDecrypt(employee.payrollInfo.accountNumber),
    };
  }

  if (employee.personalInfo) {
    employee.personalInfo = {
      ...employee.personalInfo,
      dateOfBirth: maybeDecrypt(employee.personalInfo.dateOfBirth),
    };
  }

  if (employee.contactInfo) {
    employee.contactInfo = {
      ...employee.contactInfo,
      mainContactNo: maybeDecrypt(employee.contactInfo.mainContactNo),
      emergencyContactNo: maybeDecrypt(employee.contactInfo.emergencyContactNo),
    };
  }

  if (employee.emergencyContact) {
    employee.emergencyContact = {
      ...employee.emergencyContact,
      contact: maybeDecrypt(employee.emergencyContact.contact),
    };
  }

  return employee;
};

export const getEmployees = async (filters = {}, pagination = {}) => {
  try {
    const { search, department, status } = filters;
    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 20;

    const query = {
      role: 'employee',
    };

    if (department) {
      query.department = department;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { 'personalInfo.givenName': { $regex: search, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: search, $options: 'i' } },
        { 'name.given_name': { $regex: search, $options: 'i' } },
        { 'name.family_name': { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const data = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch (error) {
    logger.error(`Get employees error: ${error.message}`);
    throw error;
  }
};

export const getEmployeeById = async (id) => {
  try {
    const employee = await User.findOne({ _id: id, role: 'employee' }).select('-password');

    if (!employee) {
      throw createError(404, 'Employee not found');
    }

    return decryptSensitiveFields(employee);
  } catch (error) {
    logger.error(`Get employee by id error: ${error.message}`);
    throw error;
  }
};

export const updateEmployee = async (id, data = {}) => {
  try {
    const updateData = {};

    // Personal info
    if (data.personalInfo) updateData.personalInfo = data.personalInfo;

    // Contact
    if (data.contact) updateData.contact = data.contact;

    // Education
    if (data.education) updateData.education = data.education;

    // License
    if (data.license) updateData.license = data.license;

    // Blood type
    if (data.bloodType !== undefined) updateData.bloodType = data.bloodType;
    if (data.bloodDonorConsent !== undefined) updateData.bloodDonorConsent = data.bloodDonorConsent;

    // Emergency contact
    if (data.emergencyContact) updateData.emergencyContact = data.emergencyContact;

    // HMO
    if (data.hmoInfo) updateData.hmoInfo = data.hmoInfo;

    // Government IDs — encrypt before saving
    if (data.governmentIds) {
      updateData.governmentIds = {
        ssn: data.governmentIds.ssn ? encrypt(data.governmentIds.ssn) : undefined,
        tin: data.governmentIds.tin ? encrypt(data.governmentIds.tin) : undefined,
        sss: data.governmentIds.sss ? encrypt(data.governmentIds.sss) : undefined,
        pagIbig: data.governmentIds.pagIbig ? encrypt(data.governmentIds.pagIbig) : undefined,
        philhealth: data.governmentIds.philhealth ? encrypt(data.governmentIds.philhealth) : undefined,
      };
    }

    // Payroll — encrypt accountNumber
    if (data.payrollInfo) {
      updateData.payrollInfo = {
        ...data.payrollInfo,
        accountNumber: data.payrollInfo.accountNumber
          ? encrypt(data.payrollInfo.accountNumber)
          : undefined,
      };
    }

    // Bank details — encrypt accountNumber
    if (data.bankDetails) {
      updateData.bankDetails = {
        ...data.bankDetails,
        accountNumber: data.bankDetails.accountNumber
          ? encrypt(data.bankDetails.accountNumber)
          : undefined,
      };
    }

    // Licenses
    if (data.licenses) updateData.licenses = data.licenses;

    // Admin-only fields
    if (data.department) updateData.department = data.department;
    if (data.position) updateData.positionTitle = data.position;

    const employee = await User.findOneAndUpdate(
      { _id: id, role: { $in: ['employee', 'hr'] } },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!employee) {
      throw createError(404, 'Employee not found');
    }

    return decryptSensitiveFields(employee);
  } catch (error) {
    logger.error(`Update employee error: ${error.message}`);
    throw error;
  }
};

export const setEmployeeStatus = async (id, isActive) => {
  try {
    if (typeof isActive !== 'boolean') {
      throw createError(400, 'isActive must be boolean');
    }

    const employee = await User.findOneAndUpdate(
      { _id: id, role: 'employee' },
      { $set: { isActive } },
      { new: true }
    ).select('-password');

    if (!employee) {
      throw createError(404, 'Employee not found');
    }

    return employee;
  } catch (error) {
    logger.error(`Set employee status error: ${error.message}`);
    throw error;
  }
};

export const terminateEmployee = async (id) => {
  try {
    const employee = await User.findOneAndUpdate(
      { _id: id, role: 'employee' },
      { $set: { isActive: false, terminatedAt: new Date() } },
      { new: true }
    ).select('-password');

    if (!employee) {
      throw createError(404, 'Employee not found');
    }

    return employee;
  } catch (error) {
    logger.error(`Terminate employee error: ${error.message}`);
    throw error;
  }
};
