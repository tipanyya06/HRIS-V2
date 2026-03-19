import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../lib/api';
import { Modal, LoadingSpinner, StatusBadge, Button } from '../../components/ui';
import { Card } from '../../components/ui';
import Toast from '../../components/ui/Toast';
import { Download } from 'lucide-react';
import { PE_CRITERIA, FACTOR_KEYS, GRADE_COLORS } from '../../constants/peCriteria';

export default function EmployeePerformance() {
  const { user } = useAuthStore();
  const [pes, setPes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPE, setSelectedPE] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [selfScores, setSelfScores] = useState({
    productivity: '',
    quality: '',
    mvvEmbrace: '',
    initiative: '',
    attendance: '',
    adherenceCRR: '',
    humanRelations: '',
  });
  const [selfComments, setSelfComments] = useState({
    productivity: '',
    quality: '',
    mvvEmbrace: '',
    initiative: '',
    humanRelations: '',
  });
  const [comment, setComment] = useState('');
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

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get('/performance/my');
        setPes(res.data.data ?? []);
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
    fetch();
  }, []);

  const handleOpenDetail = (pe) => {
    setSelectedPE(pe);
    if (pe.status === 'self-rating') {
      const scores = {};
      const comments = {};
      factors.forEach((f) => {
        scores[f.key] = pe.scores?.[f.key]?.self ?? '';
        if (!f.supervisorOnly) {
          comments[f.key] = pe.factorComments?.[f.key] ?? '';
        }
      });
      setSelfScores(scores);
      setSelfComments(comments);
      setComment(pe.employeeComment ?? '');
    }
    setShowDetailModal(true);
  };

  const handleSubmitSelfRating = async () => {
    try {
      setSubmitting(true);

      // Validate all 5 rateable factors have scores
      const rateableFactors = FACTOR_KEYS.filter((f) => !PE_CRITERIA[f].supervisorOnly);
      const missingScore = rateableFactors.find((f) => selfScores[f] === '' || selfScores[f] === null);
      if (missingScore) {
        setToast({
          message: `Please rate all factors. Missing: ${PE_CRITERIA[missingScore].label}`,
          type: 'error',
        });
        setSubmitting(false);
        return;
      }

      // Validate S or A ratings have comments
      for (const factor of rateableFactors) {
        const score = selfScores[factor];
        const selectedOption = PE_CRITERIA[factor].options.find((o) => o.score === parseInt(score));
        const grade = selectedOption?.grade;

        if (grade === 'S' || grade === 'A') {
          if (!selfComments[factor] || selfComments[factor].trim() === '') {
            setToast({
              message: `Comment required for ${grade === 'S' ? 'Excellent (S)' : 'Very Good (A)'} rating on ${PE_CRITERIA[factor].label}`,
              type: 'error',
            });
            setSubmitting(false);
            return;
          }
        }
      }

      // Validate employee comment is not empty
      if (!comment || comment.trim() === '') {
        setToast({
          message: 'Please provide your overall comments',
          type: 'error',
        });
        setSubmitting(false);
        return;
      }

      await api.patch(`/performance/${selectedPE._id}/self-rating`, {
        scores: selfScores,
        employeeComment: comment,
        factorComments: selfComments,
      });
      setToast({
        message: 'Self-rating submitted successfully',
        type: 'success',
      });
      setShowDetailModal(false);
      const res = await api.get('/performance/my');
      setPes(res.data.data ?? []);
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to submit self-rating',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async () => {
    try {
      setSubmitting(true);
      await api.patch(`/performance/${selectedPE._id}/acknowledge`);
      setToast({
        message: 'Performance evaluation acknowledged',
        type: 'success',
      });
      setShowDetailModal(false);
      const res = await api.get('/performance/my');
      setPes(res.data.data ?? []);
    } catch (err) {
      setToast({
        message: err.response?.data?.error || 'Failed to acknowledge',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
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

  if (loading) return <LoadingSpinner />;

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">
          My Performance Evaluations
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          View your evaluation history and submit ratings.
        </p>
      </div>

      {/* Empty State */}
      {pes.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-[13px] text-gray-500 leading-relaxed max-w-sm mx-auto">
            No performance evaluations yet. Your HR team will create one when
            your evaluation period begins.
          </p>
        </div>
      ) : null}

      {/* PE Cards */}
      <div className="space-y-4">
        {pes.map((pe) => {
          const liveTotal = pe.status === 'supervisor-rating'
            ? Object.values(pe.scores ?? {})
                .reduce((sum, score) => sum + (score?.supervisor ?? 0), 0)
            : pe.totalScore ?? null;

          return (
            <div
              key={pe._id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-[14px] font-semibold text-[#1a3a5c]">
                      {pe.evaluationType ? (
                        pe.evaluationType
                          .replace(/-/g, ' ')
                          .replace(/^\w/, (c) => c.toUpperCase())
                      ) : (
                        '—'
                      )}
                    </h3>
                    <StatusBadge status={pe.status} />
                  </div>

                  <div className="text-[12px] text-gray-500 mb-3">
                    {pe.periodFrom && pe.periodTo ? (
                      <>
                        {new Date(pe.periodFrom).toLocaleDateString('en-PH')} —{' '}
                        {new Date(pe.periodTo).toLocaleDateString('en-PH')}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {liveTotal !== null ? (
                      <div>
                        <span className="text-[13px] font-medium text-[#1a3a5c]">
                          {liveTotal}{' '}
                          <span className="text-[11px] text-gray-400 font-normal">
                            (
                            {liveTotal >= 100
                              ? 'S'
                              : liveTotal >= 90
                              ? 'A'
                              : liveTotal >= 80
                              ? 'B'
                              : liveTotal >= 66
                              ? 'C'
                              : liveTotal >= 47
                              ? 'D'
                              : 'E'}
                            )
                          </span>
                        </span>
                      </div>
                    ) : null}

                    {pe.disposition ? (
                      <div>
                        <StatusBadge status={pe.disposition} />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleOpenDetail(pe)}
                    className="text-[12px] text-[#185FA5] border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50 font-medium"
                  >
                    {pe.status === 'self-rating'
                      ? 'Rate'
                      : pe.status === 'completed'
                      ? 'Review'
                      : 'View'}
                  </button>

                  {['completed', 'acknowledged'].includes(pe.status) ? (
                    <button
                      onClick={() => handleDownloadPDF(pe._id)}
                      className="text-[12px] text-gray-500 border border-gray-200 rounded-md px-3 h-[28px] bg-white hover:bg-gray-50 flex items-center justify-center gap-1"
                    >
                      <Download size={12} />
                      PDF
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={`Performance Evaluation — ${
          selectedPE?.evaluationType?.replace(/-/g, ' ') || ''
        }`}
        size="lg"
      >
        {selectedPE ? (
          <div className="space-y-5">
            {/* PE Info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Period
                </div>
                <div className="text-[13px] text-gray-700 mt-1">
                  {selectedPE.periodFrom && selectedPE.periodTo ? (
                    <>
                      {new Date(selectedPE.periodFrom).toLocaleDateString(
                        'en-PH'
                      )}{' '}
                      — {new Date(selectedPE.periodTo).toLocaleDateString('en-PH')}
                    </>
                  ) : (
                    '—'
                  )}
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

            {/* Self-Rating Form */}
            {selectedPE.status === 'self-rating' ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[12px] text-amber-700 mb-4">
                  Read each description carefully and select the one that best describes your performance for this period. Be honest — your supervisor will also rate you independently.
                </div>

                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section A — Your Self-Rating
                  </h4>

                  <div className="flex flex-col gap-4">
                    {FACTOR_KEYS.map(key => {
                      const factor = PE_CRITERIA[key]
                      const selected = Number(selfScores[key])

                      if (factor.supervisorOnly) {
                        return (
                          <div key={key}
                            className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                              <div>
                                <p className="text-[12px] font-semibold text-gray-600">
                                  {factor.label}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {factor.description}
                                </p>
                              </div>
                              <span className="text-[10px] text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                Max {factor.max} pts
                              </span>
                            </div>
                            <div className="px-4 py-3 flex items-center gap-2 bg-amber-50 border-t border-amber-100">
                              <span className="text-[14px]">🔒</span>
                              <p className="text-[12px] text-amber-700 font-medium">
                                Supervisor-rated only
                              </p>
                              <p className="text-[12px] text-amber-600 ml-1">
                                — Your supervisor will rate this factor. No self-rating required.
                              </p>
                            </div>
                          </div>
                        )
                      }

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
                              <span className="text-[10px] text-blue-200">
                                Max {factor.max} pts
                              </span>
                              {selfScores[key] ? (
                                <span className="text-[12px] font-bold text-white bg-white/20 px-2 py-0.5 rounded">
                                  {selfScores[key]} pts
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
                                    name={`self-${key}`}
                                    value={opt.score}
                                    checked={isSelected}
                                    onChange={() =>
                                      setSelfScores(f => ({
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
                          {/* Conditional comment textarea for S/A ratings */}
                          {(() => {
                            const selectedOption = factor.options.find(o => o.score === selected)
                            const isHighRating = selectedOption && (selectedOption.grade === 'S' || selectedOption.grade === 'A')
                            return isHighRating ? (
                              <div className="border-t border-green-100 px-4 py-3 bg-green-50">
                                <label className="block text-[12px] font-medium text-gray-700 mb-2">
                                  Comment Required for{' '}
                                  <span className="text-green-700">
                                    {selectedOption.grade === 'S' ? 'Excellent (S)' : 'Very Good (A)'}
                                  </span>
                                  {' '}<span className="text-red-500">*</span>
                                </label>
                                <textarea
                                  value={selfComments[key] || ''}
                                  onChange={(e) => setSelfComments(f => ({
                                    ...f, [key]: e.target.value
                                  }))}
                                  placeholder={`Provide specific examples that justify your rating for ${factor.label}...`}
                                  className="w-full h-[80px] px-3 py-2 border border-green-200 rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                />
                                {(!selfComments[key] || selfComments[key].trim() === '') ? (
                                  <p className="text-[11px] text-red-600 mt-1">Comment is required</p>
                                ) : null}
                              </div>
                            ) : null
                          })()} 
                        </div>
                      )
                    })}

                    {/* Live total */}
                    <div className="bg-[#1a3a5c] rounded-lg px-4 py-3 flex items-center justify-between">
                      <div>
                        <span className="text-[13px] font-semibold text-white">
                          Your Total Score
                        </span>
                        <p className="text-[11px] text-gray-300 mt-1">
                          Self-rated subtotal (5 of 7 factors) · Supervisor will complete Attendance and CR&R
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[24px] font-bold text-white">
                          {FACTOR_KEYS
                            .filter(k => !PE_CRITERIA[k].supervisorOnly)
                            .reduce((sum, k) => sum + (Number(selfScores[k]) || 0), 0)}
                        </span>
                        <span className="text-[13px] font-bold px-2 py-1 rounded"
                          style={{
                            background: GRADE_COLORS[
                              (() => {
                                const t = FACTOR_KEYS
                                  .filter(k => !PE_CRITERIA[k].supervisorOnly)
                                  .reduce((s, k) => s + (Number(selfScores[k]) || 0), 0)
                                return t >= 100 ? 'S' :
                                       t >= 90  ? 'A' :
                                       t >= 80  ? 'B' :
                                       t >= 66  ? 'C' :
                                       t >= 47  ? 'D' : 'E'
                              })()
                            ]?.bg,
                            color: GRADE_COLORS[
                              (() => {
                                const t = FACTOR_KEYS
                                  .filter(k => !PE_CRITERIA[k].supervisorOnly)
                                  .reduce((s, k) => s + (Number(selfScores[k]) || 0), 0)
                                return t >= 100 ? 'S' :
                                       t >= 90  ? 'A' :
                                       t >= 80  ? 'B' :
                                       t >= 66  ? 'C' :
                                       t >= 47  ? 'D' : 'E'
                              })()
                            ]?.text,
                          }}>
                          {(() => {
                            const t = FACTOR_KEYS
                              .filter(k => !PE_CRITERIA[k].supervisorOnly)
                              .reduce((s, k) => s + (Number(selfScores[k]) || 0), 0)
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

                {/* Section E — Comment */}
                <div>
                  <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                    Section E — Your Comment
                  </h4>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts about your performance during this period..."
                    className="w-full h-[120px] px-3 py-2 border border-gray-200 rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-[#185FA5] focus:border-[#185FA5]"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="h-[32px] px-4 border border-gray-200 rounded-md text-[13px] bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleSubmitSelfRating}
                    isLoading={submitting}
                    isDisabled={submitting}
                  >
                    Submit Self-Rating
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Acknowledge Panel */}
            {selectedPE.status === 'completed' && !selectedPE.acknowledgedAt ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[13px] text-amber-800 leading-relaxed">
                    I hereby certify that this performance evaluation has been
                    discussed with me on{' '}
                    <strong>{new Date().toLocaleDateString('en-PH')}</strong>.
                  </p>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="h-[32px] px-4 border border-gray-200 rounded-md text-[13px] bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <Button
                    onClick={handleAcknowledge}
                    isLoading={submitting}
                    isDisabled={submitting}
                  >
                    Acknowledge
                  </Button>
                </div>
              </div>
            ) : null}

            {/* Read-Only View for Supervisor Scores */}
            {['supervisor-rating', 'completed', 'acknowledged'].includes(
              selectedPE.status
            ) ? (
              <div className="space-y-4">
                {selectedPE.status !== 'supervisor-rating' ? (
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-3">
                      Section A — Evaluation Scores & Details
                    </h4>
                    <div className="space-y-3">
                      {FACTOR_KEYS.map((key) => {
                        const factor = PE_CRITERIA[key]
                        const scores = selectedPE.scores?.[key]
                        const selfScore = scores?.self
                        const supervisorScore = scores?.supervisor
                        const selfOption = factor.options.find(o => o.score === selfScore)
                        const supervisorOption = factor.options.find(o => o.score === supervisorScore)
                        const selfGradeCfg = selfOption ? GRADE_COLORS[selfOption.grade] : null
                        const supGradeCfg = supervisorOption ? GRADE_COLORS[supervisorOption.grade] : null

                        return (
                          <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-[#1a3a5c] px-4 py-2">
                              <p className="text-[12px] font-semibold text-white">
                                {factor.label}{factor.supervisorOnly ? (
                                  <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-400 text-amber-900">
                                    Supervisor-rated
                                  </span>
                                ) : null}
                              </p>
                              <p className="text-[10px] text-blue-200 mt-0.5">{factor.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50">
                              {/* Self Score */}
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                  Your Rating
                                </div>
                                {selfScore ? (
                                  <div>
                                    <div className="text-[24px] font-bold text-[#1a3a5c] mb-1">
                                      {selfScore}<span className="text-[14px] text-gray-500"> pts</span>
                                    </div>
                                    {selfOption ? (
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <span
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border"
                                            style={{
                                              background: selfGradeCfg.bg,
                                              color: selfGradeCfg.text,
                                              borderColor: selfGradeCfg.border,
                                            }}
                                          >
                                            {selfOption.grade}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-gray-700 bg-blue-50 border border-blue-200 rounded px-2 py-1.5">
                                          {selfOption.text}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  <p className="text-[12px] text-gray-500">—</p>
                                )}
                              </div>

                              {/* Supervisor Score */}
                              <div>
                                <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                                  Supervisor Rating
                                </div>
                                {supervisorScore ? (
                                  <div>
                                    <div className="text-[24px] font-bold text-green-700 mb-1">
                                      {supervisorScore}<span className="text-[14px] text-gray-500"> pts</span>
                                    </div>
                                    {supervisorOption ? (
                                      <div>
                                        <div className="flex items-center gap-1.5 mb-2">
                                          <span
                                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border"
                                            style={{
                                              background: supGradeCfg.bg,
                                              color: supGradeCfg.text,
                                              borderColor: supGradeCfg.border,
                                            }}
                                          >
                                            {supervisorOption.grade}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-gray-700 bg-green-50 border border-green-200 rounded px-2 py-1.5">
                                          {supervisorOption.text}
                                        </p>
                                      </div>
                                    ) : null}
                                  </div>
                                ) : (
                                  <p className="text-[12px] text-gray-500">—</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Summary Footer */}
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-[10px] font-semibold uppercase text-blue-700 mb-1">
                          Total Score
                        </div>
                        <div className="text-[20px] font-bold text-blue-900">
                          {selectedPE.totalScore ?? '—'}
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="text-[10px] font-semibold uppercase text-purple-700 mb-1">
                          Overall Grade
                        </div>
                        <div
                          className="text-[20px] font-bold px-2 py-0.5 rounded text-center"
                          style={{
                            background: GRADE_COLORS[selectedPE.overallRating]?.bg,
                            color: GRADE_COLORS[selectedPE.overallRating]?.text,
                          }}
                        >
                          {selectedPE.overallRating ?? '—'}
                        </div>
                      </div>

                      <div className={`p-3 rounded-lg border ${selectedPE.meetsStandard ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className={`text-[10px] font-semibold uppercase ${selectedPE.meetsStandard ? 'text-green-700' : 'text-red-700'} mb-1`}>
                          Standard
                        </div>
                        <div className={`text-[16px] font-bold ${selectedPE.meetsStandard ? 'text-green-900' : 'text-red-900'}`}>
                          {selectedPE.meetsStandard ? 'PASS' : 'FAIL'}
                        </div>
                      </div>
                    </div>

                    {selectedPE.disposition ? (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-[11px] font-semibold text-amber-800">
                          Disposition: <StatusBadge status={selectedPE.disposition} />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {/* Sections B, C, D, E */}
                {selectedPE.strengths ? (
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-2">
                      Section B — Strengths & Superior Performance
                    </h4>
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap">
                      {selectedPE.strengths}
                    </p>
                  </div>
                ) : null}

                {selectedPE.progress ? (
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-2">
                      Section C — Progress Achieved
                    </h4>
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap">
                      {selectedPE.progress}
                    </p>
                  </div>
                ) : null}

                {selectedPE.mistakes ? (
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-2">
                      Section D — Mistakes/Inefficiencies
                    </h4>
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap">
                      {selectedPE.mistakes}
                    </p>
                  </div>
                ) : null}

                {selectedPE.corrections ? (
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#1a3a5c] mb-2">
                      Section E — Corrections/Goals
                    </h4>
                    <p className="text-[13px] text-gray-700 whitespace-pre-wrap">
                      {selectedPE.corrections}
                    </p>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Acknowledged Status */}
            {selectedPE.status === 'acknowledged' ? (
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-[13px] text-purple-800">
                  <strong>Acknowledged on:</strong>{' '}
                  {new Date(selectedPE.acknowledgedAt).toLocaleDateString(
                    'en-PH'
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

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
