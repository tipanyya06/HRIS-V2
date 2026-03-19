import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Modal, LoadingSpinner, StatusBadge, Table, Button } from '../../components/ui';
import Toast from '../../components/ui/Toast';
import { Download } from 'lucide-react';
import { PE_CRITERIA, FACTOR_KEYS, GRADE_COLORS } from '../../constants/peCriteria';

export default function AdminPerformance() {
  const { user } = useAuthStore();
  const [pes, setPes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSelfRatingModal, setShowSelfRatingModal] = useState(false);
  const [selectedPE, setSelectedPE] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [createForm, setCreateForm] = useState({
    employeeId: '',
    evaluatorId: '',
    evaluationType: '1st-month',
    periodFrom: '',
    periodTo: '',
  });

  const [scoreForm, setScoreForm] = useState({
    productivity: '',
    quality: '',
    mvvEmbrace: '',
    initiative: '',
    attendance: '',
    adherenceCRR: '',
    humanRelations: '',
  });

  const [sections, setSections] = useState({
    strengths: '',
    progress: '',
    mistakes: '',
    corrections: '',
  });

  const [updatingDisposition, setUpdatingDisposition] = useState(false);

  const factors = [
    { key: 'productivity', label: 'Productivity', max: 20 },
    { key: 'quality', label: 'Quality', max: 20 },
    { key: 'mvvEmbrace', label: 'MVV Embrace', max: 10 },
    { key: 'initiative', label: 'Initiative/Creativity', max: 10 },
    { key: 'attendance', label: 'Attendance & Punctuality', max: 18 },
    { key: 'adherenceCRR', label: 'Adherence to CR&R', max: 12 },
    { key: 'humanRelations', label: 'Human Relations', max: 10 },
  ];

  const fetchPEs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/performance', {
        params: {
          status: statusFilter || undefined,
          evaluationType: typeFilter || undefined,
          page,
          limit: 20,
        },
      });
      setPes(res.data.evaluations ?? []);
      setPagination(res.data.pagination ?? null);
    } catch (err) {
      setToast({
        message: 'Failed to load performance evaluations',
        type: 'error',
      });
      setPes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees', { params: { limit: 100 } });
      setEmployees(res.data.data?.employees ?? []);
    } catch {
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchPEs();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreatePE = async () => {
    try {
      if (
        !createForm.employeeId ||
        !createForm.evaluatorId ||
        !createForm.evaluationType ||
        !createForm.periodFrom ||
        !createForm.periodTo
      ) {
        setToast({
          message: 'All fields are required',
          type: 'error',
        });
        return;
      }

      setSubmitting(true);
      await api.post('/performance', createForm);
      setToast({
        message: 'Performance evaluation created successfully',
        type: 'success',
      });
      setShowCreateModal(false);
      setCreateForm({
        employeeId: '',
        evaluatorId: '',
        evaluationType: '1st-month',
        periodFrom: '',
        periodTo: '',
      });
      await fetchPEs();
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to create evaluation',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitSupervisorRating = async () => {
    try {
      setSubmitting(true);
      await api.patch(
        `/performance/${selectedPE._id}/supervisor-rating`,
        {
          scores: scoreForm,
          sections,
        }
      );
      setToast({
        message: 'Supervisor rating submitted successfully',
        type: 'success',
      });
      setShowDetailModal(false);
      await fetchPEs();
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to submit rating',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateDisposition = async (newDisposition) => {
    try {
      setUpdatingDisposition(true);
      await api.patch(`/performance/${selectedPE._id}/disposition`, {
        disposition: newDisposition,
      });
      setToast({
        message: 'Disposition updated successfully',
        type: 'success',
      });
      setSelectedPE({ ...selectedPE, disposition: newDisposition });
      await fetchPEs();
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to update disposition',
        type: 'error',
      });
    } finally {
      setUpdatingDisposition(false);
    }
  };

  const handleDownloadPDF = async (peId) => {
    try {
      const res = await api.get(`/performance/${peId}/export`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' })
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `PE-${peId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast({
        message: 'Failed to download PDF',
        type: 'error',
      });
    }
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => (
        <div>
          <div className="text-[13px] font-medium text-[#1a3a5c]">
            {row.employeeId?.personalInfo?.fullName ??
              row.employeeId?.email ??
              '—'}
          </div>
          <div className="text-[11px] text-gray-400">
            {row.employeeId?.department ?? '—'}
          </div>
        </div>
      ),
    },
    {
      key: 'evaluationType',
      label: 'Type',
      render: (row) => row.evaluationType ?? '—',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'totalScore',
      label: 'Score',
      render: (row) =>
        row.totalScore != null ? (
          <span className="font-medium text-[#1a3a5c]">
            {row.totalScore}
            <span className="text-[11px] text-gray-400 font-normal ml-1">
              ({row.overallRating})
            </span>
          </span>
        ) : (
          '—'
        ),
    },
    {
      key: 'disposition',
      label: 'Disposition',
      render: (row) =>
        row.disposition ? (
          <StatusBadge status={row.disposition} />
        ) : (
          '—'
        ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedPE(row);
              if (row.status === 'supervisor-rating') {
                const scores = {};
                factors.forEach((f) => {
                  scores[f.key] = row.scores?.[f.key]?.supervisor ?? '';
                });
                setScoreForm(scores);
                setSections({
                  strengths: row.strengths ?? '',
                  progress: row.progress ?? '',
                  mistakes: row.mistakes ?? '',
                  corrections: row.corrections ?? '',
                });
              }
              setShowDetailModal(true);
            }}
            className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50"
          >
            View
          </button>

          <button
            onClick={() => {
              setSelectedPE(row);
              setShowSelfRatingModal(true);
            }}
            className="text-[12px] text-gray-600 border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50"
          >
            Self-Rating
          </button>

          <button
            onClick={() => handleDownloadPDF(row._id)}
            className="text-[12px] text-gray-500 border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50 flex items-center justify-center gap-1"
          >
            <Download size={12} />
            PDF
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[20px] font-semibold text-[#1a3a5c]">
            Performance Evaluations
          </h1>
          <p className="text-[13px] text-gray-500 mt-0.5">
            Manage employee performance evaluations
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          + New Evaluation
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-[12px] font-medium text-gray-700">
            Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
          >
            <option value="">All</option>
            <option value="draft">Draft</option>
            <option value="self-rating">Self Rating</option>
            <option value="supervisor-rating">Supervisor Rating</option>
            <option value="completed">Completed</option>
            <option value="acknowledged">Acknowledged</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[12px] font-medium text-gray-700">
            Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="h-[32px] px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
          >
            <option value="">All</option>
            <option value="1st-month">1st Month</option>
            <option value="3rd-month">3rd Month</option>
            <option value="5th-month">5th Month</option>
            <option value="annual">Annual</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <Table columns={columns} data={pes} isLoading={loading} />

      {/* Pagination */}
      {pagination ? (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(
              (p) =>
                p === 1 ||
                p === pagination.totalPages ||
                Math.abs(p - pagination.page) <= 1
            )
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
              acc.push(p);
              return acc;
            }, [])
            .map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="text-[12px] text-gray-400 px-1">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-[30px] w-[30px] rounded-md text-[12px] border transition-colors ${
                    pagination.page === p
                      ? 'bg-[#185FA5] text-white border-[#185FA5]'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              )
            )}
          <button
            onClick={() =>
              setPage((p) => Math.min(pagination.totalPages, p + 1))
            }
            disabled={!pagination.hasNextPage}
            className="h-[30px] px-3 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      ) : null}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Performance Evaluation"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
              Employee
            </label>
            <select
              value={createForm.employeeId}
              onChange={(e) =>
                setCreateForm({ ...createForm, employeeId: e.target.value })
              }
              className="w-full h-[32px] mt-1 px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
            >
              <option value="">Select employee</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.personalInfo?.fullName ?? emp.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
              Evaluator
            </label>
            <select
              value={createForm.evaluatorId}
              onChange={(e) =>
                setCreateForm({ ...createForm, evaluatorId: e.target.value })
              }
              className="w-full h-[32px] mt-1 px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
            >
              <option value="">Select evaluator</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.personalInfo?.fullName ?? emp.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
              Evaluation Type
            </label>
            <select
              value={createForm.evaluationType}
              onChange={(e) =>
                setCreateForm({ ...createForm, evaluationType: e.target.value })
              }
              className="w-full h-[32px] mt-1 px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
            >
              <option value="1st-month">1st Month</option>
              <option value="3rd-month">3rd Month</option>
              <option value="5th-month">5th Month</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
                Period From
              </label>
              <input
                type="date"
                value={createForm.periodFrom}
                onChange={(e) =>
                  setCreateForm({ ...createForm, periodFrom: e.target.value })
                }
                className="w-full h-[32px] mt-1 px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold uppercase tracking-wider text-gray-700">
                Period To
              </label>
              <input
                type="date"
                value={createForm.periodTo}
                onChange={(e) =>
                  setCreateForm({ ...createForm, periodTo: e.target.value })
                }
                className="w-full h-[32px] mt-1 px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button
              onClick={() => setShowCreateModal(false)}
              className="h-[32px] px-4 border border-gray-200 rounded-md text-[13px] bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <Button
              onClick={handleCreatePE}
              isLoading={submitting}
              isDisabled={submitting}
            >
              Create Evaluation
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Performance Evaluation — ${
          selectedPE?.employeeId?.personalInfo?.fullName ??
          selectedPE?.employeeId?.email ??
          ''
        }`}
        size="lg"
      >
        {selectedPE ? (
          <div className="space-y-5">
            {/* PE Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </div>
                <div className="text-[13px] text-gray-700 mt-1">
                  {selectedPE.evaluationType ?? '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </div>
                <div className="mt-1">
                  <StatusBadge status={selectedPE.status} />
                </div>
              </div>
            </div>

            {/* Supervisor Rating Form */}
            {selectedPE.status === 'supervisor-rating' ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section A — Supervisor Rating
                  </h4>

                  <div className="flex flex-col gap-4">
                    {FACTOR_KEYS.map(key => {
                      const factor = PE_CRITERIA[key]
                      const selected = Number(scoreForm[key])
                      return (
                        <div key={key}
                          className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Factor header */}
                          <div className="bg-[#1a3a5c] px-4 py-2 flex items-center justify-between">
                            <div>
                              <p className="text-[12px] font-semibold text-white">
                                {factor.label}
                              </p>
                              <p className="text-[10px] text-blue-200 mt-0.5">
                                {factor.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {factor.supervisorOnly ? (
                                <span className="text-[9px] font-semibold bg-amber-400 text-white px-2 py-0.5 rounded-full flex-shrink-0">
                                  Supervisor-rated only
                                </span>
                              ) : null}
                              <span className="text-[10px] text-blue-200">
                                Max {factor.max} pts
                              </span>
                              {scoreForm[key] ? (
                                <span className="text-[12px] font-bold text-white bg-white/20 px-2 py-0.5 rounded">
                                  {scoreForm[key]} pts
                                </span>
                              ) : null}
                            </div>
                          </div>
                          {/* Radio options */}
                          <div className="divide-y divide-gray-100">
                            {factor.options.map(opt => {
                              const isSelected = selected === opt.score
                              const gc = GRADE_COLORS[opt.grade]
                              return (
                                <label
                                  key={opt.score}
                                  className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`supervisor-${key}`}
                                    value={opt.score}
                                    checked={isSelected}
                                    onChange={() =>
                                      setScoreForm(f => ({
                                        ...f, [key]: opt.score
                                      }))
                                    }
                                    className="mt-0.5 flex-shrink-0 accent-[#185FA5]"
                                  />
                                  <div className="flex items-start gap-2 flex-1 min-w-0">
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 border"
                                      style={{
                                        background: gc.bg,
                                        color: gc.text,
                                        borderColor: gc.border,
                                      }}
                                    >
                                      {opt.grade}
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 border border-gray-200 bg-gray-50 text-gray-600">
                                      {opt.score} pts
                                    </span>
                                    <span className={`text-[12px] leading-snug ${
                                      isSelected ? 'text-[#185FA5] font-medium' : 'text-gray-700'
                                    }`}>
                                      {opt.text}
                                    </span>
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {/* Live total */}
                    <div className="bg-[#1a3a5c] rounded-lg px-4 py-3 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-white">
                        Total Score
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-[24px] font-bold text-white">
                          {FACTOR_KEYS.reduce((sum, k) => sum + (Number(scoreForm[k]) || 0), 0)}
                        </span>
                        <span className="text-[13px] font-bold px-2 py-1 rounded"
                          style={{
                            background: GRADE_COLORS[
                              (() => {
                                const t = FACTOR_KEYS.reduce((s, k) => s + (Number(scoreForm[k]) || 0), 0)
                                return t >= 100 ? 'S' :
                                       t >= 90  ? 'A' :
                                       t >= 80  ? 'B' :
                                       t >= 66  ? 'C' :
                                       t >= 47  ? 'D' : 'E'
                              })()
                            ]?.bg,
                            color: GRADE_COLORS[
                              (() => {
                                const t = FACTOR_KEYS.reduce((s, k) => s + (Number(scoreForm[k]) || 0), 0)
                                return t >= 100 ? 'S' :
                                       t >= 90  ? 'A' :
                                       t >= 80  ? 'B' :
                                       t >= 66  ? 'C' :
                                       t >= 47  ? 'D' : 'E'
                              })()
                            ]?.text,
                          }}>
                          {(() => {
                            const t = FACTOR_KEYS.reduce((s, k) => s + (Number(scoreForm[k]) || 0), 0)
                            return t >= 100 ? 'S' :
                                   t >= 90  ? 'A' :
                                   t >= 80  ? 'B' :
                                   t >= 66  ? 'C' :
                                   t >= 47  ? 'D' : 'E'
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sections B, C, D, E */}
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section B — Strengths & Superior Performance
                  </h4>
                  <textarea
                    value={sections.strengths}
                    onChange={(e) =>
                      setSections({ ...sections, strengths: e.target.value })
                    }
                    placeholder="Describe strengths and superior performance..."
                    className="w-full h-[100px] px-3 py-2 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section C — Progress Achieved
                  </h4>
                  <textarea
                    value={sections.progress}
                    onChange={(e) =>
                      setSections({ ...sections, progress: e.target.value })
                    }
                    placeholder="Describe progress achieved..."
                    className="w-full h-[100px] px-3 py-2 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section D — Mistakes/Inefficiencies
                  </h4>
                  <textarea
                    value={sections.mistakes}
                    onChange={(e) =>
                      setSections({ ...sections, mistakes: e.target.value })
                    }
                    placeholder="Describe mistakes and inefficiencies..."
                    className="w-full h-[100px] px-3 py-2 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section E — Corrections/Goals
                  </h4>
                  <textarea
                    value={sections.corrections}
                    onChange={(e) =>
                      setSections({ ...sections, corrections: e.target.value })
                    }
                    placeholder="Describe corrections and goals for next period..."
                    className="w-full h-[100px] px-3 py-2 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5]"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="h-[32px] px-4 border border-gray-200 rounded-md text-[13px] bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleSubmitSupervisorRating}
                    isLoading={submitting}
                    isDisabled={submitting}
                  >
                    Submit Rating
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Disposition Selector (Completed/Acknowledged) */}
            {['completed', 'acknowledged'].includes(selectedPE.status) ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Disposition
                  </h4>
                  <select
                    value={selectedPE.disposition ?? ''}
                    onChange={(e) => handleUpdateDisposition(e.target.value)}
                    disabled={updatingDisposition}
                    className="w-full h-[32px] px-3 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5] disabled:opacity-50"
                  >
                    <option value="">No disposition set</option>
                    <option value="fail">Fail</option>
                    <option value="next-pe">Proceed to next PE</option>
                    <option value="regularize">For Regularization</option>
                  </select>
                </div>

                {/* Read-only Scores */}
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Evaluation Scores
                  </h4>
                  <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                    {factors.map((f) => {
                      const s = selectedPE.scores?.[f.key];
                      return (
                        <div
                          key={f.key}
                          className="flex items-center justify-between"
                        >
                          <span className="text-[13px] text-gray-700">
                            {f.label}
                          </span>
                          <div className="text-[13px] font-medium text-[#1a3a5c]">
                            {s?.self ?? '—'} / {s?.supervisor ?? '—'}{' '}
                            <span className="text-[11px] text-gray-500 font-normal">
                              (max {f.max})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium text-green-800">
                        Total Score
                      </span>
                      <span className="text-[16px] font-bold text-green-700">
                        {selectedPE.totalScore ?? '—'}{' '}
                        <span className="text-[13px]">
                          ({selectedPE.overallRating ?? '—'})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections display */}
                {selectedPE.strengths ? (
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-2">
                      Section B — Strengths
                    </h4>
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap">
                      {selectedPE.strengths}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Read-only view for other statuses */}
            {!['supervisor-rating', 'completed', 'acknowledged'].includes(
              selectedPE.status
            ) ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-[13px] text-blue-800">
                  This evaluation is in{' '}
                  <strong>{selectedPE.status}</strong> status. Waiting for
                  next step.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {/* Self-Rating Modal */}
      {showSelfRatingModal && selectedPE ? (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between z-10">
              <div className="flex items-start gap-3">
                {/* Avatar initial */}
                <div className="w-9 h-9 rounded-full bg-[#1a3a5c] flex items-center justify-center flex-shrink-0 text-white text-[14px] font-bold">
                  {((selectedPE.employeeId?.personalInfo?.fullName ?? selectedPE.employeeId?.email ?? 'E').charAt(0)).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold text-[#1a3a5c]">
                    Employee Self-Rating
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-[12px] text-gray-500">
                      {selectedPE.employeeId?.personalInfo?.fullName ?? selectedPE.employeeId?.email ?? '—'}
                    </p>
                    <span className="text-gray-300">·</span>
                    <span className="text-[11px] font-medium text-[#185FA5] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      {selectedPE.evaluationType}
                    </span>
                    <span className="text-gray-300">·</span>
                    <StatusBadge status={selectedPE.status} />
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSelfRatingModal(false);
                  setSelectedPE(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-[22px] leading-none w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 flex flex-col gap-4">
              {selectedPE.status === 'draft' || selectedPE.status === 'self-rating' ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-700">
                  ⏳ Employee has not yet submitted their self-rating.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {FACTOR_KEYS.filter((k) => !PE_CRITERIA[k].supervisorOnly).map((key) => {
                    const factor = PE_CRITERIA[key];
                    const selfVal = selectedPE.scores?.[key]?.self;
                    const selfOpt = factor.options.find((o) => o.score === selfVal);
                    const gc = selfOpt ? GRADE_COLORS[selfOpt.grade] : null;
                    const comment = selectedPE.factorComments?.[key];

                    return (
                      <div key={key} className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                        {/* Factor header with grade color accent */}
                        <div
                          className="px-4 py-3 flex items-center justify-between border-l-4"
                          style={{
                            borderLeftColor: gc?.text ?? '#e5e7eb',
                            background: gc?.bg ?? '#f8f9fa',
                          }}
                        >
                          <div>
                            <p className="text-[13px] font-semibold text-[#1a3a5c]">
                              {factor.label}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {factor.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {selfVal != null ? (
                              <>
                                <span
                                  className="text-[22px] font-bold leading-none"
                                  style={{ color: gc?.text }}
                                >
                                  {selfVal}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  / {factor.max}
                                </span>
                                <span
                                  className="text-[13px] font-bold px-2.5 py-1 rounded-lg border ml-1"
                                  style={{
                                    color: gc?.text,
                                    background: gc?.bg,
                                    borderColor: gc?.border,
                                  }}
                                >
                                  {selfOpt?.grade ?? '—'}
                                </span>
                              </>
                            ) : (
                              <span className="text-[12px] text-gray-400 italic">
                                Not rated
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {selfOpt ? (
                          <div className="px-4 py-3 bg-white border-t border-gray-100">
                            <p className="text-[12px] text-gray-700 leading-relaxed">
                              {selfOpt.text}
                            </p>
                          </div>
                        ) : null}

                        {/* S/A justification comment */}
                        {comment ? (
                          <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-start gap-2">
                            <span className="text-[14px] flex-shrink-0 mt-0.5">
                              💬
                            </span>
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-500 mb-1">
                                Justification
                              </p>
                              <p className="text-[12px] text-blue-800 leading-snug italic">
                                "{comment}"
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}

                  {/* Overall employee comment */}
                  {selectedPE.employeeComment ? (
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="bg-[#1a3a5c] px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">
                          Overall Employee Comment
                        </p>
                      </div>
                      <div className="px-4 py-4 bg-white">
                        <p className="text-[13px] text-gray-700 leading-relaxed italic">
                          "{selectedPE.employeeComment}"
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-5 py-3 flex justify-end">
              <button
                onClick={() => {
                  setShowSelfRatingModal(false);
                  setSelectedPE(null);
                }}
                className="h-[32px] px-4 border border-gray-200 rounded-md text-[12px] text-gray-600 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Toast */}
      {toast ? (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      ) : null}
    </div>
  );
}

