import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function ApplyForm() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
  });

  // Fetch job details
  React.useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load job details');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.fullName || !formData.email || !formData.phone) {
      setError('All fields are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/applications', {
        jobId,
        ...formData,
      });

      setSuccess(true);
      setFormData({ fullName: '', email: '', phone: '' });

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      // Handle 409 Conflict — already applied
      if (err.response?.status === 409) {
        setError('You have already applied for this position with this email address.');
        return;
      }
      
      // Extract error message safely from response
      const errorMsg = 
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        'Failed to submit application';
      
      setError(typeof errorMsg === 'string' ? errorMsg : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
        <p className="text-gray-600">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-700 font-semibold">✓ Application submitted successfully!</p>
            <p className="text-green-600 text-sm">Redirecting back to job board...</p>
          </div>
        )}

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
          <p className="text-gray-600 mb-4">{job.department}</p>
          {job.description && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Job Description</h3>
              <p className="text-gray-700 text-sm">{job.description}</p>
            </div>
          )}
          {job.requirements && job.requirements.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1">
                {job.requirements.map((req, idx) => (
                  <li key={idx} className="text-gray-700 text-sm">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for this Position</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="John Doe"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+63 123 456 7890"
              />
            </div>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Resume upload will be available in the next update. For now, please include your resume details in your application or email it separately to careers@madison88.com
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2 px-4 rounded-lg font-semibold text-white transition ${
                submitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>

            {/* Cancel Link */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full py-2 px-4 rounded-lg font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
