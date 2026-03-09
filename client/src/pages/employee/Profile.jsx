import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Button, Card, Input, LoadingSpinner, PageHeader, Toast } from '../../components/ui';

export default function Profile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    positionTitle: '',
  });

  const extractErrorMessage = (error) => {
    if (typeof error?.response?.data?.error === 'string') {
      return error.response.data.error;
    }
    if (typeof error?.response?.data?.error?.message === 'string') {
      return error.response.data.error.message;
    }
    if (typeof error?.message === 'string') {
      return error.message;
    }
    return 'Unable to load profile information.';
  };

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');

      const { data } = await api.get('/auth/me');
      setFormData({
        firstName: data?.personalInfo?.givenName || data?.firstName || '',
        lastName: data?.personalInfo?.lastName || data?.lastName || '',
        email: data?.email || '',
        department: data?.department || '',
        positionTitle: data?.positionTitle || data?.position || '',
      });
    } catch (error) {
      setHasError(true);
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsSaving(true);
      setToastMessage('Profile updates will be enabled after profile update API is available.');
    } catch (error) {
      setHasError(true);
      setErrorMessage(extractErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const content = isLoading ? (
    <div className="flex justify-center py-16">
      <LoadingSpinner size="lg" />
    </div>
  ) : hasError ? (
    <Card>
      <p className="text-red-600">{errorMessage}</p>
      <div className="mt-4">
        <Button onClick={loadProfile} variant="secondary" size="sm">Retry</Button>
      </div>
    </Card>
  ) : (
    <Card className="border border-slate-200">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="First name"
        />
        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Last name"
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="name@company.com"
          isDisabled={true}
        />
        <Input
          label="Department"
          name="department"
          value={formData.department}
          onChange={handleChange}
          placeholder="Department"
        />
        <Input
          label="Position"
          name="positionTitle"
          value={formData.positionTitle}
          onChange={handleChange}
          placeholder="Position title"
        />

        <div className="md:col-span-2 pt-2">
          <Button type="submit" isLoading={isSaving}>
            Save Profile
          </Button>
        </div>
      </form>
    </Card>
  );

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Review and maintain your personal employment details" />
      {content}
      {toastMessage ? <Toast message={toastMessage} type="info" onClose={() => setToastMessage('')} /> : null}
    </div>
  );
}
