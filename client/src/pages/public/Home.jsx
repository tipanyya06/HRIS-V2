import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../../components/ui';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="py-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          A Global Force in Outdoor Fashion
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Building High-Quality, Best-In-Class Accessories
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/careers')} variant="primary" size="lg">
            View Open Positions
          </Button>
          <Button onClick={() => navigate('/about-us')} variant="secondary" size="lg">
            Learn More
          </Button>
        </div>
      </section>

      <section className="py-12 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">Why Join Madison 88?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <h3 className="font-bold text-lg mb-2">Global Reach</h3>
            <p className="text-gray-600">Work with teams across the world</p>
          </Card>
          <Card>
            <h3 className="font-bold text-lg mb-2">Innovation</h3>
            <p className="text-gray-600">Cutting-edge products and processes</p>
          </Card>
          <Card>
            <h3 className="font-bold text-lg mb-2">Growth</h3>
            <p className="text-gray-600">Career development opportunities</p>
          </Card>
        </div>
      </section>

      <section className="py-12 text-center bg-blue-600 text-white rounded-lg mt-12">
        <h2 className="text-3xl font-bold mb-4">Ready to join our team?</h2>
        <Button onClick={() => navigate('/careers')} variant="ghost" size="lg">
          Browse All Jobs
        </Button>
      </section>
    </div>
  );
}
