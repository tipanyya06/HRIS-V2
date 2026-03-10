import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';

export default function ApplyForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [isLoadingJob, setIsLoadingJob] = useState(true);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load job details');
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!form.fullName || !form.email || !form.phone) {
      setError('All fields are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/applications', {
        job_id: jobId,
        applicant_name: form.fullName,
        applicant_email: form.email,
        phone: form.phone,
      });

      setSuccess(true);
    } catch (err) {
      if (err.response?.status === 409) {
        setError('You have already applied for this position.');
        return;
      }
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingJob) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center pt-32">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* PAGE HEADER */}
      <section style={{ backgroundColor: '#223B5B' }} className="pt-32 pb-16 px-[6%] text-center">
        <div className="max-w-[1000px] mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Link to="/careers" className="text-xs text-white/40 font-light tracking-wide hover:text-white/60 transition-colors">
              Careers
            </Link>
            <span className="text-xs text-white/40">/</span>
            <span className="text-xs text-white/40 font-light tracking-wide">
              {job?.department || 'Position'}
            </span>
          </div>

          {/* Job Title */}
          <h1 className="font-serif text-4xl md:text-5xl font-semibold text-white tracking-tight mb-3">
            {job?.title || 'Loading...'}
          </h1>

          {/* Department Badge */}
          {job && (
            <div className="inline-flex items-center gap-2 mt-2">
              <span className="text-[10px] font-semibold tracking-[0.15em] uppercase text-[#2596BE] border border-[#2596BE]/40 px-3 py-1 rounded-sm bg-[#2596BE]/10">
                {job.department || 'General'}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="py-16 px-[6%]">
        <div className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* LEFT COLUMN — Job Details */}
          <div className="lg:col-span-2 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white border border-gray-200 rounded-sm p-8">
              {/* Description Section */}
              {job?.description && (
                <>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-px bg-[#2596BE]" />
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#2596BE]">
                      Job Description
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-light leading-relaxed mb-8">
                    {job.description}
                  </p>
                </>
              )}

              {/* Requirements Section */}
              {job?.requirements && job.requirements.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-4 pt-6 border-t border-gray-100">
                    <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#2596BE]">
                      Requirements
                    </span>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {job.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2596BE] mt-1.5 flex-shrink-0" />
                        <span className="text-sm text-gray-500 font-light">{req}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Slots Info */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-light flex items-center gap-2">
                  📋 {job?.slots} position{job?.slots !== 1 ? 's' : ''} available
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — Application Form */}
          <div className="lg:col-span-3">
            {/* SUCCESS STATE */}
            {success ? (
              <div className="bg-white border border-gray-200 rounded-sm p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-[#2596BE]/10 flex items-center justify-center text-[#2596BE] text-2xl mx-auto mb-6">
                  ✓
                </div>
                <h2 className="font-serif text-2xl text-[#223B5B] mb-2">
                  Application Submitted
                </h2>
                <p className="text-sm text-gray-500 font-light leading-relaxed mb-8">
                  Thank you for applying for the {job?.title} position. We'll review your application and reach out soon.
                </p>
                <button
                  onClick={() => navigate('/careers')}
                  type="button"
                  className="px-6 py-2.5 border border-[#223B5B] text-[#223B5B] text-xs font-semibold tracking-wide uppercase rounded-sm hover:bg-[#223B5B] hover:text-white transition-all"
                >
                  Back to Careers
                </button>
              </div>
            ) : (
              /* FORM */
              <div className="bg-white border border-gray-200 rounded-sm p-8">
                {/* Form Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-5 h-px bg-[#2596BE]" />
                  <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#2596BE]">
                    Apply for this Position
                  </span>
                </div>
                <h2 className="font-serif text-2xl font-semibold text-[#223B5B] mb-1">
                  Let's Get Started
                </h2>
                <p className="text-sm text-gray-400 font-light mb-8">
                  Fill in your details below — we'll be in touch shortly
                </p>

                {/* Error Message */}
                {error && (
                  <div className="text-xs text-red-400 font-light mb-4 text-center">
                    {error}
                  </div>
                )}

                {/* Form Fields */}
                <div className="flex flex-col gap-6">
                  {/* Full Name */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-[0.08em] uppercase text-gray-600">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Your full name"
                      value={form.fullName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm font-light border border-gray-200 rounded-sm placeholder:text-gray-300 focus:outline-none focus:border-[#223B5B] transition-colors"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-[0.08em] uppercase text-gray-600">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm font-light border border-gray-200 rounded-sm placeholder:text-gray-300 focus:outline-none focus:border-[#223B5B] transition-colors"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold tracking-[0.08em] uppercase text-gray-600">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="+63 123 456 7890"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 text-sm font-light border border-gray-200 rounded-sm placeholder:text-gray-300 focus:outline-none focus:border-[#223B5B] transition-colors"
                      required
                    />
                  </div>

                  {/* Resume Note */}
                  <div className="mt-2 mb-6 px-4 py-3 bg-[#2596BE]/[0.05] border border-[#2596BE]/20 rounded-sm">
                    <p className="text-xs text-gray-500 font-light leading-relaxed">
                      📎 Resume upload coming soon. For now, please email your resume to careers@madison88.com with the subject line: {job?.title || 'Position'} — Application
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    type="button"
                    style={{ backgroundColor: isSubmitting ? '#9CA3AF' : '#223B5B' }}
                    className="w-full py-4 text-white text-sm font-semibold tracking-[0.06em] uppercase rounded-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>

                  {/* Cancel Link */}
                  <button
                    onClick={() => navigate('/careers')}
                    type="button"
                    className="w-full py-3 text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors tracking-wide"
                  >
                    ← Back to All Positions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
