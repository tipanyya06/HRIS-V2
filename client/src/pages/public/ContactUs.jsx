import React, { useState } from 'react';
import { Input, Button } from '../../components/ui';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Page Header */}
      <h1
        className="text-5xl font-bold text-center mb-4"
        style={{ color: '#223B5B' }}
      >
        Contact Us
      </h1>
      <p className="text-gray-600 text-center mb-12">
        Have questions? We'd love to hear from you.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#223B5B' }}
          >
            Get In Touch
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-lg mb-2">Office Location</h3>
              <p className="text-gray-600">
                Denver, Colorado<br />
                United States
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Email</h3>
              <p className="text-gray-600">
                <a
                  href="mailto:info@madison88.com"
                  className="hover:underline"
                  style={{ color: '#2596BE' }}
                >
                  info@madison88.com
                </a>
              </p>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-2">Careers</h3>
              <p className="text-gray-600">
                Interested in joining our team?<br />
                <a
                  href="/careers"
                  className="hover:underline"
                  style={{ color: '#2596BE' }}
                >
                  View open positions →
                </a>
              </p>
            </div>
          </div>

          <div className="mt-8">
            <img
              src="/darklogo.png"
              alt="Madison 88"
              className="h-16"
            />
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: '#223B5B' }}
          >
            Send us a message
          </h2>

          {submitted ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              Thank you for your message! We'll get back to you soon.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your message..."
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                style={{ backgroundColor: '#2596BE' }}
              >
                Send Message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
