import React, { useCallback, useEffect, useState } from 'react';
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
  ChevronUp,
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
  const [myRequests, setMyRequests] = useState([]);
  const [isLoadingReqs, setIsLoadingReqs] = useState(false);
  const [reqError, setReqError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

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

  const fetchMyRequests = useCallback(async () => {
    try {
      setIsLoadingReqs(true);
      setReqError('');
      const res = await api.get('/requests/my');
      setMyRequests(res.data.data || []);
    } catch (err) {
      setReqError(extractErrorMessage(err, 'Failed to load your requests'));
    } finally {
      setIsLoadingReqs(false);
    }
  }, []);

  useEffect(() => {
    fetchMyRequests();
  }, [fetchMyRequests]);

  const handleMeetingSubmit = async (e) => {
    e.preventDefault();
    if (!meetingForm.subject.trim()) {
      setToastMessage('Subject is required');
      setToastType('error');
      return;
    }
    if (!meetingForm.preferredDate) {
      setToastMessage('Preferred date is required');
      setToastType('error');
      return;
    }
    if (!meetingForm.preferredTime) {
      setToastMessage('Preferred time is required');
      setToastType('error');
      return;
    }
    if (!meetingForm.agenda.trim()) {
      setToastMessage('Agenda is required');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/requests', {
        type: 'meeting',
        subject: `Meeting Request - ${meetingForm.preferredDate}`,
        message: meetingForm.agenda || meetingForm.subject,
        date: meetingForm.preferredDate || undefined,
        priority: 'normal',
      });

      setToastType('success');
      setToastMessage('Meeting request submitted successfully');
      fetchMyRequests();
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
    if (!tarfForm.reportingTo.trim()) {
      setToastMessage('Reporting To is required');
      setToastType('error');
      return;
    }
    if (!tarfForm.department.trim()) {
      setToastMessage('Department is required');
      setToastType('error');
      return;
    }
    if (!tarfForm.positionTitle.trim()) {
      setToastMessage('Position Title is required');
      setToastType('error');
      return;
    }
    if (!tarfForm.targetStartDate) {
      setToastMessage('Target start date is required');
      setToastType('error');
      return;
    }
    if (!tarfForm.roleDescription.trim()) {
      setToastMessage('Role Description is required');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/requests', {
        type: 'talent',
        subject: `TARF Request - ${tarfForm.positionTitle} - ${tarfForm.targetStartDate}`,
        message: tarfForm.roleDescription,
        date: tarfForm.targetStartDate || undefined,
        priority: 'normal',
      });

      setToastType('success');
      setToastMessage('TARF request submitted successfully');
      fetchMyRequests();
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
    if (!oshaForm.incidentDate || !oshaForm.incidentTime || !oshaForm.location.trim() || !oshaForm.incidentType || !oshaForm.description.trim()) {
      setToastMessage('Please fill in all required fields');
      setToastType('error');
      return;
    }

    if (oshaForm.description.trim().length < 50) {
      setToastMessage('Description must be at least 50 characters');
      setToastType('error');
      return;
    }
    if (!oshaForm.injuries.trim()) {
      setToastMessage('Injuries field is required');
      setToastType('error');
      return;
    }
    if (!oshaForm.immediateActions.trim()) {
      setToastMessage('Corrective/Immediate Actions are required');
      setToastType('error');
      return;
    }
    if (!oshaForm.reporterName.trim()) {
      setToastMessage('Reported To name is required');
      setToastType('error');
      return;
    }
    if (!oshaForm.reporterContact.trim()) {
      setToastMessage('Contact Information is required');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/requests', {
        type: 'incident',
        subject: `OSHA Report - ${oshaForm.incidentDate}`,
        message: oshaForm.description,
        date: oshaForm.incidentDate || undefined,
        priority: 'urgent',
      });

      setToastType('success');
      setToastMessage('OSHA report submitted successfully');
      fetchMyRequests();
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
    if (!incidentForm.incidentDate || !incidentForm.incidentTime || !incidentForm.location.trim() || !incidentForm.incidentType || !incidentForm.severity || !incidentForm.description.trim() || !incidentForm.immediateActions.trim()) {
      setToastMessage('Please fill in all required fields');
      setToastType('error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/requests', {
        type: 'incident',
        subject: `Incident Report - ${incidentForm.incidentType} - ${incidentForm.incidentDate}`,
        message: incidentForm.description,
        date: incidentForm.incidentDate || undefined,
        priority: incidentForm.severity === 'critical' || incidentForm.severity === 'high' ? 'urgent' : 'normal',
      });

      setToastType('success');
      setToastMessage('Incident report submitted successfully');
      fetchMyRequests();
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Time *
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
                  Agenda *
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
                  Target Start Date *
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
                    Witnesses/Employees Involved — Optional
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
                    Injuries (if any) *
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
                  Corrective/Immediate Actions Taken *
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
                    Reported To (Name) *
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
                    Contact Information *
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
                  Witnesses — Optional
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
                  Reported To (Name/Title) — Optional
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

      <div className="mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">My Submissions</h2>

        {isLoadingReqs ? (
          <LoadingSpinner />
        ) : reqError ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
            {reqError}
          </div>
        ) : myRequests.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center text-gray-500 text-sm">
            No requests submitted yet.
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req) => (
              <div key={req._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      req.status === 'approved' ? 'bg-green-100 text-green-800'
                      : req.status === 'rejected' ? 'bg-red-100 text-red-800'
                      : req.status === 'reviewed' ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status || 'pending'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{req.subject}</p>
                      <p className="text-xs text-gray-400">
                        {req.type} · {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {expandedId === req._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {expandedId === req._id ? (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.message}</p>
                    {req.adminNote ? (
                      <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-700 mb-1">HR Response</p>
                        <p className="text-sm text-blue-800">{req.adminNote}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
