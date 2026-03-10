import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

const SECTION_TITLES = {
  0: 'Agreement',
  1: 'Basic Employment Details',
  2: 'Account Credentials',
  3: 'Personal Information',
  4: 'Contact Information',
  5: 'Educational Background',
  6: 'Emergency Information',
  7: 'HMO and Dependent Info',
  8: 'Government Information',
  9: 'Payroll Information',
};

const getVisibleSections = (classification, country) => {
  const base = [0, 1, 2, 3, 4, 5, 6];

  if (country !== 'Philippines' || classification === 'Intern') {
    return base;
  }

  if (country === 'Philippines' && classification === 'Regular') {
    return [...base, 7, 8, 9];
  }

  return [...base, 8, 9];
};

const extractErrorMessage = (error) => {
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }

  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }

  if (typeof error?.response?.data?.error?.message === 'string') {
    return error.response.data.error.message;
  }

  if (typeof error?.message === 'string') {
    return error.message;
  }

  return 'Signup failed. Please try again.';
};

const sectionFields = {
  0: ['agreementAccepted'],
  1: [
    'date_of_employment',
    'classification',
    'country_of_employment',
    'position_title',
    'department',
    'direct_supervisor',
    'company_name',
  ],
  2: ['email', 'password', 'confirm_password'],
  3: [
    'given_name',
    'middle_name',
    'last_name',
    'suffix',
    'date_of_birth',
    'sex',
    'civil_status',
    'religion',
    'nationality',
  ],
  4: [
    'personal_email',
    'company_email',
    'main_contact_no',
    'emergency_contact_no',
    'address_line',
    'city',
    'province',
    'zip_code',
    'country',
  ],
  5: ['school_name', 'attainment', 'course', 'year_graduated'],
  6: [
    'emergency_name',
    'emergency_relationship',
    'emergency_contact',
    'emergency_address_line',
    'emergency_city',
    'emergency_province',
    'emergency_zip_code',
    'emergency_country',
  ],
  7: ['hmo_provider', 'hmo_card_number', 'blood_type', 'blood_donation_consent'],
  8: ['ssn', 'tin', 'sss', 'pag_ibig', 'philhealth'],
  9: ['bank_name', 'account_number', 'account_name'],
};

