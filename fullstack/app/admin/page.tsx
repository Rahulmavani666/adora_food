'use client';

import React, { useState } from 'react';
import { seedDatabase, clearDatabase } from '../../lib/sample-data';
import { toast } from 'sonner';

export default function AdminPage() {
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Database Management</h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-2">Seed Database</h3>
              <p className="text-blue-700 text-sm mb-4">
                This will populate the database with sample restaurants and food items for testing purposes.
              </p>
              <button
                onClick={handleSeedDatabase}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Seeding...' : 'Seed Database'}
              </button>
            </div>

            <div className="p-4 bg-red-50 rounded-lg">
              <h3 className="font-medium text-red-800 mb-2">Clear Database</h3>
              <p className="text-red-700 text-sm mb-4">
                ⚠️ Warning: This will remove all data from the database. Use with caution!
              </p>
              <button
                onClick={handleClearDatabase}
                disabled={loading}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Clearing...' : 'Clear Database'}
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Instructions</h3>
            <ol className="list-decimal list-inside text-gray-700 text-sm space-y-1">
              <li>First, seed the database with sample data</li>
              <li>Navigate to the dashboard to test the system</li>
              <li>Switch between client and restaurant views</li>
              <li>Test the complete order flow: claim → accept → track → deliver</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}


