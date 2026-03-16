import React from 'react';
import { Card, PageHeader } from '../../components/ui';

const docs = [
  { name: 'Employment Contract', status: 'Available' },
  { name: 'Company Handbook', status: 'Available' },
  { name: 'Tax Declaration', status: 'Pending Upload' },
];

export default function Documents() {
  return (
    <div>
      <PageHeader title="My Documents" subtitle="Access your HR and compliance files" />
      <div className="space-y-3">
        {docs.map((doc) => (
          <Card key={doc.name} className="border border-slate-200">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-900">{doc.name}</p>
              <span className="text-sm text-slate-500">{doc.status}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
