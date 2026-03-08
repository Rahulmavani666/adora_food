'use client';

import React, { useState } from 'react';
import { seedDatabase, clearDatabase } from '../../lib/sample-data';
import { toast } from 'sonner';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);
  const [showDbTools, setShowDbTools] = useState(false);

  const handleSeedDatabase = async () => {
    setLoading(true);
    try {
      await seedDatabase();
      toast.success('Database seeded successfully!');
    } catch (error) {
      toast.error('Failed to seed database');
      console.error('Error seeding database:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await clearDatabase();
      toast.success('Database cleared successfully!');
    } catch (error) {
      toast.error('Failed to clear database');
      console.error('Error clearing database:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminDashboard />
      
      {/* DB Tools toggle */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <button
          onClick={() => setShowDbTools(!showDbTools)}
          className="text-xs text-gray-600 hover:text-gray-400 transition"
        >
          {showDbTools ? 'Hide' : 'Show'} Database Tools
        </button>
        
        {showDbTools && (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/70 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Database Management (Dev Only)</h3>
            <div className="flex gap-3">
              <button
                onClick={handleSeedDatabase}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                {loading ? 'Working...' : 'Seed Database'}
              </button>
              <button
                onClick={handleClearDatabase}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
              >
                {loading ? 'Working...' : 'Clear Database'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


