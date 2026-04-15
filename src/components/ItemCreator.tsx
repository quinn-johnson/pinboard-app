import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { db } from '../db';
import PartyPill from './PartyPill';
import CreatePartyModal from './CreatePartyModal';
import { MarkdownHelp } from '../utils/markdown';

function ItemCreator() {
  const {
    parties,
    newItemText,
    selectedPartyIds,
    selectedPartyId,
    selectedView,
    setNewItemText,
    togglePartySelection,
    setSelectedPartyIds,
    refreshItems,
    isCreatingParty,
    setIsCreatingParty
  } = useStore();

  const [error, setError] = useState('');

  // Auto-select ONLY the current party when viewing a party's page
  useEffect(() => {
    if (selectedPartyId && selectedView === 'party') {
      setSelectedPartyIds([selectedPartyId]);
    } else {
      setSelectedPartyIds([]);
    }
  }, [selectedPartyId, selectedView]);

  const handleSave = async () => {
    setError('');

    if (!newItemText.trim()) {
      setError('Item text is required');
      return;
    }

    if (selectedPartyIds.length === 0) {
      setError('Please select at least one party');
      return;
    }

    try {
      await db.createItem(newItemText, selectedPartyIds);
      setNewItemText('');
      // Keep current party selected if viewing a party's page
      if (selectedPartyId && selectedView === 'party') {
        setSelectedPartyIds([selectedPartyId]);
      } else {
        setSelectedPartyIds([]);
      }
      await refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Item</h2>

      <textarea
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
        placeholder="Enter action item... (supports **bold**, *italic*, ~~strikethrough~~, - bullets)"
        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
        rows={3}
      />

      <div className="mt-2">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 select-none">
            Formatting help
          </summary>
          <div className="mt-2">
            <MarkdownHelp />
          </div>
        </details>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Assign to parties:
        </label>
        <div className="flex flex-wrap gap-2">
          {parties.map(party => (
            <PartyPill
              key={party.id}
              party={party}
              selected={selectedPartyIds.includes(party.id)}
              onClick={() => togglePartySelection(party.id)}
            />
          ))}
          <button
            onClick={() => setIsCreatingParty(true)}
            className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-full hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            + Add Party
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Item
        </button>
      </div>

      {isCreatingParty && <CreatePartyModal />}
    </div>
  );
}

export default ItemCreator;
