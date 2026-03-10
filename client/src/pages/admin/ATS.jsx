import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Toast,
} from '../../components/ui';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS = {
  applied: 'bg-slate-100 border-slate-200',
  screening: 'bg-blue-50 border-blue-200',
  interview: 'bg-indigo-50 border-indigo-200',
  offer: 'bg-amber-50 border-amber-200',
  hired: 'bg-emerald-50 border-emerald-200',
  rejected: 'bg-rose-50 border-rose-200',
};

const STAGE_OPTIONS = STAGES.map((stage) => ({
  value: stage,
  label: stage.charAt(0).toUpperCase() + stage.slice(1),
}));

const extractErrorMessage = (error, fallbackMessage) => {
  if (typeof error?.response?.data?.error === 'string') {
    return error.response.data.error;
  }
  if (typeof error?.response?.data?.error?.message === 'string') {
    return error.response.data.error.message;
  }
  if (typeof error?.response?.data?.message === 'string') {
    return error.response.data.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return fallbackMessage;
};

export default function ATS() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [jobFilter, setJobFilter] = useState('');
  const [jobs, setJobs] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [newStage, setNewStage] = useState('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    fetchApplications();
    fetchJobs();
  }, [jobFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      const params = jobFilter ? `?jobId=${jobFilter}` : '';
      const response = await api.get(`/applications/admin/all${params}`);
      const appData = response.data.data || [];
      setApplications(appData);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Failed to load applications.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setErrorMessage('');
      const response = await api.get('/jobs/admin/all');
      const jobData = response.data.data || [];
      setJobs(jobData);
    } catch (err) {
      setErrorMessage(extractErrorMessage(err, 'Failed to load jobs.'));
    }
  };

  const handleStageUpdate = async () => {
    if (!newStage || !selectedApp?._id) return;

    try {
      setIsUpdatingStage(true);
      await api.patch(`/applications/${selectedApp._id}/stage`, {
        newStage,
        notes: noteText,
      });

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app._id === selectedApp._id
            ? { ...app, stage: newStage }
            : app
        )
      );

      setSelectedApp((prev) => ({ ...prev, stage: newStage }));
      setNewStage('');
      setNoteText('');
      setToastType('success');
      setToastMessage('Application stage updated successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to update stage.'));
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedApp?._id) return;

    try {
      setIsAddingNote(true);
      const response = await api.post(`/applications/${selectedApp._id}/notes`, {
        text: noteText,
      });

      setSelectedApp(response.data.data);
      setNoteText('');
      setToastType('success');
      setToastMessage('Note added successfully.');
    } catch (err) {
      setToastType('error');
      setToastMessage(extractErrorMessage(err, 'Failed to add note.'));
    } finally {
      setIsAddingNote(false);
    }
  };

  const getApplicationsByStage = (stage) => {
    return applications.filter((app) => app.stage === stage);
  };

  const getJobTitle = (jobId) => {
    const job = jobs.find((j) => j._id === jobId);
    return job?.title || 'Unknown Job';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <PageHeader
            title="ATS Pipeline"
            subtitle="Review applicants by stage and update progression"
          />

          <select
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {errorMessage ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{errorMessage}</p>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {STAGES.map((stage) => (
              <Card key={stage} className={`${STAGE_COLORS[stage]} border min-h-80 p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-gray-900 capitalize">{stage}</h2>
                  <Badge status={stage === 'hired' ? 'hired' : stage === 'rejected' ? 'rejected' : stage === 'interview' ? 'interview' : 'pending'} label={String(getApplicationsByStage(stage).length)} />
                </div>

                <div className="space-y-2">
                  {getApplicationsByStage(stage).map((app) => (
                    <div
                      key={app._id}
                      onClick={() => setSelectedApp(app)}
                      className={`bg-white p-3 rounded border-2 cursor-pointer transition ${
                        selectedApp?._id === app._id
                          ? 'border-blue-500 shadow-md'
                          : 'border-transparent hover:shadow'
                      }`}
                    >
                      <p className="font-semibold text-sm text-gray-900">
                        {app.fullName}
                      </p>
                      <p className="text-xs text-gray-600">{app.email}</p>
                      <p className="text-xs text-gray-500">
                        {getJobTitle(app.jobId)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedApp ? (
          <Modal isOpen={true} onClose={() => setSelectedApp(null)} title={selectedApp.fullName} size="xl">
            <div className="space-y-5">
              <Card className="bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <p><span className="font-semibold">Email:</span> {selectedApp.email}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedApp.phone}</p>
                  <p><span className="font-semibold">Job:</span> {getJobTitle(selectedApp.jobId)}</p>
                  <p><span className="font-semibold">Applied:</span> {new Date(selectedApp.createdAt).toLocaleDateString()}</p>
                </div>
              </Card>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Change Stage</h3>
                <Select
                  name="stage"
                  value={newStage}
                  onChange={(event) => setNewStage(event.target.value)}
                  options={STAGE_OPTIONS}
                />
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Optional notes for this stage update"
                  rows={3}
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
                <div className="mt-3">
                  <Button onClick={handleStageUpdate} isDisabled={!newStage} isLoading={isUpdatingStage}>
                    Update Stage
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Add Note</h3>
                <textarea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  placeholder="Add recruiter note"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
                <div className="mt-3">
                  <Button onClick={handleAddNote} variant="secondary" isDisabled={!noteText.trim()} isLoading={isAddingNote}>
                    Save Note
                  </Button>
                </div>
              </div>

              {selectedApp.notes && selectedApp.notes.length > 0 ? (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">History</h3>
                  <div className="space-y-2">
                    {selectedApp.notes.map((note, idx) => (
                      <Card key={idx} className="bg-gray-50 border border-gray-200">
                        <p className="text-sm text-gray-700">{note.text}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {note.createdBy} - {new Date(note.createdAt).toLocaleDateString()}
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </Modal>
        ) : null}
      </div>

      {toastMessage ? (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      ) : null}
    </div>
  );
}
