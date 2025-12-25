'use client';

import { useState, useEffect } from 'react';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  familyId?: string;
  active: boolean;
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'YOUTH',
    familyId: '',
  });

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      const response = await fetch('/api/people?organizationId=default-org');
      if (response.ok) {
        const data = await response.json();
        setPeople(data);
      }
    } catch (err) {
      console.error('Error loading people:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'default-org',
          ...formData,
          familyId: formData.familyId || null,
        }),
      });

      if (response.ok) {
        setFormData({ firstName: '', lastName: '', role: 'YOUTH', familyId: '' });
        setShowForm(false);
        loadPeople();
      }
    } catch (err) {
      console.error('Error creating person:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">People</h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              {showForm ? 'Cancel' : '+ Add Person'}
            </button>
          </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <form onSubmit={handleCreatePerson} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YOUTH">Youth</option>
                    <option value="ADULT">Adult</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Create Person
                </button>
              </form>
            </div>
          )}

        {loading ? (
          <div className="text-center py-12">Loading people...</div>
        ) : people.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No people found. Create one to get started.
          </div>
        ) : (
          <div className="grid gap-4">
              {people.map((person) => (
                <div
                  key={person.id}
                  className="bg-white border border-gray-300 rounded-lg p-4 hover:shadow-md transition-shadow flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-gray-900">
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {person.role === 'ADULT' ? '👤 Adult' : '👧 Youth'}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm font-medium ${
                    person.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {person.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

    </div>
  );
}
