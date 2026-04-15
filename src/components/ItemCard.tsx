import { useState } from 'react';
import { useStore } from '../store';
import { db } from '../db';
import { Item } from '../types';
import PartyPill from './PartyPill';
import ThreadList from './ThreadList';
import { isReminderDue, formatReminderDate, getDefaultReminderTime, formatDateTimeForInput } from '../utils/reminders';
import { parseMarkdown, MarkdownHelp } from '../utils/markdown';

interface ItemCardProps {
  item: Item;
}

function ItemCard({ item }: ItemCardProps) {
  const { parties, refreshItems } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [isEditingParties, setIsEditingParties] = useState(false);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [showThreads, setShowThreads] = useState(false);
  const [reminderDateTime, setReminderDateTime] = useState(
    item.reminderAt ? formatDateTimeForInput(item.reminderAt) : getDefaultReminderTime()
  );
  const [error, setError] = useState('');

  const isDue = isReminderDue(item);

  const handleToggleComplete = async () => {
    try {
      await db.setItemCompletion(item.id, !item.isCompleted);
      await refreshItems();
    } catch (err) {
      console.error('Failed to toggle completion:', err);
    }
  };

  const handleSaveText = async () => {
    setError('');
    if (!editText.trim()) {
      setError('Item text cannot be empty');
      return;
    }

    try {
      await db.updateItemText(item.id, editText);
      await refreshItems();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    }
  };

  const handleAddParty = async (partyId: string) => {
    try {
      await db.addPartyToItem(item.id, partyId);
      await refreshItems();
    } catch (err) {
      console.error('Failed to add party:', err);
    }
  };

  const handleRemoveParty = async (partyId: string) => {
    try {
      await db.removePartyFromItem(item.id, partyId);
      await refreshItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove party');
    }
  };

  const handleSetReminder = async () => {
    try {
      const isoString = new Date(reminderDateTime).toISOString();
      await db.setItemReminder(item.id, isoString);
      await refreshItems();
      setIsEditingReminder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set reminder');
    }
  };

  const handleClearReminder = async () => {
    try {
      await db.setItemReminder(item.id, null);
      await refreshItems();
      setIsEditingReminder(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear reminder');
    }
  };

  const handleToggleStar = async () => {
    try {
      await db.toggleItemStar(item.id);
      await refreshItems();
    } catch (err) {
      console.error('Failed to toggle star:', err);
    }
  };

  const unassignedParties = parties.filter(
    p => !item.parties.some(ip => ip.id === p.id)
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${
      item.isCompleted
        ? 'opacity-60 bg-white border-gray-200'
        : isDue
        ? 'border-2 border-orange-400 bg-orange-50'
        : item.isStarred
        ? 'bg-yellow-50 border-yellow-200 border-2'
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-2 mt-1">
          <input
            type="checkbox"
            checked={item.isCompleted}
            onChange={handleToggleComplete}
            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />
          <button
            onClick={handleToggleStar}
            className={`transition-all ${
              item.isStarred
                ? 'text-yellow-500 hover:text-yellow-600 scale-110'
                : 'text-gray-300 hover:text-yellow-400'
            }`}
            title={item.isStarred ? 'Unmark as priority' : 'Mark as priority'}
          >
            <svg className="w-5 h-5" fill={item.isStarred ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                rows={3}
              />
              <div className="mt-2">
                <MarkdownHelp />
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveText}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditText(item.text);
                    setError('');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={`text-gray-900 ${item.isCompleted ? 'opacity-60' : ''}`}>
              {parseMarkdown(item.text)}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">
              {formatDate(item.createdAt)}
            </span>
            <span className="text-gray-300">•</span>
            {item.parties.map(party => (
              <div key={party.id} className="relative group">
                <PartyPill party={party} />
                {isEditingParties && (
                  <button
                    onClick={() => handleRemoveParty(party.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove party"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {isEditingParties && unassignedParties.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddParty(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs px-2 py-1 border border-gray-300 rounded-lg"
              >
                <option value="">+ Add party</option>
                {unassignedParties.map(party => (
                  <option key={party.id} value={party.id}>
                    {party.name}
                  </option>
                ))}
              </select>
            )}
            {item.reminderAt && !isEditingReminder && (
              <>
                <span className="text-gray-300">•</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isDue
                    ? 'bg-orange-100 text-orange-700 font-medium'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {isDue ? '🔔 ' : '⏰ '}{formatReminderDate(item.reminderAt)}
                </span>
              </>
            )}
          </div>

          {isEditingReminder && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set Reminder
              </label>
              <input
                type="datetime-local"
                value={reminderDateTime}
                onChange={(e) => setReminderDateTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSetReminder}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  Set Reminder
                </button>
                {item.reminderAt && (
                  <button
                    onClick={handleClearReminder}
                    className="px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200"
                  >
                    Clear Reminder
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsEditingReminder(false);
                    setReminderDateTime(item.reminderAt ? formatDateTimeForInput(item.reminderAt) : getDefaultReminderTime());
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {error && !isEditing && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit text"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setIsEditingParties(!isEditingParties)}
            className={`p-2 rounded-lg transition-colors ${
              isEditingParties
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Edit parties"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>
          <button
            onClick={() => setIsEditingReminder(!isEditingReminder)}
            className={`p-2 rounded-lg transition-colors ${
              isEditingReminder
                ? 'text-orange-600 bg-orange-50'
                : isDue
                ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                : item.reminderAt
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Set reminder"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <button
            onClick={() => setShowThreads(!showThreads)}
            className={`p-2 rounded-lg transition-colors relative ${
              showThreads
                ? 'text-purple-600 bg-purple-50'
                : item.threads.length > 0
                ? 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Notes & context"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            {item.threads.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {item.threads.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {showThreads && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <ThreadList itemId={item.id} threads={item.threads} onUpdate={refreshItems} />
        </div>
      )}
    </div>
  );
}

export default ItemCard;
