import { useState } from 'react';
import { useStore } from '../store';
import { db } from '../db';

function CreatePartyModal() {
  const { newPartyName, setNewPartyName, setIsCreatingParty, refreshParties, refreshItems } = useStore();
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');

    if (!newPartyName.trim()) {
      setError('Party name is required');
      return;
    }

    try {
      await db.createParty(newPartyName);
      setNewPartyName('');
      setIsCreatingParty(false);
      await refreshParties();
      await refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create party');
    }
  };

  const handleClose = () => {
    setNewPartyName('');
    setIsCreatingParty(false);
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create New Party</h2>

        <input
          type="text"
          value={newPartyName}
          onChange={(e) => setNewPartyName(e.target.value)}
          placeholder="Enter party name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSave();
            } else if (e.key === 'Escape') {
              handleClose();
            }
          }}
        />

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Party
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreatePartyModal;
