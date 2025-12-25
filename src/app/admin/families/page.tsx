'use client';

import { useState, useEffect } from 'react';
import { maskPhoneForDisplay } from '@/lib/utils';
import { CSVImportModal } from '@/components/CSVImportModal';
import { EditFamilyModal } from '@/components/EditFamilyModal';
import { DeleteFamilyModal } from '@/components/DeleteFamilyModal';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  role: 'ADULT' | 'YOUTH';
  levelGroup?: string;
  position?: string;
}

interface Family {
  id: string;
  familyName: string;
  primaryPhoneE164: string;
  people: Person[];
}

interface DetectedFamily {
  familyName: string;
  primaryPhoneE164: string;
  adults: Array<{
    firstName: string;
    lastName: string;
    position?: string;
  }>;
  youth: Array<{
    firstName: string;
    lastName: string;
    levelGroup?: string;
  }>;
}

export default function FamiliesPage() {
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [formData, setFormData] = useState({ familyName: '', primaryPhoneE164: '' });
  
  // Edit modal state
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditSaving, setIsEditSaving] = useState(false);
  
  // Delete modal state
  const [deletingFamilyId, setDeletingFamilyId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      const response = await fetch(
        '/api/families?organizationId=default-org'
      );
      if (response.ok) {
        const data = await response.json();
        setFamilies(data);
      }
    } catch (err) {
      console.error('Error loading families:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'default-org',
          ...formData,
        }),
      });

      if (response.ok) {
        setFormData({ familyName: '', primaryPhoneE164: '' });
        setShowForm(false);
        loadFamilies();
      }
    } catch (err) {
      console.error('Error creating family:', err);
    }
  };

  const handleImportFamilies = async (familiesToImport: DetectedFamily[]) => {
    setIsImporting(true);
    try {
      const response = await fetch('/api/families/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: 'default-org',
          families: familiesToImport,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully imported ${data.importedCount} families!`);
        loadFamilies();
        setShowImportModal(false);
      }
    } catch (err) {
      console.error('Error importing families:', err);
      alert('Error importing families');
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditFamily = (family: Family) => {
    setEditingFamily(family);
    setShowEditModal(true);
  };

  const handleSaveFamily = async (data: {
    familyName: string;
    primaryPhone: string;
    people: Person[];
  }) => {
    if (!editingFamily) return;
    
    setIsEditSaving(true);
    try {
      const response = await fetch(`/api/families/${editingFamily.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: data.familyName,
          primaryPhone: data.primaryPhone,
          people: data.people,
        }),
      });

      if (response.ok) {
        await loadFamilies();
        setShowEditModal(false);
        setEditingFamily(null);
      } else {
        throw new Error('Failed to save family');
      }
    } catch (err) {
      throw err;
    } finally {
      setIsEditSaving(false);
    }
  };

  const handleDeleteFamily = (familyId: string) => {
    const family = families.find((f) => f.id === familyId);
    setDeletingFamilyId(familyId);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingFamilyId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/families/${deletingFamilyId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        await loadFamilies();
        setShowDeleteModal(false);
        setDeletingFamilyId(null);
      } else {
        throw new Error('Failed to delete family');
      }
    } catch (err) {
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <CSVImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportFamilies}
        isImporting={isImporting}
      />
      
      {editingFamily && (
        <EditFamilyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingFamily(null);
          }}
          familyId={editingFamily.id}
          familyName={editingFamily.familyName}
          primaryPhone={editingFamily.primaryPhoneE164}
          people={editingFamily.people}
          onSave={handleSaveFamily}
          isLoading={isEditSaving}
        />
      )}
      
      {deletingFamilyId && (
        <DeleteFamilyModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeletingFamilyId(null);
          }}
          familyName={families.find((f) => f.id === deletingFamilyId)?.familyName || ''}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
        />
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Families</h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
              >
                📥 Import CSV
              </button>
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
              >
                {showForm ? 'Cancel' : '+ Add Family'}
              </button>
            </div>
          </div>

          {showForm && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <form onSubmit={handleCreateFamily} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Family Name
                  </label>
                  <input
                    type="text"
                    value={formData.familyName}
                    onChange={(e) =>
                      setFormData({ ...formData, familyName: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.primaryPhoneE164}
                    onChange={(e) =>
                      setFormData({ ...formData, primaryPhoneE164: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Create Family
                </button>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">Loading families...</div>
          ) : families.length === 0 ? (
            <div className="text-center py-12 text-gray-600 dark:text-gray-400">
              No families found. Create one to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {families.map((family) => (
                <div
                  key={family.id}
                  className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {family.familyName}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        {maskPhoneForDisplay(family.primaryPhoneE164)}
                      </p>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {family.people.length} member(s)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditFamily(family)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteFamily(family.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
