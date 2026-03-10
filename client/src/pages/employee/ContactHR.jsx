import React, { useState } from 'react';
import api from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  LoadingSpinner,
  Toast,
} from '../../components/ui';
import {
  FileText,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';

const MEETING_TYPES = [
  'performance',
  'grievance',
  'general',
  'onboarding',
  'other',
];

const TARF_EMPLOYMENT_TYPES = [
  'full-time',
  'part-time',
  'contract',
  'remote',
  'hybrid',
];

const OSHA_INCIDENT_TYPES = [
  'injury',
  'near-miss',
  'property-damage',
  'other',
];

const extractErrorMessage = (error, fallback) => {
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return fallback;
};

export default function ContactHR() {
  const [activeTab, setActiveTab] = useState('meeting');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Meeting Request State
  const [meetingForm, setMeetingForm] = useState({
    type: 'general',
    preferredDate: '',
    preferredTime: '',
    location: 'MS Teams',
    subject: '',
    agenda: '',
    preparation: '',
  });

  // TARF Request State
  const [tarfForm, setTarfForm] = useState({
    reportingTo: '',
    department: '',
    positionTitle: '',
    headcountNeeded: '1',
    employmentType: 'full-time',
    roleDescription: '',
    targetStartDate: '',
  });

  // OSHA Report State
  const [oshaForm, setOshaForm] = useState({
    incidentType: 'injury',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    employeesInvolved: '',
    injuries: '',
    immediateActions: '',
    reporterName: '',
    reporterContact: '',
  });

  // Incident Report State
  const [incidentForm, setIncidentForm] = useState({
    incidentType: 'injury',
    incidentDate: '',
    incidentTime: '',
    location: '',
    description: '',
    witnesses: '',
    severity: 'low',
    affectedAreas: '',
    immediateActions: '',
    preventiveMeasures: '',
    reporterName: '',
    reporterContact: '',
  });

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingForm.subject || !meetingForm.preferredDate) {
      setToastMessage('Please fill in required fields');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/requests/meeting', {
        type: meetingForm.type,
        preferredDate: meetingForm.preferredDate,
        preferredTime: meetingForm.preferredTime,
        location: meetingForm.location,
        subject: meetingForm.subject,
        agenda: meetingForm.agenda,
        preparation: meetingForm.preparation,
      });

      setToastType('success');
      setToastMessage('Meeting request submitted successfully');
      setMeetingForm({
        type: 'general',
        preferredDate: '',
        preferredTime: '',
        location: 'MS Teams',
        subject: '',
        agenda: '',
        preparation: '',
      });
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to submit meeting request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTARFSubmit = async (e) => {
    e.preventDefault();
    if (
      !tarfForm.reportingTo ||
      !tarfForm.department ||
      !tarfForm.positionTitle
    ) {
      setToastMessage('Please fill in required fields');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/requests/talent', {
        reportingTo: tarfForm.reportingTo,
        department: tarfForm.department,
        positionTitle: tarfForm.positionTitle,
        headcountNeeded: parseInt(tarfForm.headcountNeeded),
        employmentType: tarfForm.employmentType,
        roleDescription: tarfForm.roleDescription,
        targetStartDate: tarfForm.targetStartDate,
      });

      setToastType('success');
      setToastMessage('TARF request submitted successfully');
      setTarfForm({
        reportingTo: '',
        department: '',
        positionTitle: '',
        headcountNeeded: '1',
        employmentType: 'full-time',
        roleDescription: '',
        targetStartDate: '',
      });
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to submit TARF request'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOshaSubmit = async (e) => {
    e.preventDefault();
    if (!oshaForm.incidentDate || !oshaForm.incidentTime || !oshaForm.incidentLocation || !oshaForm.incidentType || !oshaForm.description) {
      setToastMessage('Please fill in all required fields');
      setToastType('error');
      return;
    }

    if (oshaForm.description.length < 50) {
      setToastMessage('Description must be at least 50 characters');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/reports/osha', {
        incidentDate: oshaForm.incidentDate,
        incidentTime: oshaForm.incidentTime,
        incidentLocation: oshaForm.location,
        incidentType: oshaForm.incidentType === 'injury' ? 'Equipment Injury' : oshaForm.incidentType === 'near-miss' ? 'Near Miss' : oshaForm.incidentType === 'property-damage' ? 'Property Damage' : 'Other',
        description: oshaForm.description,
        witnesses: oshaForm.employeesInvolved || undefined,
        correctiveActions: oshaForm.immediateActions || undefined,
        reportedTo: oshaForm.reporterName || undefined,
      });

      setToastType('success');
      setToastMessage('OSHA report submitted successfully');
      setOshaForm({
        incidentType: 'injury',
        incidentDate: '',
        incidentTime: '',
        location: '',
        description: '',
        employeesInvolved: '',
        injuries: '',
        immediateActions: '',
        reporterName: '',
        reporterContact: '',
      });
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to submit OSHA report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!incidentForm.incidentDate || !incidentForm.incidentTime || !incidentForm.location || !incidentForm.incidentType || !incidentForm.severity || !incidentForm.description || !incidentForm.immediateActions) {
      setToastMessage('Please fill in all required fields');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/reports/incident', {
        incidentDate: incidentForm.incidentDate,
        incidentTime: incidentForm.incidentTime,
        incidentLocation: incidentForm.location,
        incidentType: incidentForm.incidentType === 'injury' ? 'Security Breach' : incidentForm.incidentType === 'near-miss' ? 'Harassment' : incidentForm.incidentType === 'property-damage' ? 'Property Damage' : 'Other',
        severityLevel: incidentForm.severity,
        reportedTo: incidentForm.reporterName || 'HR Department',
        description: incidentForm.description,
        witnesses: incidentForm.witnesses || undefined,
        immediateActionsTaken: incidentForm.immediateActions,
      });

      setToastType('success');
      setToastMessage('Incident report submitted successfully');
      setIncidentForm({
        incidentType: 'injury',
        incidentDate: '',
        incidentTime: '',
        location: '',
        description: '',
        witnesses: '',
        severity: 'low',
        affectedAreas: '',
        immediateActions: '',
        preventiveMeasures: '',
        reporterName: '',
        reporterContact: '',
      });
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to submit incident report'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Contact HR</h1>
        <p className="text-gray-600 mt-2">
          Submit meeting requests, talent acquisition forms, and incident reports
        </p>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}

      <Card>
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex flex-wrap">
            {[
              { id: 'meeting', label: 'Meeting Request', icon: FileText },
              { id: 'tarf', label: 'TARF Request', icon: FileText },
              { id: 'osha', label: 'OSHA Report', icon: AlertTriangle },
              { id: 'incident', label: 'Incident Report', icon: AlertCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Meeting Request Tab */}
          {activeTab === 'meeting' && (
            <form onSubmit={handleMeetingSubmit} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type *
                  </label>
                  <select
                    value={meetingForm.type}
                    onChange={(e) =>
                      setMeetingForm({ ...meetingForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {MEETING_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <select
                    value={meetingForm.location}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        location: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MS Teams">MS Teams</option>
                    <option value="In-person">In-person</option>
                    <option value="Phone Call">Phone Call</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={meetingForm.subject}
                  onChange={(e) =>
                    setMeetingForm({ ...meetingForm, subject: e.target.value })
                  }
                  placeholder="What is the meeting about?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Date *
                  </label>
                  <input
                    type="date"
                    value={meetingForm.preferredDate}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        preferredDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={meetingForm.preferredTime}
                    onChange={(e) =>
                      setMeetingForm({
                        ...meetingForm,
                        preferredTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agenda
                </label>
                <textarea
                  value={meetingForm.agenda}
                  onChange={(e) =>
                    setMeetingForm({ ...meetingForm, agenda: e.target.value })
                  }
                  placeholder="Describe what you want to discuss"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparation (Optional)
                </label>
                <textarea
                  value={meetingForm.preparation}
                  onChange={(e) =>
                    setMeetingForm({
                      ...meetingForm,
                      preparation: e.target.value,
                    })
                  }
                  placeholder="Any materials or information needed before the meeting?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Meeting Request'}
              </button>
            </form>
          )}

          {/* TARF Request Tab */}
          {activeTab === 'tarf' && (
            <form onSubmit={handleTARFSubmit} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reporting To *
                  </label>
                  <input
                    type="text"
                    value={tarfForm.reportingTo}
                    onChange={(e) =>
                      setTarfForm({ ...tarfForm, reportingTo: e.target.value })
                    }
                    placeholder="Manager name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    value={tarfForm.department}
                    onChange={(e) =>
                      setTarfForm({ ...tarfForm, department: e.target.value })
                    }
                    placeholder="e.g., Engineering, Sales"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Title *
                </label>
                <input
                  type="text"
                  value={tarfForm.positionTitle}
                  onChange={(e) =>
                    setTarfForm({ ...tarfForm, positionTitle: e.target.value })
                  }
                  placeholder="Job title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Headcount Needed *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={tarfForm.headcountNeeded}
                    onChange={(e) =>
                      setTarfForm({
                        ...tarfForm,
                        headcountNeeded: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <select
                    value={tarfForm.employmentType}
                    onChange={(e) =>
                      setTarfForm({
                        ...tarfForm,
                        employmentType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TARF_EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role Description *
                </label>
                <textarea
                  value={tarfForm.roleDescription}
                  onChange={(e) =>
                    setTarfForm({
                      ...tarfForm,
                      roleDescription: e.target.value,
                    })
                  }
                  placeholder="Describe the role responsibilities and requirements"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Start Date
                </label>
                <input
                  type="date"
                  value={tarfForm.targetStartDate}
                  onChange={(e) =>
                    setTarfForm({
                      ...tarfForm,
                      targetStartDate: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit TARF Request'}
              </button>
            </form>
          )}

          {/* OSHA Report Tab */}
          {activeTab === 'osha' && (
            <form onSubmit={handleOshaSubmit} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Type *
                  </label>
                  <select
                    value={oshaForm.incidentType}
                    onChange={(e) =>
                      setOshaForm({ ...oshaForm, incidentType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="injury">Equipment Injury</option>
                    <option value="near-miss">Near Miss</option>
                    <option value="property-damage">Property Damage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Date *
                  </label>
                  <input
                    type="date"
                    value={oshaForm.incidentDate}
                    onChange={(e) =>
                      setOshaForm({ ...oshaForm, incidentDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Time *
                  </label>
                  <input
                    type="time"
                    value={oshaForm.incidentTime}
                    onChange={(e) =>
                      setOshaForm({ ...oshaForm, incidentTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={oshaForm.location}
                    onChange={(e) =>
                      setOshaForm({ ...oshaForm, location: e.target.value })
                    }
                    placeholder="Where did the incident occur?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description of Incident * (min. 50 characters)
                </label>
                <textarea
                  value={oshaForm.description}
                  onChange={(e) =>
                    setOshaForm({ ...oshaForm, description: e.target.value })
                  }
                  placeholder="Describe what happened in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Witnesses/Employees Involved
                  </label>
                  <input
                    type="text"
                    value={oshaForm.employeesInvolved}
                    onChange={(e) =>
                      setOshaForm({
                        ...oshaForm,
                        employeesInvolved: e.target.value,
                      })
                    }
                    placeholder="Names or employee IDs"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Injuries (if any)
                  </label>
                  <input
                    type="text"
                    value={oshaForm.injuries}
                    onChange={(e) =>
                      setOshaForm({ ...oshaForm, injuries: e.target.value })
                    }
                    placeholder="Describe injuries if any"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corrective/Immediate Actions Taken
                </label>
                <textarea
                  value={oshaForm.immediateActions}
                  onChange={(e) =>
                    setOshaForm({
                      ...oshaForm,
                      immediateActions: e.target.value,
                    })
                  }
                  placeholder="What was done to address the incident?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reported To (Name)
                  </label>
                  <input
                    type="text"
                    value={oshaForm.reporterName}
                    onChange={(e) =>
                      setOshaForm({ ...oshaForm, reporterName: e.target.value })
                    }
                    placeholder="Manager or supervisor name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    value={oshaForm.reporterContact}
                    onChange={(e) =>
                      setOshaForm({
                        ...oshaForm,
                        reporterContact: e.target.value,
                      })
                    }
                    placeholder="Phone or email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit OSHA Report'}
              </button>
            </form>
          )}

          {/* Incident Report Tab */}
          {activeTab === 'incident' && (
            <form onSubmit={handleIncidentSubmit} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Type *
                  </label>
                  <select
                    value={incidentForm.incidentType}
                    onChange={(e) =>
                      setIncidentForm({
                        ...incidentForm,
                        incidentType: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="injury">Workplace Violence</option>
                    <option value="near-miss">Harassment</option>
                    <option value="property-damage">Property Damage</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity Level *
                  </label>
                  <select
                    value={incidentForm.severity}
                    onChange={(e) =>
                      setIncidentForm({
                        ...incidentForm,
                        severity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Date *
                  </label>
                  <input
                    type="date"
                    value={incidentForm.incidentDate}
                    onChange={(e) =>
                      setIncidentForm({
                        ...incidentForm,
                        incidentDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Time *
                  </label>
                  <input
                    type="time"
                    value={incidentForm.incidentTime}
                    onChange={(e) =>
                      setIncidentForm({
                        ...incidentForm,
                        incidentTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={incidentForm.location}
                  onChange={(e) =>
                    setIncidentForm({ ...incidentForm, location: e.target.value })
                  }
                  placeholder="Where did the incident occur?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Incident Description *
                </label>
                <textarea
                  value={incidentForm.description}
                  onChange={(e) =>
                    setIncidentForm({
                      ...incidentForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe what happened in detail..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Witnesses
                </label>
                <textarea
                  value={incidentForm.witnesses}
                  onChange={(e) =>
                    setIncidentForm({
                      ...incidentForm,
                      witnesses: e.target.value,
                    })
                  }
                  placeholder="Names of witnesses"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immediate Actions Taken *
                </label>
                <textarea
                  value={incidentForm.immediateActions}
                  onChange={(e) =>
                    setIncidentForm({
                      ...incidentForm,
                      immediateActions: e.target.value,
                    })
                  }
                  placeholder="What was done immediately?"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reported To (Name/Title)
                </label>
                <input
                  type="text"
                  value={incidentForm.reporterName}
                  onChange={(e) =>
                    setIncidentForm({
                      ...incidentForm,
                      reporterName: e.target.value,
                    })
                  }
                  placeholder="Manager or HR contact"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Incident Report'}
              </button>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
