import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import {
  LoadingSpinner,
  Button,
  Badge,
  Modal,
  Table,
  Toast,
  PageHeader,
  Select,
  Input,
  StatusBadge,
} from '../../components/ui';

// Stage definitions
const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];
const STAGE_COLORS = {
  applied: 'bg-gray-100 text-gray-700',
  screening: 'bg-yellow-100 text-yellow-800',
  interview: 'bg-blue-100 text-blue-800',
  offer: 'bg-purple-100 text-purple-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function Applicants() {
  // Main state
  const [applicants, setApplicants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  // Filters
  const [filterStage, setFilterStage] = useState('all');
  const [filterJobId, setFilterJobId] = useState('all');
  const [search, setSearch] = useState('');
  const [jobs, setJobs] = useState([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail Modal
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Stage Update Modal
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stagingApplicant, setStagingApplicant] = useState(null);
  const [newStage, setNewStage] = useState('');
  const [stageNote, setStageNote] = useState('');
  const [isSubmittingStage, setIsSubmittingStage] = useState(false);

  // Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteApplicant, setNoteApplicant] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  // Fetch applicants
  const fetchApplicants = async () => {
    try {
      setIsLoading(true);
      setError('');

      let url = `/applications/admin/all?page=${page}&limit=20`;
      if (filterStage !== 'all') url += `&stage=${filterStage}`;
      if (filterJobId !== 'all') url += `&jobId=${filterJobId}`;
      if (search.trim()) url += `&search=${search.trim()}`;

      const response = await api.get(url);
      const list = response.data?.data || response.data || [];
      const pages = response.data?.totalPages || 1;

      setApplicants(list);
      setTotalPages(pages);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load applicants');
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch jobs for filter
  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs');
      setJobs(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  // Fetch on mount and filter changes
  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    fetchApplicants();
  }, [filterStage, filterJobId, page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchApplicants();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Handlers
  const openDetail = (applicant) => {
    setSelectedApplicant(applicant);
    setIsDetailOpen(true);
  };

  const openStageModal = (applicant) => {
    setStagingApplicant(applicant);
    setNewStage(applicant.stage);
    setStageNote('');
    setIsStageModalOpen(true);
  };

  const handleStageUpdate = async () => {
    if (newStage === stagingApplicant.stage) {
      setIsStageModalOpen(false);
      return;
    }

    try {
      setIsSubmittingStage(true);
      await api.patch(`/applications/${stagingApplicant._id}/stage`, {
        newStage,
        notes: stageNote,
      });

      setIsStageModalOpen(false);
      fetchApplicants();

      if (newStage === 'hired') {
        setToast({
          message: '🎉 Applicant marked as Hired! Employee account activated.',
          type: 'success',
        });
      } else {
        setToast({
          message: 'Stage updated successfully.',
          type: 'success',
        });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to update stage.',
        type: 'error',
      });
    } finally {
      setIsSubmittingStage(false);
    }
  };

  const openNoteModal = (applicant) => {
    setNoteApplicant(applicant);
    setNoteText('');
    setIsNoteModalOpen(true);
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;

    try {
      setIsSubmittingNote(true);
      await api.post(`/applications/${noteApplicant._id}/notes`, {
        text: noteText,
      });

      setIsNoteModalOpen(false);
      setToast({
        message: 'Note added successfully.',
        type: 'success',
      });
      fetchApplicants();
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Failed to add note.',
        type: 'error',
      });
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDownloadOfferLetter = async () => {
    if (!selectedApplicant?._id) return;

    try {
      const res = await api.get(
        `/applications/${selectedApplicant._id}/offer-letter`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `offer-letter-${
        selectedApplicant.fullName ?? selectedApplicant._id
      }.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      setToast({
        message: 'Offer letter downloaded.',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: 'Offer letter download failed.',
        type: 'error',
      });
    }
  };

  const handleDelete = async (applicant) => {
    if (
      !window.confirm(
        `Delete application from ${applicant.fullName}? This cannot be undone.`
      )
    )
      return;

    try {
      await api.delete(`/applications/${applicant._id}`);
      fetchApplicants();
      setToast({
        message: 'Application deleted successfully.',
        type: 'success',
      });
    } catch (err) {
      setToast({
        message: 'Failed to delete application.',
        type: 'error',
      });
    }
  };

  // Stats
  const stats = [
    {
      label: 'Total',
      value: applicants.length,
    },
    {
      label: 'Applied',
      value: applicants.filter((a) => a.stage === 'applied').length,
    },
    {
      label: 'Screening',
      value: applicants.filter((a) => a.stage === 'screening').length,
    },
    {
      label: 'Interview',
      value: applicants.filter((a) => a.stage === 'interview').length,
    },
    {
      label: 'Offer',
      value: applicants.filter((a) => a.stage === 'offer').length,
    },
    {
      label: 'Hired',
      value: applicants.filter((a) => a.stage === 'hired').length,
    },
  ];

  // Table columns
  const columns = [
    {
      key: 'applicant',
      label: 'Applicant',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.fullName}</div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      ),
    },
    {
      key: 'job',
      label: 'Applied For',
      render: (row) => (
        <span className="text-sm text-gray-700">
          {row.jobId?.title || '—'}
        </span>
      ),
    },
    {
      key: 'stage',
      label: 'Stage',
      render: (row) => (
        <StatusBadge status={row.stage} />
      ),
    },
    {
      key: 'date',
      label: 'Applied',
      render: (row) => (
        <span className="text-sm text-gray-500">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (row) => (
        <span className="text-xs text-gray-400">
          {row.notes?.length || 0} note{row.notes?.length !== 1 ? 's' : ''}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-1 flex-wrap">
          <Button size="sm" variant="ghost" onClick={() => openDetail(row)}>
            View
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => openStageModal(row)}
          >
            Stage
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openNoteModal(row)}
          >
            Note
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const pagination = { page, limit: 20, total: applicants.length, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      {/* PAGE HEADER */}
      <PageHeader
        title="Applicants"
        subtitle="Manage all job applications and pipeline stages"
      />

      {/* STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white border border-gray-200 rounded-lg p-3 text-center"
          >
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              {stat.label}
            </div>
            <div className="text-xl font-bold text-[#223B5B]">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap mb-4">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Filters</span>
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5] min-w-[200px]"
        />

        <select
          value={filterStage}
          onChange={(e) => { setFilterStage(e.target.value); setPage(1); }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="all">All Stages</option>
          <option value="applied">Applied</option>
          <option value="screening">Screening</option>
          <option value="interview">Interview</option>
          <option value="offer">Offer</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={filterJobId}
          onChange={(e) => { setFilterJobId(e.target.value); setPage(1); }}
          className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] text-gray-700 bg-white outline-none focus:border-[#185FA5]"
        >
          <option value="all">All Jobs</option>
          {jobs.map((job) => (
            <option key={job._id} value={job._id}>
              {job.title}
            </option>
          ))}
        </select>

        <button
          onClick={() => { setSearch(''); setFilterStage('all'); setFilterJobId('all'); setPage(1); }}
          className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[30px] bg-white hover:bg-gray-50 whitespace-nowrap"
        >
          Reset
        </button>
      </div>

      {/* APPLICANTS TABLE */}
      <Table
        data={applicants}
        columns={columns}
        isLoading={isLoading}
        emptyMessage="No applicants found."
      />

      {/* PAGINATION */}
      {pagination ? (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 mt-4">
          <span className="text-[12px] text-gray-500">
            Showing{' '}
            <span className="font-medium text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span>
            {' '}–{' '}
            <span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span>
            {' '}of{' '}
            <span className="font-medium text-gray-700">{pagination.total}</span>
            {' '}records
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1,p-1))}
              disabled={!pagination.hasPrevPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>

            {Array.from({length:pagination.totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===pagination.totalPages||Math.abs(p-pagination.page)<=1)
              .reduce((acc,p,idx,arr)=>{ if(idx>0&&p-arr[idx-1]>1) acc.push('...'); acc.push(p); return acc },[])
              .map((p,idx)=> p==='...' ? (
                <span key={`e-${idx}`} className="text-[12px] text-gray-400 px-1">…</span>
              ) : (
                <button key={p} onClick={()=>setPage(p)} className={`h-[30px] w-[30px] rounded-md text-[12px] border transition-colors ${pagination.page===p ? 'bg-[#185FA5] text-white border-[#185FA5]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>{p}</button>
              ))}

            <button
              onClick={()=>setPage(p=>Math.min(pagination.totalPages,p+1))}
              disabled={!pagination.hasNextPage}
              className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      ) : null}

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* DETAIL MODAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Applicant Details"
        size="lg"
      >
        {selectedApplicant && (
          <div className="space-y-4">
            {/* APPLICANT INFO */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Name
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedApplicant.fullName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedApplicant.email}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Phone
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedApplicant.phone || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Applied
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(selectedApplicant.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Job
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedApplicant.jobId?.title || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Department
                </p>
                <p className="text-sm font-medium text-gray-900">
                  {selectedApplicant.jobId?.department || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Current Stage
                </p>
                <StatusBadge status={selectedApplicant.stage} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  Resume
                </p>
                {selectedApplicant.resumeUrl ? (
                  <a
                    href={selectedApplicant.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    View Resume
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">Not uploaded</p>
                )}
              </div>
            </div>

            {/* STAGE HISTORY */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Stage History
              </h4>
              {selectedApplicant.stageHistory?.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedApplicant.stageHistory.map((h, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-xs text-gray-600 bg-gray-50 rounded px-3 py-2"
                    >
                      <span className="font-medium capitalize">{h.stage}</span>
                      <span>{h.notes || '—'}</span>
                      <span className="text-gray-400">
                        {new Date(h.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No stage history yet.</p>
              )}
            </div>

            {/* NOTES */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Notes ({selectedApplicant.notes?.length || 0})
              </h4>
              {selectedApplicant.notes?.length > 0 ? (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedApplicant.notes.map((n, i) => (
                    <div
                      key={i}
                      className="text-xs text-gray-600 bg-yellow-50 border border-yellow-100 rounded px-3 py-2"
                    >
                      <p>{n.text}</p>
                      <p className="text-gray-400 mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No notes added yet.</p>
              )}
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 mt-4 justify-end">
              {(selectedApplicant?.stage === 'offer' ||
                selectedApplicant?.stage === 'hired') ? (
                <button
                  onClick={handleDownloadOfferLetter}
                  className="inline-flex items-center gap-2 h-[32px] px-4 bg-[#185FA5] text-white rounded-md text-[12px] font-medium hover:bg-[#0C447C]"
                >
                  ↓ Offer Letter
                </button>
              ) : null}
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  openStageModal(selectedApplicant);
                }}
              >
                Update Stage
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  openNoteModal(selectedApplicant);
                }}
              >
                Add Note
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* STAGE UPDATE MODAL */}
      <Modal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title="Update Stage"
        size="sm"
      >
        {stagingApplicant && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Applicant: <strong>{stagingApplicant.fullName}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Current stage:
              <span
                className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  STAGE_COLORS[stagingApplicant.stage]
                }`}
              >
                {stagingApplicant.stage}
              </span>
            </p>

            <Select
              label="Move to Stage"
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              options={STAGES.map((s) => ({
                value: s,
                label: s.charAt(0).toUpperCase() + s.slice(1),
              }))}
            />

            <Input
              label="Note (optional)"
              placeholder="Reason for stage change..."
              value={stageNote}
              onChange={(e) => setStageNote(e.target.value)}
            />

            {/* HIRED WARNING */}
            {newStage === 'hired' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800 font-medium">
                  ✅ Marking as Hired will:
                </p>
                <ul className="text-xs text-green-700 mt-1 space-y-1 list-disc list-inside">
                  <li>Activate their employee account</li>
                  <li>Remove the 90-day auto-delete timer</li>
                  <li>Allow them to login to the employee portal</li>
                </ul>
              </div>
            )}

            {newStage === 'rejected' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700">
                  This applicant will be marked as rejected. Their record will
                  remain for 90 days then auto-delete.
                </p>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsStageModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleStageUpdate}
                isLoading={isSubmittingStage}
                isDisabled={isSubmittingStage}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ADD NOTE MODAL */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title="Add Note"
        size="sm"
      >
        {noteApplicant && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Adding note for: <strong>{noteApplicant.fullName}</strong>
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Note</label>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                placeholder="Write your note here..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm resize-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsNoteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddNote}
                isLoading={isSubmittingNote}
                isDisabled={isSubmittingNote || !noteText.trim()}
              >
                Add Note
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
