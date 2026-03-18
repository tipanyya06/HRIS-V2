import User from '../auth/user.model.js';
import { encrypt, decrypt } from '../../utils/encrypt.js';
import { logger } from '../../utils/logger.js';
import { getSupabaseClient } from '../../config/supabase.js';

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

export const getEmployees = async (query = {}) => {
  try {
    const {
      search = '',
      department = '',
      status = '',
      employmentType = '',
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Build filter
    const filter = {
      role: 'employee',
    };

    if (department && department !== 'All Departments') {
      filter.department = department;
    }

    if (status && status !== 'All Statuses') {
      const lowerStatus = String(status).toLowerCase();
      if (lowerStatus === 'active') {
        filter.isActive = true;
      } else if (lowerStatus === 'inactive') {
        filter.isActive = false;
      } else if (lowerStatus === 'terminated') {
        filter.terminatedAt = { $exists: true, $ne: null };
      } else {
        filter.status = status;
      }
    }

    if (employmentType && employmentType !== 'All Types') {
      filter.$or = [
        { employmentType },
        { classification: employmentType },
      ];
    }

    // Text search - name or email
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      const textFilter = [
        { 'personalInfo.firstName': { $regex: searchTerm, $options: 'i' } },
        { 'personalInfo.lastName': { $regex: searchTerm, $options: 'i' } },
        { 'personalInfo.fullName': { $regex: searchTerm, $options: 'i' } },
        { 'personalInfo.givenName': { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { 'contactInfo.companyEmail': { $regex: searchTerm, $options: 'i' } },
        { department: { $regex: searchTerm, $options: 'i' } },
        { positionTitle: { $regex: searchTerm, $options: 'i' } },
      ];

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: textFilter }];
        delete filter.$or;
      } else {
        filter.$or = textFilter;
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    // Sort
    const allowedSortFields = [
      'createdAt',
      'personalInfo.lastName',
      'personalInfo.firstName',
      'personalInfo.givenName',
      'department',
      'positionTitle',
      'dateOfEmployment',
      'status',
    ];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'asc' ? 1 : -1;

    const [employeesRaw, total] = await Promise.all([
      User.find(filter)
        .select(
          '_id personalInfo.firstName personalInfo.lastName personalInfo.fullName personalInfo.givenName ' +
          'email contactInfo.companyEmail companyEmail department positionTitle employmentType classification ' +
          'status isActive isVerified profilePicUrl avatarUrl dateOfEmployment createdAt terminatedAt'
        )
        // Never select password, govIds, or payroll in list view
        .sort({ [safeSortBy]: safeSortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter),
    ]);

    // Normalize row payload for frontend compatibility
    const employees = employeesRaw.map((emp) => {
      const firstName = emp?.personalInfo?.firstName || emp?.personalInfo?.givenName || '';
      const lastName = emp?.personalInfo?.lastName || '';
      const fullName = emp?.personalInfo?.fullName || `${firstName} ${lastName}`.trim();

      let normalizedStatus = emp?.status;
      if (!normalizedStatus) {
        if (emp?.terminatedAt) normalizedStatus = 'terminated';
        else normalizedStatus = emp?.isActive ? 'active' : 'inactive';
      }

      return {
        ...emp,
        personalInfo: {
          ...emp.personalInfo,
          firstName,
          lastName,
          fullName,
        },
        companyEmail: emp?.contactInfo?.companyEmail || emp?.companyEmail || null,
        avatarUrl: emp?.avatarUrl || emp?.profilePicUrl || null,
        employmentType: emp?.employmentType || emp?.classification || null,
        status: normalizedStatus,
      };
    });

    // Get unique departments for filter dropdown
    const departments = await User.distinct('department', {
      role: 'employee',
      department: { $exists: true, $nin: [null, ''] },
    });

    const totalPages = Math.ceil(total / limitNum);

    return {
      employees,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
      meta: {
        departments: departments.sort(),
      },
    };
  } catch (error) {
    logger.error(`getEmployees error: ${error.message}`);
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

export const updateEmployeeStatus = async (employeeId, newStatus, adminId, reason = '') => {
  try {
    const allowedStatuses = ['active', 'inactive', 'on-leave', 'terminated'];
    if (!allowedStatuses.includes(newStatus))
      throw createError(400, `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);

    const employee = await User.findOne({ _id: employeeId, role: 'employee' });
    if (!employee)
      throw createError(404, 'Employee not found');

    if (employee.status === newStatus)
      throw createError(409, `Employee is already ${newStatus}`);

    if (employee.status === 'terminated' && newStatus !== 'terminated')
      throw createError(400, 'Cannot reactivate a terminated employee. A new hire must be initiated.');

    const update = {
      status: newStatus,
      isActive: newStatus === 'active',
    };

    if (newStatus === 'terminated') {
      update.terminatedAt = new Date();
    } else {
      update.terminatedAt = null;
    }

    await User.findByIdAndUpdate(employeeId, update);

    logger.info(
      `Employee ${employeeId} status changed to ${newStatus} by admin ${adminId}. Reason: ${reason || 'not provided'}`
    );

    return {
      employeeId,
      previousStatus: employee.status,
      newStatus,
      terminatedAt: update.terminatedAt ?? null,
    };
  } catch (error) {
    logger.error(`updateEmployeeStatus error: ${error.message}`);
    throw error;
  }
};

// ─── Document Management ────────────────────────────────────────────────────

export const uploadEmployeeDocument = async (employeeId, file, docType, label = '') => {
  try {
    const employee = await User.findOne({ _id: employeeId, role: 'employee' });
    if (!employee) throw createError(404, 'Employee not found');

    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${employeeId}/${docType}/${timestamp}-${safeName}`;

    const supabase = getSupabaseClient();
    const { error: uploadError } = await supabase.storage
      .from('employee-docs')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) throw createError(500, `Upload failed: ${uploadError.message}`);

    const { data: urlData } = supabase.storage.from('employee-docs').getPublicUrl(filePath);
    const documentUrl = urlData.publicUrl;

    const docRecord = {
      label:      label || docType,
      docType,
      url:        documentUrl,
      filePath,
      fileName:   file.originalname,
      fileSize:   file.size,
      mimeType:   file.mimetype,
      uploadedAt: new Date(),
    };

    await User.findByIdAndUpdate(employeeId, { $push: { documents: docRecord } });
    logger.info(`Document uploaded for employee ${employeeId}: ${docType} — ${file.originalname}`);
    return docRecord;
  } catch (error) {
    logger.error(`uploadEmployeeDocument error: ${error.message}`);
    throw error;
  }
};

export const deleteEmployeeDocument = async (employeeId, filePath) => {
  try {
    const employee = await User.findOne({ _id: employeeId, role: 'employee' });
    if (!employee) throw createError(404, 'Employee not found');

    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase.storage.from('employee-docs').remove([filePath]);
    if (deleteError) logger.warn(`Supabase delete warning for ${filePath}: ${deleteError.message}`);

    await User.findByIdAndUpdate(employeeId, { $pull: { documents: { filePath } } });
    logger.info(`Document deleted for employee ${employeeId}: ${filePath}`);
    return { deleted: true, filePath };
  } catch (error) {
    logger.error(`deleteEmployeeDocument error: ${error.message}`);
    throw error;
  }
};

export const getEmployeeDocuments = async (employeeId) => {
  try {
    const employee = await User.findOne({ _id: employeeId, role: 'employee' })
      .select('documents personalInfo.fullName email')
      .lean();
    if (!employee) throw createError(404, 'Employee not found');
    return { employeeId, documents: employee.documents ?? [] };
  } catch (error) {
    logger.error(`getEmployeeDocuments error: ${error.message}`);
    throw error;
  }
};
