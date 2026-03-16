import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Card, LoadingSpinner, Toast } from '../../components/ui';
import { Eye, EyeOff, Plus, Trash2, Upload } from 'lucide-react';

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return 'An error occurred';
};

const maskValue = (value) => {
  if (!value) return '****-****';
  const strVal = String(value);
  return strVal.length > 4 ? `****-${strVal.slice(-4)}` : '****-****';
};

export default function EmployeeProfile() {
  const { user } = useAuthStore();
  const [employee, setEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [revealedFields, setRevealedFields] = useState({});

  // Section edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [personalForm, setPersonalForm] = useState({});
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({});
  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [educationForm, setEducationForm] = useState({});
  const [isEditingLicense, setIsEditingLicense] = useState(false);
  const [licenseForm, setLicenseForm] = useState([]);
  const [isEditingBloodType, setIsEditingBloodType] = useState(false);
  const [bloodTypeForm, setBloodTypeForm] = useState({});
  const [isEditingEmergency, setIsEditingEmergency] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({});
  const [isEditingHMO, setIsEditingHMO] = useState(false);
  const [hmoForm, setHmoForm] = useState({});
  const [isEditingGovIDs, setIsEditingGovIDs] = useState(false);
  const [govIDsForm, setGovIDsForm] = useState({});
  const [isEditingPayroll, setIsEditingPayroll] = useState(false);
  const [payrollForm, setPayrollForm] = useState({});
  const [isEditingBankDetails, setIsEditingBankDetails] = useState(false);
  const [bankDetailsForm, setBankDetailsForm] = useState({});
  const [isSavingSection, setIsSavingSection] = useState('');
  const [isUploadingProfilePic, setIsUploadingProfilePic] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await api.get(`/employees/${user?.id}`);
        setEmployee(response.data.data);
      } catch (err) {
        setError(extractErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [user?.id]);

  const startEditSection = (section) => {
    if (!employee) return;

    switch (section) {
      case 'personal':
        setPersonalForm({
          firstName: employee.personalInfo?.givenName || '',
          lastName: employee.personalInfo?.lastName || '',
          middleName: employee.personalInfo?.middleName || '',
          suffix: employee.personalInfo?.suffix || '',
          birthdate: employee.personalInfo?.dateOfBirth || '',
          gender: employee.personalInfo?.sex || '',
          civilStatus: employee.personalInfo?.civilStatus || '',
          religion: employee.personalInfo?.religion || '',
        });
        setIsEditingPersonal(true);
        break;
      case 'contact':
        setContactForm({
          personalEmail: employee.contactInfo?.personalEmail || '',
          companyEmail: employee.contactInfo?.companyEmail || '',
          mainPhone: employee.contactInfo?.mainContactNo || '',
          addressLine: employee.contactInfo?.address?.addressLine || '',
          city: employee.contactInfo?.address?.city || '',
          province: employee.contactInfo?.address?.province || '',
          zipCode: employee.contactInfo?.address?.zipCode || '',
          country: employee.contactInfo?.address?.country || '',
        });
        setIsEditingContact(true);
        break;
      case 'education':
        setEducationForm({
          attainment: employee.education?.attainment || '',
          school: employee.education?.schoolName || '',
          degree: employee.education?.course || '',
          yearStarted: employee.education?.yearGraduated ? employee.education.yearGraduated.split(' - ')[0] : '',
          yearEnded: employee.education?.yearGraduated ? employee.education.yearGraduated.split(' - ')[1] : '',
        });
        setIsEditingEducation(true);
        break;
      case 'license':
        setLicenseForm(employee.licenses || []);
        setIsEditingLicense(true);
        break;
      case 'bloodType':
        setBloodTypeForm({
          bloodType: employee.hmoInfo?.bloodType || '',
          bloodDonorConsent: employee.hmoInfo?.bloodDonationConsent || false,
        });
        setIsEditingBloodType(true);
        break;
      case 'emergency':
        setEmergencyForm({
          emergencyContactName: employee.emergencyContact?.name || '',
          emergencyContactRelationship: employee.emergencyContact?.relationship || '',
          emergencyContactPhone: employee.emergencyContact?.contact || '',
          emergencyContactAddress: employee.emergencyContact?.address?.addressLine || '',
        });
        setIsEditingEmergency(true);
        break;
      case 'hmo':
        setHmoForm({
          hmoProvider: employee.hmoInfo?.provider || '',
          hmoCardNumber: employee.hmoInfo?.cardNumber || '',
          hmoDependents: employee.hmoInfo?.dependents || [],
        });
        setIsEditingHMO(true);
        break;
      case 'govIDs':
        setGovIDsForm({
          ssn: employee.governmentIds?.ssn || '',
          tin: employee.governmentIds?.tin || '',
          philHealth: employee.governmentIds?.philhealth || '',
          sss: employee.governmentIds?.sss || '',
          hdmf: employee.governmentIds?.pagIbig || '',
        });
        setIsEditingGovIDs(true);
        break;
      case 'payroll':
        setPayrollForm({
          bankName: employee.payrollInfo?.bankName || '',
          accountNumber: employee.payrollInfo?.accountNumber || '',
          accountName: employee.payrollInfo?.accountName || '',
        });
        setIsEditingPayroll(true);
        break;
      case 'bankDetails':
        setBankDetailsForm({
          bankName: employee.payrollInfo?.bankName || '',
          accountNumber: employee.payrollInfo?.accountNumber || '',
          accountName: employee.payrollInfo?.accountName || '',
        });
        setIsEditingBankDetails(true);
        break;
      default:
        break;
    }
  };

  const cancelEdit = (section) => {
    switch (section) {
      case 'personal':
        setIsEditingPersonal(false);
        break;
      case 'contact':
        setIsEditingContact(false);
        break;
      case 'education':
        setIsEditingEducation(false);
        break;
      case 'license':
        setIsEditingLicense(false);
        break;
      case 'bloodType':
        setIsEditingBloodType(false);
        break;
      case 'emergency':
        setIsEditingEmergency(false);
        break;
      case 'hmo':
        setIsEditingHMO(false);
        break;
      case 'govIDs':
        setIsEditingGovIDs(false);
        break;
      case 'payroll':
        setIsEditingPayroll(false);
        break;
      case 'bankDetails':
        setIsEditingBankDetails(false);
        break;
      default:
        break;
    }
  };

  const saveSection = async (section, data) => {
    try {
      setIsSavingSection(section);
      const response = await api.patch(`/employees/${user?.id}`, data);
      setEmployee(response.data.data);
      setToastType('success');
      setToastMessage(`${section.charAt(0).toUpperCase() + section.slice(1)} updated successfully`);
      cancelEdit(section);
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err));
    } finally {
      setIsSavingSection('');
    }
  };

  const handleProfilePicUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setToastType('error');
        setToastMessage('File size must be less than 2MB');
        return;
      }

      setIsUploadingProfilePic(true);
      const formData = new FormData();
      formData.append('photo', file);

      const response = await api.post('/upload/profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEmployee((prev) => ({
        ...prev,
        profilePicUrl: response.data.data.profilePicUrl,
      }));
      setToastType('success');
      setToastMessage('Profile picture updated successfully');
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err));
    } finally {
      setIsUploadingProfilePic(false);
    }
  };

  const handleDocumentUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 2 * 1024 * 1024) {
        setToastType('error');
        setToastMessage('File size must be less than 2MB');
        return;
      }

      setIsUploadingDocument(true);
      const formData = new FormData();
      formData.append('document', file);

      const response = await api.post('/upload/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setEmployee((prev) => ({
        ...prev,
        documents: [...(prev.documents || []), response.data.data.documentUrl],
      }));
      setToastType('success');
      setToastMessage('Document uploaded successfully');
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err));
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const deleteDocument = async (docUrl) => {
    try {
      setEmployee((prev) => ({
        ...prev,
        documents: prev.documents?.filter((doc) => doc !== docUrl) || [],
      }));
      setToastType('success');
      setToastMessage('Document removed');
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err));
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'super-admin';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal and employment information</p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      ) : null}

      {toastMessage ? (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      ) : null}

      {/* Section 1: Personal Info */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
          {!isEditingPersonal ? (
            <button
              onClick={() => startEditSection('personal')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingPersonal ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="First Name"
                value={personalForm.firstName}
                onChange={(e) => setPersonalForm({ ...personalForm, firstName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={personalForm.lastName}
                onChange={(e) => setPersonalForm({ ...personalForm, lastName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Middle Name"
                value={personalForm.middleName}
                onChange={(e) => setPersonalForm({ ...personalForm, middleName: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Suffix"
                value={personalForm.suffix}
                onChange={(e) => setPersonalForm({ ...personalForm, suffix: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={personalForm.birthdate}
                onChange={(e) => setPersonalForm({ ...personalForm, birthdate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={personalForm.gender}
                onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={personalForm.civilStatus}
                onChange={(e) => setPersonalForm({ ...personalForm, civilStatus: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Civil Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Separated">Separated</option>
              </select>
              <input
                type="text"
                placeholder="Religion"
                value={personalForm.religion}
                onChange={(e) => setPersonalForm({ ...personalForm, religion: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('personal', {
                    personalInfo: {
                      givenName: personalForm.firstName,
                      lastName: personalForm.lastName,
                      middleName: personalForm.middleName,
                      suffix: personalForm.suffix,
                      dateOfBirth: personalForm.birthdate,
                      sex: personalForm.gender,
                      civilStatus: personalForm.civilStatus,
                      religion: personalForm.religion,
                    },
                  })
                }
                disabled={isSavingSection === 'personal'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'personal' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('personal')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">First Name</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.givenName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Name</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.lastName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Middle Name</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.middleName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Suffix</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.suffix || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Birthdate</p>
              <p className="font-medium text-gray-900">
                {employee?.personalInfo?.dateOfBirth ? new Date(employee.personalInfo.dateOfBirth).toLocaleDateString() : '—'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Gender</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.sex || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Civil Status</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.civilStatus || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Religion</p>
              <p className="font-medium text-gray-900">{employee?.personalInfo?.religion || '—'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Section 2: Contact */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>
          {!isEditingContact ? (
            <button
              onClick={() => startEditSection('contact')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingContact ? (
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Personal Email"
              value={contactForm.personalEmail}
              onChange={(e) => setContactForm({ ...contactForm, personalEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="tel"
                placeholder="Main Phone"
                value={contactForm.mainPhone}
                onChange={(e) => setContactForm({ ...contactForm, mainPhone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Alt Phone"
                value={contactForm.altPhone}
                onChange={(e) => setContactForm({ ...contactForm, altPhone: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              placeholder="Address"
              value={contactForm.address}
              onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('contact', {
                    contactInfo: {
                      personalEmail: contactForm.personalEmail,
                      companyEmail: contactForm.companyEmail,
                      mainContactNo: contactForm.mainPhone,
                      emergencyContactNo: contactForm.altPhone,
                      address: {
                        addressLine: contactForm.addressLine,
                        city: contactForm.city,
                        province: contactForm.province,
                        zipCode: contactForm.zipCode,
                        country: contactForm.country,
                      },
                    },
                  })
                }
                disabled={isSavingSection === 'contact'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'contact' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('contact')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Personal Email</p>
              <p className="font-medium text-gray-900">{employee?.contactInfo?.personalEmail || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Company Email (Admin-Set)</p>
              <p className="font-medium text-gray-900">{employee?.contactInfo?.companyEmail || employee?.email || '—'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Main Phone</p>
                <p className="font-medium text-gray-900">{employee?.contactInfo?.mainContactNo || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Emergency Phone</p>
                <p className="font-medium text-gray-900">{employee?.contactInfo?.emergencyContactNo || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{employee?.contactInfo?.address?.addressLine || '—'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Section 3: Education */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Education</h2>
          {!isEditingEducation ? (
            <button
              onClick={() => startEditSection('education')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingEducation ? (
          <div className="space-y-4">
            <select
              value={educationForm.attainment}
              onChange={(e) => setEducationForm({ ...educationForm, attainment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Attainment</option>
              <option value="Elementary">Elementary</option>
              <option value="High School">High School</option>
              <option value="College">College</option>
              <option value="Vocational">Vocational</option>
              <option value="Post-grad">Post-grad</option>
            </select>
            <input
              type="text"
              placeholder="School/University"
              value={educationForm.school}
              onChange={(e) => setEducationForm({ ...educationForm, school: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Degree"
              value={educationForm.degree}
              onChange={(e) => setEducationForm({ ...educationForm, degree: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="number"
                placeholder="Year Started"
                value={educationForm.yearStarted}
                onChange={(e) => setEducationForm({ ...educationForm, yearStarted: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Year Ended"
                value={educationForm.yearEnded}
                onChange={(e) => setEducationForm({ ...educationForm, yearEnded: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('education', {
                    education: {
                      attainment: educationForm.attainment,
                      schoolName: educationForm.school,
                      course: educationForm.degree,
                      yearGraduated: educationForm.yearEnded,
                    },
                  })
                }
                disabled={isSavingSection === 'education'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'education' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('education')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Attainment</p>
              <p className="font-medium text-gray-900">{employee?.education?.attainment || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">School</p>
              <p className="font-medium text-gray-900">{employee?.education?.schoolName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Degree</p>
              <p className="font-medium text-gray-900">{employee?.education?.course || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Year Graduated</p>
              <p className="font-medium text-gray-900">{employee?.education?.yearGraduated || '—'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Section 4: License */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Licenses</h2>
          {!isEditingLicense ? (
            <button
              onClick={() => startEditSection('license')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingLicense ? (
          <div className="space-y-4">
            {licenseForm.map((lic, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <input
                  type="text"
                  placeholder="License Name"
                  value={lic.name}
                  onChange={(e) => {
                    const newLicenses = [...licenseForm];
                    newLicenses[idx].name = e.target.value;
                    setLicenseForm(newLicenses);
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="date"
                  value={lic.dateObtained}
                  onChange={(e) => {
                    const newLicenses = [...licenseForm];
                    newLicenses[idx].dateObtained = e.target.value;
                    setLicenseForm(newLicenses);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setLicenseForm(licenseForm.filter((_, i) => i !== idx))}
                  className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setLicenseForm([...licenseForm, { name: '', dateObtained: '' }])}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              <Plus size={18} />
              Add License
            </button>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() => saveSection('license', { licenses: licenseForm })}
                disabled={isSavingSection === 'license'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'license' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('license')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {employee?.licenses && employee.licenses.length > 0 ? (
              employee.licenses.map((lic, idx) => (
                <div key={idx} className="flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{lic.name}</p>
                    <p className="text-sm text-gray-600">
                      {lic.dateObtained ? new Date(lic.dateObtained).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No licenses added</p>
            )}
          </div>
        )}
      </Card>

      {/* Section 5: Blood Type */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Blood Type</h2>
          {!isEditingBloodType ? (
            <button
              onClick={() => startEditSection('bloodType')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingBloodType ? (
          <div className="space-y-4">
            <select
              value={bloodTypeForm.bloodType}
              onChange={(e) => setBloodTypeForm({ ...bloodTypeForm, bloodType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={bloodTypeForm.bloodDonorConsent || false}
                onChange={(e) => setBloodTypeForm({ ...bloodTypeForm, bloodDonorConsent: e.target.checked })}
                className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-700">Blood Donor Consent</span>
            </label>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('bloodType', {
                    hmoInfo: {
                      bloodType: bloodTypeForm.bloodType,
                      bloodDonationConsent: bloodTypeForm.bloodDonorConsent,
                    },
                  })
                }
                disabled={isSavingSection === 'bloodType'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'bloodType' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('bloodType')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-600">Blood Type</p>
              <p className="font-medium text-gray-900">{employee?.hmoInfo?.bloodType || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Blood Donor Consent</p>
              <p className="font-medium text-gray-900">{employee?.hmoInfo?.bloodDonationConsent ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Section 6: Emergency Contact */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Emergency Contact</h2>
          {!isEditingEmergency ? (
            <button
              onClick={() => startEditSection('emergency')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingEmergency ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={emergencyForm.emergencyContactName}
              onChange={(e) =>
                setEmergencyForm({ ...emergencyForm, emergencyContactName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Relationship"
              value={emergencyForm.emergencyContactRelationship}
              onChange={(e) =>
                setEmergencyForm({ ...emergencyForm, emergencyContactRelationship: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={emergencyForm.emergencyContactPhone}
              onChange={(e) =>
                setEmergencyForm({ ...emergencyForm, emergencyContactPhone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              placeholder="Address"
              value={emergencyForm.emergencyContactAddress}
              onChange={(e) =>
                setEmergencyForm({ ...emergencyForm, emergencyContactAddress: e.target.value })
              }
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('emergency', {
                    emergencyContact: {
                      name: emergencyForm.emergencyContactName,
                      relationship: emergencyForm.emergencyContactRelationship,
                      contact: emergencyForm.emergencyContactPhone,
                      address: {
                        addressLine: emergencyForm.emergencyContactAddress,
                      },
                    },
                  })
                }
                disabled={isSavingSection === 'emergency'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'emergency' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('emergency')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{employee?.emergencyContact?.name || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Relationship</p>
              <p className="font-medium text-gray-900">{employee?.emergencyContact?.relationship || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{employee?.emergencyContact?.contact || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium text-gray-900">{employee?.emergencyContact?.address?.addressLine || '—'}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Section 7: HMO */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">HMO Information</h2>
          {!isEditingHMO ? (
            <button
              onClick={() => startEditSection('hmo')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingHMO ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Provider"
              value={hmoForm.hmoProvider}
              onChange={(e) => setHmoForm({ ...hmoForm, hmoProvider: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Card Number"
              value={hmoForm.hmoCardNumber}
              onChange={(e) => setHmoForm({ ...hmoForm, hmoCardNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Dependents</h3>
              {hmoForm.hmoDependents?.map((dep, idx) => (
                <div key={idx} className="flex gap-2 items-end mb-2">
                  <input
                    type="text"
                    placeholder="Dependent Name"
                    value={dep.name}
                    onChange={(e) => {
                      const newDeps = [...(hmoForm.hmoDependents || [])];
                      newDeps[idx].name = e.target.value;
                      setHmoForm({ ...hmoForm, hmoDependents: newDeps });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Relationship"
                    value={dep.relationship}
                    onChange={(e) => {
                      const newDeps = [...(hmoForm.hmoDependents || [])];
                      newDeps[idx].relationship = e.target.value;
                      setHmoForm({ ...hmoForm, hmoDependents: newDeps });
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() =>
                      setHmoForm({
                        ...hmoForm,
                        hmoDependents: hmoForm.hmoDependents.filter((_, i) => i !== idx),
                      })
                    }
                    className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setHmoForm({
                    ...hmoForm,
                    hmoDependents: [...(hmoForm.hmoDependents || []), { name: '', relationship: '' }],
                  })
                }
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 mt-2"
              >
                <Plus size={18} />
                Add Dependent
              </button>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('hmo', {
                    hmoInfo: {
                      provider: hmoForm.hmoProvider,
                      cardNumber: hmoForm.hmoCardNumber,
                      dependents: hmoForm.hmoDependents,
                    },
                  })
                }
                disabled={isSavingSection === 'hmo'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'hmo' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('hmo')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Provider</p>
              <p className="font-medium text-gray-900">{employee?.hmoInfo?.provider || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Card Number</p>
              <p className="font-medium text-gray-900">{employee?.hmoInfo?.cardNumber || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dependents</p>
              {employee?.hmoInfo?.dependents && employee.hmoInfo.dependents.length > 0 ? (
                <div className="space-y-1">
                  {employee.hmoInfo.dependents.map((dep, idx) => (
                    <p key={idx} className="text-gray-700">
                      {dep.name} ({dep.relationship})
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No dependents</p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Section 8: Government IDs */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Government IDs</h2>
          {!isEditingGovIDs ? (
            <button
              onClick={() => startEditSection('govIDs')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingGovIDs ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="SSN"
              value={govIDsForm.ssn}
              onChange={(e) => setGovIDsForm({ ...govIDsForm, ssn: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="TIN"
              value={govIDsForm.tin}
              onChange={(e) => setGovIDsForm({ ...govIDsForm, tin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="PhilHealth"
              value={govIDsForm.philHealth}
              onChange={(e) => setGovIDsForm({ ...govIDsForm, philHealth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="SSS"
              value={govIDsForm.sss}
              onChange={(e) => setGovIDsForm({ ...govIDsForm, sss: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="HDMF"
              value={govIDsForm.hdmf}
              onChange={(e) => setGovIDsForm({ ...govIDsForm, hdmf: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('govIDs', {
                    governmentIds: {
                      ssn: govIDsForm.ssn,
                      tin: govIDsForm.tin,
                      philhealth: govIDsForm.philHealth,
                      sss: govIDsForm.sss,
                      pagIbig: govIDsForm.hdmf,
                    },
                  })
                }
                disabled={isSavingSection === 'govIDs'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'govIDs' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('govIDs')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { key: 'ssn', label: 'Social Security' },
              { key: 'tin', label: 'TIN' },
              { key: 'philhealth', label: 'PhilHealth' },
              { key: 'sss', label: 'SSS' },
              { key: 'pagIbig', label: 'PAG-IBIG' },
            ].map((field) => (
              <div key={field.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{field.label}</p>
                  <p className="font-medium text-gray-900">
                    {revealedFields[field.key] || isAdmin
                      ? employee?.governmentIds?.[field.key] || '—'
                      : maskValue(employee?.governmentIds?.[field.key])}
                  </p>
                </div>
                {!isAdmin ? (
                  <button
                    onClick={() =>
                      setRevealedFields({
                        ...revealedFields,
                        [field.key]: !revealedFields[field.key],
                      })
                    }
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    {revealedFields[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section 9: Payroll */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Payroll Information</h2>
          {!isEditingPayroll ? (
            <button
              onClick={() => startEditSection('payroll')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingPayroll ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Bank Name"
              value={payrollForm.bankName}
              onChange={(e) => setPayrollForm({ ...payrollForm, bankName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Account Number"
              value={payrollForm.accountNumber}
              onChange={(e) => setPayrollForm({ ...payrollForm, accountNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('payroll', {
                    payrollInfo: {
                      bankName: payrollForm.bankName,
                      accountNumber: payrollForm.accountNumber,
                      accountName: payrollForm.accountName,
                    },
                  })
                }
                disabled={isSavingSection === 'payroll'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'payroll' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('payroll')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { key: 'bankName', label: 'Bank Name' },
              { key: 'accountNumber', label: 'Account Number' },
              { key: 'accountName', label: 'Account Name' },
            ].map((field) => (
              <div key={field.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{field.label}</p>
                  <p className="font-medium text-gray-900">
                    {revealedFields[field.key] || isAdmin
                      ? employee?.payrollInfo?.[field.key] || '—'
                      : maskValue(employee?.payrollInfo?.[field.key])}
                  </p>
                </div>
                {!isAdmin ? (
                  <button
                    onClick={() =>
                      setRevealedFields({
                        ...revealedFields,
                        [field.key]: !revealedFields[field.key],
                      })
                    }
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    {revealedFields[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Section 10: Profile Picture */}
      <Card className="border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Profile Picture</h2>
        <div className="flex flex-col items-center">
          <img
            src={
              employee?.profilePicUrl ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'user'}`
            }
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-gray-200 object-cover"
          />
          <label className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer">
            {isUploadingProfilePic ? 'Uploading...' : 'Change Picture'}
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleProfilePicUpload}
              disabled={isUploadingProfilePic}
              className="hidden"
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">Max 2MB, JPEG or PNG only</p>
        </div>
      </Card>

      {/* Section 11: Documents */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Documents</h2>
          <label className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100 cursor-pointer flex items-center gap-2">
            <Upload size={16} />
            {isUploadingDocument ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              onChange={handleDocumentUpload}
              disabled={isUploadingDocument}
              className="hidden"
            />
          </label>
        </div>

        <div className="space-y-2">
          {employee?.documents && employee.documents.length > 0 ? (
            employee.documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                <p className="text-gray-700 truncate">{doc.split('/').pop()}</p>
                {isAdmin ? (
                  <button
                    onClick={() => deleteDocument(doc)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                ) : null}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No documents uploaded</p>
          )}
        </div>
      </Card>

      {/* Section 12: Bank Details */}
      <Card className="border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Bank Details</h2>
          {!isEditingBankDetails ? (
            <button
              onClick={() => startEditSection('bankDetails')}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
            >
              Edit
            </button>
          ) : null}
        </div>

        {isEditingBankDetails ? (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Bank Name"
              value={bankDetailsForm.bankName}
              onChange={(e) => setBankDetailsForm({ ...bankDetailsForm, bankName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="Account Number"
              value={bankDetailsForm.accountNumber}
              onChange={(e) =>
                setBankDetailsForm({ ...bankDetailsForm, accountNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={bankDetailsForm.accountType}
              onChange={(e) => setBankDetailsForm({ ...bankDetailsForm, accountType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Account Type</option>
              <option value="Savings">Savings</option>
              <option value="Checking">Checking</option>
            </select>
            <input
              type="text"
              placeholder="Bank Branch"
              value={bankDetailsForm.bankBranch}
              onChange={(e) => setBankDetailsForm({ ...bankDetailsForm, bankBranch: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2 pt-4">
              <button
                onClick={() =>
                  saveSection('bankDetails', {
                    payrollInfo: {
                      bankName: bankDetailsForm.bankName,
                      accountNumber: bankDetailsForm.accountNumber,
                    },
                  })
                }
                disabled={isSavingSection === 'bankDetails'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSavingSection === 'bankDetails' ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => cancelEdit('bankDetails')}
                className="px-4 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {[
              { key: 'bankName', label: 'Bank Name' },
              { key: 'accountNumber', label: 'Account Number' },
            ].map((field) => (
              <div key={field.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{field.label}</p>
                  <p className="font-medium text-gray-900">
                    {revealedFields[field.key] || isAdmin
                      ? employee?.payrollInfo?.[field.key] || '—'
                      : maskValue(employee?.payrollInfo?.[field.key])}
                  </p>
                </div>
                {!isAdmin ? (
                  <button
                    onClick={() =>
                      setRevealedFields({
                        ...revealedFields,
                        [field.key]: !revealedFields[field.key],
                      })
                    }
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    {revealedFields[field.key] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
