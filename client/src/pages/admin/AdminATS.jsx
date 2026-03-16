import React, { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import {
  Badge,
  Button,
  Card,
  Input,
  LoadingSpinner,
  Modal,
  PageHeader,
  Select,
  Table,
  Toast,
} from '../../components/ui';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS = {
  applied: 'bg-slate-50 border-slate-200',
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

const VIEW_OPTIONS = [
  { value: 'pipeline', label: 'Pipeline' },
  { value: 'table', label: 'Candidates' },
  { value: 'list', label: 'List' },
  { value: 'insights', label: 'Insights' },
];

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

const getStageBadgeStatus = (stage) => {
  if (stage === 'hired') return 'hired';
  if (stage === 'rejected') return 'rejected';
  if (stage === 'interview') return 'interview';
  if (stage === 'offer') return 'offer';
  if (stage === 'screening') return 'screening';
  return 'applied';
};

const normalizeText = (value) => {
  if (typeof value !== 'string') return '';
  return value.toLowerCase();
};

export default function ATS() {
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);

  const [selectedApp, setSelectedApp] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);

  const [jobFilter, setJobFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState('pipeline');

  const [newStage, setNewStage] = useState('');
  const [stageNote, setStageNote] = useState('');
  const [newNoteText, setNewNoteText] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [jobFilter, stageFilter]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');

      const params = new URLSearchParams();
      if (jobFilter) params.set('jobId', jobFilter);
      if (stageFilter) params.set('stage', stageFilter);

      const query = params.toString();
      const path = query
        ? `/applications/admin/all?${query}`
        : '/applications/admin/all';

      const response = await api.get(path);
      const appData = Array.isArray(response?.data?.data) ? response.data.data : [];
      setApplications(appData);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Failed to load applications.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      setErrorMessage('');
      const response = await api.get('/jobs/admin/all');
      const jobData = Array.isArray(response?.data?.data) ? response.data.data : [];
      setJobs(jobData);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, 'Failed to load jobs.'));
    }
  };

  const displayedApplications = useMemo(() => {
    const searchValue = normalizeText(searchFilter);

    return applications.filter((app) => {
      if (!searchValue) return true;

      const name = normalizeText(app.fullName);
      const email = normalizeText(app.email);
      const phone = normalizeText(app.phone);
      const stage = normalizeText(app.stage);

      return (
        name.includes(searchValue) ||
        email.includes(searchValue) ||
        phone.includes(searchValue) ||
        stage.includes(searchValue)
      );
    });
  }, [applications, searchFilter]);

  const stageCounts = useMemo(() => {
    return STAGES.reduce((acc, stage) => {
      acc[stage] = displayedApplications.filter((app) => app.stage === stage).length;
      return acc;
    }, {});
  }, [displayedApplications]);

  const dashboardStats = useMemo(() => {
    const total = displayedApplications.length;
    const shortlisted = stageCounts.screening + stageCounts.interview + stageCounts.offer;
    const hired = stageCounts.hired;
    const rejected = stageCounts.rejected;
    const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;

    return {
      total,
      shortlisted,
      hired,
      rejected,
      conversionRate,
    };
  }, [displayedApplications, stageCounts]);

  const jobOptions = useMemo(() => {
    return jobs.map((job) => ({
      value: job._id,
      label: job.title,
    }));
  }, [jobs]);

  const tableColumns = useMemo(() => {
    return [
      {
        key: 'candidate',
        label: 'Candidate',
        render: (row) => (
          <div>
            <p className="font-semibold text-slate-900">{row.fullName || 'Unknown'}</p>
            <p className="text-xs text-slate-500">{row.email || 'No email'}</p>
          </div>
        ),
      },
      {
        key: 'job',
        label: 'Job',
        render: (row) => {
          const title = getJobTitle(row.jobId);
          return <span className="text-sm text-slate-700">{title}</span>;
        },
      },
      {
        key: 'stage',
        label: 'Stage',
        render: (row) => (
          <Badge
            status={getStageBadgeStatus(row.stage)}
            label={row.stage ? row.stage.charAt(0).toUpperCase() + row.stage.slice(1) : 'Applied'}
          />
        ),
      },
      {
        key: 'createdAt',
        label: 'Applied',
        render: (row) => (
          <span className="text-sm text-slate-600">
            {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Action',
        render: (row) => (
          <Button size="sm" variant="secondary" onClick={() => setSelectedApp(row)}>
            Open
          </Button>
        ),
      },
    ];
  }, [jobs]);

  const handleStageUpdate = async () => {
    if (!newStage || !selectedApp?._id) return;

    try {
      setIsUpdatingStage(true);
      await api.patch(`/applications/${selectedApp._id}/stage`, {
        newStage,
        notes: stageNote,
      });

      setApplications((prev) =>
        prev.map((app) =>
          app._id === selectedApp._id
            ? { ...app, stage: newStage }
            : app
        )
      );

      setSelectedApp((prev) => (prev ? { ...prev, stage: newStage } : prev));
      setNewStage('');
      setStageNote('');
      setToastType('success');
      setToastMessage('Application stage updated successfully.');
    } catch (error) {
      setToastType('error');
      setToastMessage(extractErrorMessage(error, 'Failed to update stage.'));
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim() || !selectedApp?._id) return;

    try {
      setIsAddingNote(true);
      const response = await api.post(`/applications/${selectedApp._id}/notes`, {
        text: newNoteText,
      });

      const updatedApp = response?.data?.data;
      setSelectedApp(updatedApp || selectedApp);

      if (updatedApp?._id) {
        setApplications((prev) =>
          prev.map((app) => (app._id === updatedApp._id ? updatedApp : app))
        );
      }

      setNewNoteText('');
      setToastType('success');
      setToastMessage('Note added successfully.');
    } catch (error) {
      setToastType('error');
      setToastMessage(extractErrorMessage(error, 'Failed to add note.'));
    } finally {
      setIsAddingNote(false);
    }
  };

  const getApplicationsByStage = (stage) => {
    return displayedApplications.filter((app) => app.stage === stage);
  };

  const getJobTitle = (jobId) => {
    const id = typeof jobId === 'string' ? jobId : jobId?._id;
    const job = jobs.find((item) => item._id === id);
    return job?.title || 'Unknown Job';
  };

  const selectedAppNotes = Array.isArray(selectedApp?.notes) ? selectedApp.notes : [];

  return (
    <div className="space-y-5">
        <PageHeader
          title="ATS Dashboard"
          subtitle="Manage applicants, track pipeline health, and drive hiring decisions"
        />

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5 overflow-hidden">
          {[
            { label: 'Total', value: dashboardStats.total },
            { label: 'Shortlisted', value: dashboardStats.shortlisted },
            { label: 'Hired', value: dashboardStats.hired },
            { label: 'Rejected', value: dashboardStats.rejected },
            { label: 'Conversion', value: `${dashboardStats.conversionRate}%` },
          ].map((stat) => (
            <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">{stat.label}</p>
              <p className="text-[#223B5B] font-bold text-3xl">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 shadow-sm">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[140px]">
              <p className="text-xs font-medium text-slate-500 mb-1">Job</p>
              <Select
                label=""
                name="jobFilter"
                value={jobFilter}
                onChange={(event) => setJobFilter(event.target.value)}
                options={[{ value: '', label: 'All Jobs' }, ...jobOptions]}
              />
            </div>
            <div className="flex-1 min-w-[130px]">
              <p className="text-xs font-medium text-slate-500 mb-1">Stage</p>
              <Select
                label=""
                name="stageFilter"
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                options={[{ value: '', label: 'All Stages' }, ...STAGE_OPTIONS]}
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <p className="text-xs font-medium text-slate-500 mb-1">Search</p>
              <Input
                label=""
                name="searchFilter"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                placeholder="Name, email, phone..."
              />
            </div>
            <div className="flex gap-2 pb-0.5">
              {VIEW_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setViewMode(opt.value)}
                  className={[
                    'px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap',
                    viewMode === opt.value
                      ? 'bg-[#223B5B] border-[#223B5B] text-white'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-[#223B5B] hover:text-[#223B5B]',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <Card className="border border-red-200 bg-red-50">
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </Card>
        ) : null}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : viewMode === 'pipeline' ? (
          <div className="overflow-x-auto pb-2">
            <div className="flex gap-3 min-w-max">
            {STAGES.map((stage) => {
              const stageItems = getApplicationsByStage(stage);
              return (
                <Card key={stage} className={`${STAGE_COLORS[stage]} border p-4 w-64 flex-shrink-0 rounded-xl`}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-slate-900 capitalize">{stage}</h2>
                    <Badge
                      status={getStageBadgeStatus(stage)}
                      label={String(stageItems.length)}
                    />
                  </div>

                  <div className="space-y-2 max-h-[480px] overflow-auto pr-1">
                    {stageItems.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No candidates</p>
                    ) : (
                      stageItems.map((app) => {
                        const name = app.fullName || 'Unknown';
                        const email = app.email || '';
                        const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

                        return (
                          <div
                            key={app._id}
                            onClick={() => setSelectedApp(app)}
                            className={[
                              'bg-white p-4 rounded-xl border cursor-pointer transition-all hover:shadow-sm',
                              selectedApp?._id === app._id
                                ? 'border-slate-900 shadow-md'
                                : 'border-slate-200 hover:border-slate-300',
                            ].join(' ')}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-7 h-7 rounded-full bg-[#223B5B] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-slate-900 truncate">{name}</p>
                                <p className="text-[10px] text-slate-400 truncate">{email}</p>
                              </div>
                            </div>
                            <p className="inline-flex max-w-full items-center rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-[#223B5B] truncate mb-2 border border-slate-200">{getJobTitle(app.jobId)}</p>
                            <p className="text-[10px] text-slate-400">
                              {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              );
            })}
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <Card className="border border-slate-200 shadow-sm p-0 overflow-hidden">
            <Table
              columns={tableColumns}
              data={displayedApplications}
              isLoading={false}
              emptyMessage="No applications found for current filters"
            />
          </Card>
        ) : viewMode === 'list' ? (
          <div className="flex gap-4 items-start">

            <div className={`flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden transition-all ${sidebarOpen ? 'max-w-[calc(100%-320px)]' : 'w-full'}`}>
              <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                <div className="col-span-3">Candidate</div>
                <div className="col-span-3">Job</div>
                <div className="col-span-2">Stage</div>
                <div className="col-span-2">Applied</div>
                <div className="col-span-2">Resume</div>
              </div>

              <div className="divide-y divide-slate-100">
                {displayedApplications.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm">No applications found</div>
                ) : displayedApplications.map((app) => {
                  const isExpanded = expandedRowId === app._id;
                  const isSelected = selectedApp?._id === app._id;
                  const initials = (app.fullName || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <div key={app._id} className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                      <div
                        className="grid grid-cols-12 gap-4 px-5 py-4 cursor-pointer items-center"
                        onClick={() => {
                          setExpandedRowId(isExpanded ? null : app._id);
                          setSelectedApp(app);
                          setSidebarOpen(true);
                          setNewStage('');
                          setStageNote('');
                          setNewNoteText('');
                        }}
                      >
                        <div className="col-span-3 flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{app.fullName || 'Unknown'}</p>
                            <p className="text-xs text-slate-400 truncate">{app.email}</p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-sm text-slate-700 truncate">{getJobTitle(app.jobId)}</p>
                        </div>
                        <div className="col-span-2">
                          <Badge status={getStageBadgeStatus(app.stage)} label={app.stage ? app.stage.charAt(0).toUpperCase() + app.stage.slice(1) : 'Applied'} />
                        </div>
                        <div className="col-span-2">
                          <p className="text-sm text-slate-500">{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div className="col-span-2 flex items-center gap-2">
                          {app.resumeUrl ? (
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-blue-600 hover:underline">View</a>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                          <span className="ml-auto text-slate-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="px-5 pb-5 pt-1 bg-slate-50 border-t border-slate-100">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                              { label: 'Phone', value: app.phone || 'N/A' },
                              { label: 'Applied Date', value: app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A' },
                              { label: 'Current Stage', value: app.stage ? app.stage.charAt(0).toUpperCase() + app.stage.slice(1) : 'Applied' },
                              { label: 'Cover Letter', value: app.coverLetter ? 'Provided' : 'Not provided' },
                            ].map((field) => (
                              <div key={field.label} className="bg-white rounded-lg px-4 py-3 border border-slate-100">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{field.label}</p>
                                <p className="text-sm font-semibold text-slate-800">{field.value}</p>
                              </div>
                            ))}
                          </div>
                          {app.notes && app.notes.length > 0 ? (
                            <div className="mt-3 bg-white rounded-lg px-4 py-3 border border-slate-100">
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Latest Note</p>
                              <p className="text-sm text-slate-700">{app.notes[app.notes.length - 1]?.text || '-'}</p>
                              <p className="text-xs text-slate-400 mt-1">{app.notes[app.notes.length - 1]?.createdBy || 'Unknown'}</p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {sidebarOpen && selectedApp ? (
              <div className="w-72 flex-shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-[#223B5B] text-white">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{selectedApp.fullName || 'Unknown'}</p>
                    <p className="text-xs text-white/60 truncate">{selectedApp.email}</p>
                  </div>
                  <button onClick={() => { setSidebarOpen(false); setSelectedApp(null); setExpandedRowId(null); }} className="text-white/60 hover:text-white ml-2 flex-shrink-0">✕</button>
                </div>

                <div className="p-4 space-y-4 overflow-y-auto max-h-[600px]">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Current Stage</p>
                    <Badge status={getStageBadgeStatus(selectedApp.stage)} label={selectedApp.stage ? selectedApp.stage.charAt(0).toUpperCase() + selectedApp.stage.slice(1) : 'Applied'} />
                  </div>

                  <div className="border-t border-slate-100" />

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Update Stage</p>
                    <Select label="" name="stage" value={newStage} onChange={(e) => setNewStage(e.target.value)} options={[{ value: '', label: 'Select stage...' }, ...STAGE_OPTIONS]} />
                    <textarea
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Optional note..."
                      rows={2}
                      className="mt-2 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <Button onClick={handleStageUpdate} isDisabled={!newStage} isLoading={isUpdatingStage} className="mt-2 w-full">
                      Update Stage
                    </Button>
                  </div>

                  <div className="border-t border-slate-100" />

                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Add Note</p>
                    <textarea
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      placeholder="Recruiter note..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                    <Button onClick={handleAddNote} variant="secondary" isDisabled={!newNoteText.trim()} isLoading={isAddingNote} className="mt-2 w-full">
                      Save Note
                    </Button>
                  </div>

                  {Array.isArray(selectedApp.notes) && selectedApp.notes.length > 0 ? (
                    <>
                      <div className="border-t border-slate-100" />
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">History</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {selectedApp.notes.map((note, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                              <p className="text-xs text-slate-700">{note.text || ''}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{note.createdBy || 'Unknown'} · {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {STAGES.map((stage) => (
              <Card key={stage} className="border border-slate-200 shadow-sm">
                <p className="text-[11px] uppercase tracking-wide text-slate-500">{stage}</p>
                <p className="text-3xl font-bold text-[#223B5B] mt-1">{stageCounts[stage] || 0}</p>
                <div className="mt-3">
                  <Badge
                    status={getStageBadgeStatus(stage)}
                    label={`${dashboardStats.total > 0 ? Math.round(((stageCounts[stage] || 0) / dashboardStats.total) * 100) : 0}% of pipeline`}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedApp && viewMode !== 'list' ? (
          <Modal
            isOpen={true}
            onClose={() => setSelectedApp(null)}
            title={selectedApp.fullName || 'Candidate Details'}
            size="xl"
          >
            <div className="space-y-4">

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="w-11 h-11 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {(selectedApp.fullName || 'U').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-slate-900">{selectedApp.fullName || 'Unknown'}</p>
                  <p className="text-sm text-slate-500">{selectedApp.email || 'No email'}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge
                      status={getStageBadgeStatus(selectedApp.stage)}
                      label={selectedApp.stage || 'applied'}
                    />
                    {selectedApp.resumeUrl ? (
                      <a
                        href={selectedApp.resumeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-600 underline"
                      >
                        View Resume
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Card className="bg-slate-50 border border-slate-200 shadow-none">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Candidate info</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 flex-shrink-0">Phone</span>
                      <span className="font-medium text-slate-800 text-right truncate">{selectedApp.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 flex-shrink-0">Job</span>
                      <span className="font-medium text-slate-800 text-right truncate">{getJobTitle(selectedApp.jobId)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-500 flex-shrink-0">Applied</span>
                      <span className="font-medium text-slate-800">
                        {selectedApp.createdAt ? new Date(selectedApp.createdAt).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="bg-slate-50 border border-slate-200 shadow-none">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Update stage</p>
                  <Select
                    label=""
                    name="stage"
                    value={newStage}
                    onChange={(event) => setNewStage(event.target.value)}
                    options={[{ value: '', label: 'Select new stage...' }, ...STAGE_OPTIONS]}
                  />
                  <textarea
                    value={stageNote}
                    onChange={(event) => setStageNote(event.target.value)}
                    placeholder="Optional notes for this stage change"
                    rows={2}
                    className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm resize-none"
                  />
                  <div className="mt-2">
                    <Button
                      onClick={handleStageUpdate}
                      isDisabled={!newStage}
                      isLoading={isUpdatingStage}
                    >
                      Update Stage
                    </Button>
                  </div>
                </Card>
              </div>

              <Card className="border border-slate-200 shadow-none">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">Add note</p>
                <textarea
                  value={newNoteText}
                  onChange={(event) => setNewNoteText(event.target.value)}
                  placeholder="Add a recruiter note about this candidate..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 text-sm resize-none"
                />
                <div className="mt-2">
                  <Button
                    onClick={handleAddNote}
                    variant="secondary"
                    isDisabled={!newNoteText.trim()}
                    isLoading={isAddingNote}
                  >
                    Save Note
                  </Button>
                </div>
              </Card>

              {selectedAppNotes.length > 0 ? (
                <Card className="border border-slate-200 shadow-none">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold mb-3">History</p>
                  <div className="space-y-0 max-h-48 overflow-auto pr-1">
                    {selectedAppNotes.map((note, idx) => (
                      <div key={idx} className="flex gap-3 py-2.5 border-b border-slate-100 last:border-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-700">{note.text || ''}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {note.createdBy || 'Unknown'} · {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : (
                <Card className="bg-slate-50 border border-slate-200 shadow-none">
                  <p className="text-sm text-slate-400 text-center py-1">No notes yet for this candidate.</p>
                </Card>
              )}
            </div>
          </Modal>
        ) : null}

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
