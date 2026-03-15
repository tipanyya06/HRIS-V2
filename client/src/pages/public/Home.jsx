import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';

export default function Home() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/jobs?status=active');
      const jobList = response.data?.data || [];
      setJobs(jobList);

      const uniqueDepartments = [...new Set(jobList.map((job) => job.department).filter(Boolean))];
      setDepartments(uniqueDepartments);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load jobs');
      setJobs([]);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredJobs = activeFilter === 'All'
    ? jobs
    : jobs.filter((job) => job.department === activeFilter);

  return (
    <div>
      {/* Hero Section */}
      <section>
        <div style={{
          height: '760px',
          backgroundImage: 'url("/Scenic-Mountain-Background-2-scaled.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          textAlign: 'center'
        }}>
        <div className="text-center text-white">
          <h1 className="font-bold text-5xl mb-4">
            A Global Force in Outdoor Fashion
          </h1>
          <p className="text-2xl">
            Building High-Quality, Best-In-Class Accessories
          </p>
        </div>
        </div>
      </section>

      {/* About Madison 88 Section */}
      <section className="mx-auto px-8" style={{ maxWidth: '1100px' }}>
        <div className="flex flex-col lg:flex-row gap-8 py-12" style={{ minHeight: '550px' }}>
          {/* Left Image */}
          <div className="w-full lg:w-1/4">
            <img
              src="https://madison88.com/wp-content/uploads/2024/11/Winter-Beanie-Scarf-Outfit-Scenic.png"
              alt="Winter Beanie"
              className="w-full h-full object-cover rounded-lg"
              style={{ boxShadow: '-14px -14px 0 0 #223b5b' }}
            />
          </div>

          {/* Right Content */}
          <div className="w-full lg:w-3/5 p-12 flex flex-col justify-center">
            <h2
              className="text-4xl font-bold mb-6"
              style={{ color: '#223B5B' }}
            >
              We are Madison 88.
            </h2>
            <p className="text-xl text-gray-600 leading-loose">
              A privately held outdoor accessories company with a primary office
              location in Denver, CO. We are a world-class design, development and
              manufacturing company that can help reimagine what your assortments can be.
            </p>
          </div>
        </div>
      </section>

      {/* Who We Are Section */}
      <section
        className="flex items-center px-8 lg:px-16"
        style={{
          height: '750px',
          backgroundImage: 'url("https://madison88.com/wp-content/uploads/2024/11/Team-Background-Image-Outdoor-Activities.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ maxWidth: '900px' }}>
          <h2 className="text-4xl font-bold text-white mb-4">
            Who We Are
          </h2>
          <p className="text-2xl text-white mb-8">
            We are not just a company; we are creators, thinkers, and pioneers
            who have mastered the art of bringing designs to life, from concept
            to peak performance.
          </p>
          <Link
            to="/about-us"
            className="inline-block bg-white font-bold py-3 px-6 rounded hover:bg-gray-100 transition-colors"
            style={{ color: '#223B5B' }}
          >
            About Us
          </Link>
        </div>
      </section>

      {/* Facilities Section */}
      <section
        className="pt-8 w-full"
        style={{ backgroundColor: '#ebebeb' }}
      >
        <h2
          className="text-5xl font-bold text-center pb-6"
          style={{ color: '#223B5B' }}
        >
          Madison 88 Facilities
        </h2>
        <div
          style={{
            height: '760px',
            backgroundImage: 'url("https://madison88.com/wp-content/uploads/2024/12/Madison-88-Facilities4.png")',
            backgroundSize: '70% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#ebebeb',
          }}
        />
      </section>

      {/* Open Positions Section */}
      <section className="bg-white py-24 px-[6%]">
        <div className="max-w-[1100px] mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-px bg-[#2596BE] inline-block" />
                <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#2596BE]">
                  Open Positions
                </span>
              </div>
              <h2 className="text-4xl font-bold text-[#223B5B]">
                Find Your Next Role
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveFilter('All')}
                className={`px-4 py-1.5 text-xs font-medium tracking-wide border rounded-sm transition-all ${
                  activeFilter === 'All'
                    ? 'border-[#223B5B] text-[#223B5B] bg-gray-50'
                    : 'border-gray-200 text-gray-500 bg-white hover:border-[#223B5B] hover:text-[#223B5B]'
                }`}
              >
                All Departments
              </button>
              {departments.map((department) => (
                <button
                  key={department}
                  type="button"
                  onClick={() => setActiveFilter(department)}
                  className={`px-4 py-1.5 text-xs font-medium tracking-wide border rounded-sm transition-all ${
                    activeFilter === department
                      ? 'border-[#223B5B] text-[#223B5B] bg-gray-50'
                      : 'border-gray-200 text-gray-500 bg-white hover:border-[#223B5B] hover:text-[#223B5B]'
                  }`}
                >
                  {department}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="py-10 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-red-400 text-sm text-center">{error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm tracking-wide">
              No positions found in this department.
            </div>
          ) : (
            <div className="flex flex-col gap-px">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  onClick={() => navigate('/careers')}
                  className="group flex items-center gap-5 px-7 py-6 bg-white border border-gray-200 rounded-sm cursor-pointer transition-all duration-200 hover:border-[#223B5B] hover:shadow-md hover:translate-x-0.5"
                >
                  <span className="w-2 h-2 rounded-full bg-[#2596BE] flex-shrink-0" />

                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#2596BE] bg-[#2596BE]/[0.07] px-3 py-1 rounded-sm flex-shrink-0 min-w-[130px] text-center">
                    {job.department || 'General'}
                  </span>

                  <h3 className="flex-1 text-lg font-semibold text-[#223B5B]">
                    {job.title}
                  </h3>

                  <div className="hidden sm:flex items-center gap-5 ml-auto">
                    <span className="text-xs text-gray-400 font-light whitespace-nowrap">
                      Location: {job.country || 'PH'}
                    </span>
                    <span className="text-xs text-gray-400 font-light whitespace-nowrap">
                      Full-time
                    </span>
                  </div>

                  <span className="text-gray-300 text-base ml-4 flex-shrink-0 transition-all group-hover:text-[#223B5B] group-hover:translate-x-1">
                    -&gt;
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate('/careers')}
              className="px-8 py-3 border-[1.5px] border-[#223B5B] text-[#223B5B] text-xs font-semibold tracking-[0.08em] uppercase rounded-sm hover:bg-[#223B5B] hover:text-white transition-all duration-200"
            >
              Explore All Positions
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