export default function Signup() {
  const navigate = useNavigate();
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const {
    register,
    control,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      agreementAccepted: false,
      classification: 'Regular',
      country_of_employment: 'Philippines',
      email: '',
      password: '',
      confirm_password: '',
      date_of_employment: '',
      position_title: '',
      department: '',
      direct_supervisor: '',
      company_name: '',
      given_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      date_of_birth: '',
      sex: 'Male',
      civil_status: 'Single',
      religion: '',
      nationality: '',
      personal_email: '',
      company_email: '',
      main_contact_no: '',
      emergency_contact_no: '',
      address_line: '',
      city: '',
      province: '',
      zip_code: '',
      country: 'Philippines',
      school_name: '',
      attainment: "Bachelor's",
      course: '',
      year_graduated: '',
      emergency_name: '',
      emergency_relationship: '',
      emergency_contact: '',
      same_address: false,
      emergency_address_line: '',
      emergency_city: '',
      emergency_province: '',
      emergency_zip_code: '',
      emergency_country: '',
      hmo_provider: '',
      hmo_card_number: '',
      dependents: [{ name: '' }],
      blood_type: "I don't know",
      blood_donation_consent: false,
      ssn: '',
      tin: '',
      sss: '',
      pag_ibig: '',
      philhealth: '',
      bank_name: '',
      account_number: '',
      account_name: '',
    },
    mode: 'onTouched',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'dependents',
  });

  const classification = watch('classification');
  const countryOfEmployment = watch('country_of_employment');
  const sameAddress = watch('same_address');

  const addressLine = watch('address_line');
  const city = watch('city');
  const province = watch('province');
  const zipCode = watch('zip_code');
  const country = watch('country');

  useEffect(() => {
    if (!sameAddress) {
      return;
    }

    setValue('emergency_address_line', addressLine);
    setValue('emergency_city', city);
    setValue('emergency_province', province);
    setValue('emergency_zip_code', zipCode);
    setValue('emergency_country', country);
  }, [sameAddress, addressLine, city, province, zipCode, country, setValue]);

  const visibleSections = useMemo(() => {
    return getVisibleSections(classification, countryOfEmployment);
  }, [classification, countryOfEmployment]);

  const currentSection = visibleSections[currentVisibleIndex];
  const isLastVisibleSection = currentVisibleIndex === visibleSections.length - 1;

  const handleNext = async () => {
    const fieldsToValidate = sectionFields[currentSection] || [];
    const valid = await trigger(fieldsToValidate);

    if (!valid) {
      return;
    }

    setCurrentVisibleIndex((prev) => Math.min(prev + 1, visibleSections.length - 1));
  };

  const handleBack = () => {
    setCurrentVisibleIndex((prev) => Math.max(prev - 1, 0));
  };

  const onSubmit = async (data) => {
    try {
      setSubmitError('');
      setSubmitSuccess('');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        setSubmitError('Please enter a valid email address.');
        return;
      }

      const payload = {
        email: data.email,
        password: data.password,
        role: 'employee',
        dateOfEmployment: data.date_of_employment || null,
        classification: data.classification,
        countryOfEmployment: data.country_of_employment,
        positionTitle: data.position_title,
        department: data.department,
        directSupervisor: data.direct_supervisor,
        companyName: data.company_name,
        personalInfo: {
          givenName: data.given_name,
          middleName: data.middle_name,
          lastName: data.last_name,
          suffix: data.suffix,
          dateOfBirth: data.date_of_birth,
          sex: data.sex,
          civilStatus: data.civil_status,
          religion: data.religion,
          nationality: data.nationality,
        },
        contactInfo: {
          personalEmail: data.personal_email,
          companyEmail: data.company_email,
          mainContactNo: data.main_contact_no,
          emergencyContactNo: data.emergency_contact_no,
          address: {
            addressLine: data.address_line,
            city: data.city,
            province: data.province,
            zipCode: data.zip_code,
            country: data.country,
          },
        },
        education: {
          schoolName: data.school_name,
          attainment: data.attainment,
          course: data.course,
          yearGraduated: data.year_graduated,
        },
        emergencyContact: {
          name: data.emergency_name,
          relationship: data.emergency_relationship,
          contact: data.emergency_contact,
          address: {
            addressLine: data.emergency_address_line,
            city: data.emergency_city,
            province: data.emergency_province,
            zipCode: data.emergency_zip_code,
            country: data.emergency_country,
          },
        },
        hmoInfo: {
          provider: data.hmo_provider,
          cardNumber: data.hmo_card_number,
          dependents: (data.dependents || []).map((dep) => dep.name).filter(Boolean),
          bloodType: data.blood_type,
          bloodDonationConsent: data.blood_donation_consent,
        },
        governmentIds: {
          ssn: data.ssn,
          tin: data.tin,
          sss: data.sss,
          pagIbig: data.pag_ibig,
          philhealth: data.philhealth,
        },
        payrollInfo: {
          bankName: data.bank_name,
          accountNumber: data.account_number,
          accountName: data.account_name,
        },
      };

      await api.post('/auth/signup', payload);

      setSubmitSuccess('Registration submitted successfully. Redirecting to login in 3 seconds...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Madison 88 Employee Signup</h1>
        <p className="text-gray-600 mb-6">Complete the full registration form to create your employee account.</p>

        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
            <span>{SECTION_TITLES[currentSection]}</span>
            <span>Step {currentVisibleIndex + 1} of {visibleSections.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${((currentVisibleIndex + 1) / visibleSections.length) * 100}%` }}
            />
          </div>
        </div>

        {submitError && <p className="mb-4 text-sm text-red-600">{submitError}</p>}
        {submitSuccess && <p className="mb-4 text-sm text-green-700">{submitSuccess}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {currentSection === 0 && (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...register('agreementAccepted', { required: 'You must agree to continue.' })}
                />
                <span>I agree to the terms and conditions</span>
              </label>
              {errors.agreementAccepted && <p className="text-xs text-red-600">{errors.agreementAccepted.message}</p>}
            </div>
          )}

          {currentSection === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="date" className="input" {...register('date_of_employment', { required: 'Required' })} />
              <select className="input" {...register('classification', { required: 'Required' })}>
                <option value="Regular">Regular</option>
                <option value="Probationary">Probationary</option>
                <option value="Fixed-term">Fixed-term</option>
                <option value="Intern">Intern</option>
              </select>
              <select className="input" {...register('country_of_employment', { required: 'Required' })}>
                <option value="Philippines">Philippines</option>
                <option value="USA">USA</option>
                <option value="Indonesia">Indonesia</option>
              </select>
              <input placeholder="Position title" className="input" {...register('position_title', { required: 'Required' })} />
              <input placeholder="Department" className="input" {...register('department', { required: 'Required' })} />
              <input placeholder="Direct supervisor" className="input" {...register('direct_supervisor', { required: 'Required' })} />
              <input placeholder="Company name" className="input md:col-span-2" {...register('company_name', { required: 'Required' })} />
            </div>
          )}

          {currentSection === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="email"
                placeholder="Email"
                className="input md:col-span-2"
                {...register('email', {
                  required: 'Required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Invalid email format',
                  },
                })}
              />
              <input
                type="password"
                placeholder="Password"
                className="input"
                {...register('password', {
                  required: 'Required',
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/,
                    message: 'Min 8 chars with uppercase, lowercase, number, symbol',
                  },
                })}
              />
              <input
                type="password"
                placeholder="Confirm password"
                className="input"
                {...register('confirm_password', {
                  required: 'Required',
                  validate: (value) => value === watch('password') || 'Passwords do not match',
                })}
              />
            </div>
          )}

          {currentSection === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Given name" className="input" {...register('given_name', { required: 'Required' })} />
              <input placeholder="Middle name" className="input" {...register('middle_name')} />
              <input placeholder="Last name" className="input" {...register('last_name', { required: 'Required' })} />
              <input placeholder="Suffix" className="input" {...register('suffix')} />
              <input type="date" className="input" {...register('date_of_birth', { required: 'Required' })} />
              <select className="input" {...register('sex')}>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
              <select className="input" {...register('civil_status')}>
                <option>Single</option>
                <option>Married</option>
                <option>Annulled</option>
                <option>Divorced</option>
                <option>Widowed</option>
                <option>Legally Separated</option>
              </select>
              <input placeholder="Religion" className="input" {...register('religion')} />
              <input placeholder="Nationality" className="input md:col-span-2" {...register('nationality', { required: 'Required' })} />
            </div>
          )}

          {currentSection === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="email" placeholder="Personal email" className="input" {...register('personal_email', { required: 'Required' })} />
              <input type="email" placeholder="Company email" className="input" {...register('company_email')} />
              <input placeholder="Main contact no" className="input" {...register('main_contact_no', { required: 'Required' })} />
              <input placeholder="Emergency contact no" className="input" {...register('emergency_contact_no', { required: 'Required' })} />
              <input placeholder="Address line" className="input md:col-span-2" {...register('address_line', { required: 'Required' })} />
              <input placeholder="City" className="input" {...register('city', { required: 'Required' })} />
              <input placeholder="Province" className="input" {...register('province', { required: 'Required' })} />
              <input placeholder="Zip code" className="input" {...register('zip_code', { required: 'Required' })} />
              <input placeholder="Country" className="input" {...register('country', { required: 'Required' })} />
            </div>
          )}

          {currentSection === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="School name" className="input" {...register('school_name', { required: 'Required' })} />
              <select className="input" {...register('attainment', { required: 'Required' })}>
                <option>High School</option>
                <option>Vocational</option>
                <option>Associate</option>
                <option>Bachelor's</option>
                <option>Master's</option>
                <option>Doctoral</option>
              </select>
              <input placeholder="Course" className="input" {...register('course', { required: 'Required' })} />
              <input placeholder="Year graduated" className="input" {...register('year_graduated', { required: 'Required' })} />
            </div>
          )}

          {currentSection === 6 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Emergency contact name" className="input" {...register('emergency_name', { required: 'Required' })} />
              <input placeholder="Relationship" className="input" {...register('emergency_relationship', { required: 'Required' })} />
              <input placeholder="Emergency contact number" className="input md:col-span-2" {...register('emergency_contact', { required: 'Required' })} />
              <label className="md:col-span-2 flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register('same_address')} />
                <span>Same address as contact information</span>
              </label>
              <input placeholder="Address line" disabled={sameAddress} className="input md:col-span-2 disabled:bg-gray-100" {...register('emergency_address_line', { required: 'Required' })} />
              <input placeholder="City" disabled={sameAddress} className="input disabled:bg-gray-100" {...register('emergency_city', { required: 'Required' })} />
              <input placeholder="Province" disabled={sameAddress} className="input disabled:bg-gray-100" {...register('emergency_province', { required: 'Required' })} />
              <input placeholder="Zip code" disabled={sameAddress} className="input disabled:bg-gray-100" {...register('emergency_zip_code', { required: 'Required' })} />
              <input placeholder="Country" disabled={sameAddress} className="input disabled:bg-gray-100" {...register('emergency_country', { required: 'Required' })} />
            </div>
          )}

          {currentSection === 7 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder="HMO provider" className="input" {...register('hmo_provider', { required: 'Required' })} />
                <input placeholder="HMO card number" className="input" {...register('hmo_card_number', { required: 'Required' })} />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">Dependents</p>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Controller
                      control={control}
                      name={`dependents.${index}.name`}
                      render={({ field: depField }) => (
                        <input
                          {...depField}
                          placeholder={`Dependent ${index + 1}`}
                          className="input flex-1"
                        />
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => append({ name: '' })}
                  className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg"
                >
                  Add Dependent
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select className="input" {...register('blood_type')}>
                  <option>A+</option>
                  <option>A-</option>
                  <option>B+</option>
                  <option>B-</option>
                  <option>AB+</option>
                  <option>AB-</option>
                  <option>O+</option>
                  <option>O-</option>
                  <option>I don't know</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" {...register('blood_donation_consent')} />
                  <span>I consent to blood donation if needed</span>
                </label>
              </div>
            </div>
          )}

          {currentSection === 8 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="SSN" className="input" {...register('ssn', { required: 'Required' })} />
              <input placeholder="TIN" className="input" {...register('tin', { required: 'Required' })} />
              <input placeholder="SSS" className="input" {...register('sss', { required: 'Required' })} />
              <input placeholder="Pag-IBIG" className="input" {...register('pag_ibig', { required: 'Required' })} />
              <input placeholder="PhilHealth" className="input md:col-span-2" {...register('philhealth', { required: 'Required' })} />
            </div>
          )}

          {currentSection === 9 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input placeholder="Bank name" className="input" {...register('bank_name', { required: 'Required' })} />
              <input placeholder="Account number" className="input" {...register('account_number', { required: 'Required' })} />
              <input placeholder="Account name" className="input md:col-span-2" {...register('account_name', { required: 'Required' })} />
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentVisibleIndex === 0}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-50"
            >
              Back
            </button>

            {!isLastVisibleSection && (
              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                Next
              </button>
            )}

            {isLastVisibleSection && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 text-sm text-gray-600 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-semibold">
            Login
          </Link>
        </p>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          outline: none;
        }
        .input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  );
}
