import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';

const DOC_TYPE_LABELS = {
  contract: 'Employment Contract',
  'government-id': 'Government ID',
  nbi: 'NBI Clearance',
  medical: 'Medical Certificate',
  clearance: 'Clearance',
  other: 'Other',
};

export default function EmployeeDocuments() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(
          '/employees/me/documents'
        );
        setDocuments(res.data?.data?.documents ?? []);
      } catch (err) {
        setError('Failed to load documents.');
        setDocuments([]);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id) fetchDocs();
  }, [user?.id]);

  return (
    <div className="w-full px-6 py-5 flex flex-col gap-4">
      <div>
        <h1 className="text-[20px] font-semibold text-[#1a3a5c]">
          My Documents
        </h1>
        <p className="text-[13px] text-gray-500 mt-0.5">
          View and download your employment documents.
        </p>
      </div>

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-[13px] text-gray-400">
          Loading documents...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-[13px] text-red-600">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-[32px]">DOC</div>
          <p className="text-[14px] font-medium text-[#1a3a5c]">
            No documents yet
          </p>
          <p className="text-[13px] text-gray-500 max-w-sm">
            Your HR team will upload your employment documents here. Check back after onboarding.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 text-[11px] text-[#185FA5] font-semibold">
                  {doc.mimeType?.includes('pdf') ? 'PDF'
                    : doc.mimeType?.includes('image') ? 'IMG'
                    : 'FILE'}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[#1a3a5c] truncate">
                    {doc.label
                      ?? DOC_TYPE_LABELS[doc.docType]
                      ?? doc.docType
                      ?? 'Document'}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {doc.fileName ?? ''}
                    {doc.uploadedAt ? ` · ${
                      new Date(doc.uploadedAt)
                        .toLocaleDateString('en-PH')
                    }` : ''}
                  </p>
                </div>
              </div>

              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                download={doc.fileName}
                className="flex-shrink-0 h-[30px] px-3 border border-gray-200 rounded-md text-[12px] font-medium text-[#185FA5] bg-white hover:bg-gray-50 inline-flex items-center gap-1 whitespace-nowrap"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
