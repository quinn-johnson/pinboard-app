import { useState } from 'react';
import { useStore } from '../store';
import { db } from '../db';
import { isReminderDue } from '../utils/reminders';

function Sidebar() {
  const { parties, selectedPartyId, selectedView, setSelectedPartyId, setSelectedView, items, refreshParties, refreshItems } = useStore();
  const [editingPartyId, setEditingPartyId] = useState<string | null>(null);
  const [editingPartyName, setEditingPartyName] = useState('');
  const [error, setError] = useState('');

  const getPartyItemCount = (partyId: string) => {
    return items.filter(item =>
      !item.isCompleted && item.parties.some(p => p.id === partyId)
    ).length;
  };

  const getPartyReminderCount = (partyId: string) => {
    return items.filter(item =>
      !item.isCompleted &&
      item.parties.some(p => p.id === partyId) &&
      isReminderDue(item)
    ).length;
  };

  const allActiveCount = items.filter(item => !item.isCompleted).length;
  const allReminderCount = items.filter(item => !item.isCompleted && isReminderDue(item)).length;
  const starredCount = items.filter(item => !item.isCompleted && item.isStarred).length;
  const starredReminderCount = items.filter(item => !item.isCompleted && item.isStarred && isReminderDue(item)).length;

  const handleStartEdit = (partyId: string, currentName: string) => {
    setEditingPartyId(partyId);
    setEditingPartyName(currentName);
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingPartyId) return;

    setError('');

    if (!editingPartyName.trim()) {
      setError('Party name is required');
      return;
    }

    try {
      await db.updatePartyName(editingPartyId, editingPartyName);
      await refreshParties();
      await refreshItems(); // Refresh to update party names in items
      setEditingPartyId(null);
      setEditingPartyName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update party name');
    }
  };

  const handleCancelEdit = () => {
    setEditingPartyId(null);
    setEditingPartyName('');
    setError('');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <button
          onClick={() => setSelectedView('all')}
          className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center justify-between transition-colors ${
            selectedView === 'all'
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span>All Items</span>
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              selectedView === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {allActiveCount}
            </span>
            {allReminderCount > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full bg-orange-500 text-white font-semibold animate-pulse">
                🔔 {allReminderCount}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setSelectedView('starred')}
          className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center justify-between transition-colors ${
            selectedView === 'starred'
              ? 'bg-yellow-50 text-yellow-800 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Starred
          </span>
          <div className="flex items-center gap-2">
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              selectedView === 'starred'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {starredCount}
            </span>
            {starredReminderCount > 0 && (
              <span className="text-sm px-2 py-0.5 rounded-full bg-orange-500 text-white font-semibold animate-pulse">
                🔔 {starredReminderCount}
              </span>
            )}
          </div>
        </button>

        {parties.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">
              Parties
            </h3>
            <div className="space-y-1">
              {parties.map(party => {
                const count = getPartyItemCount(party.id);
                const reminderCount = getPartyReminderCount(party.id);
                const isEditing = editingPartyId === party.id;

                if (isEditing) {
                  return (
                    <div key={party.id} className="px-4 py-3 bg-blue-50 rounded-lg">
                      <input
                        type="text"
                        value={editingPartyName}
                        onChange={(e) => setEditingPartyName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit();
                          } else if (e.key === 'Escape') {
                            handleCancelEdit();
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoFocus
                      />
                      {error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={party.id} className="relative group">
                    <button
                      onClick={() => setSelectedPartyId(party.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                        selectedPartyId === party.id
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="truncate pr-2">{party.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm px-2 py-0.5 rounded-full ${
                          selectedPartyId === party.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {count}
                        </span>
                        {reminderCount > 0 && (
                          <span className="text-sm px-2 py-0.5 rounded-full bg-orange-500 text-white font-semibold animate-pulse">
                            🔔 {reminderCount}
                          </span>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(party.id, party.name);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit party name"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}

export default Sidebar;
