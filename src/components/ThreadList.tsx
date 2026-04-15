import { useState } from 'react';
import { Thread } from '../types';
import { db } from '../db';
import { parseMarkdown, MarkdownHelp } from '../utils/markdown';

interface ThreadListProps {
  itemId: string;
  threads: Thread[];
  onUpdate: () => Promise<void>;
}

function ThreadList({ itemId, threads, onUpdate }: ThreadListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newThreadText, setNewThreadText] = useState('');
  const [error, setError] = useState('');

  const handleAddThread = async () => {
    setError('');

    if (!newThreadText.trim()) {
      setError('Thread text is required');
      return;
    }

    try {
      await db.addThread(itemId, newThreadText);
      setNewThreadText('');
      setIsAdding(false);
      await onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add thread');
    }
  };

  const handleDeleteThread = async (threadId: string) => {
    try {
      await db.deleteThread(threadId);
      await onUpdate();
    } catch (err) {
      console.error('Failed to delete thread:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };


  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">
          Notes & Context {threads.length > 0 && `(${threads.length})`}
        </h4>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + Add Note
          </button>
        )}
      </div>

      {threads.length > 0 && (
        <div className="space-y-2 mb-3">
          {threads.map(thread => (
            <div
              key={thread.id}
              className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-100 group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-gray-800 break-words flex-1">
                  {parseMarkdown(thread.text)}
                </div>
                <button
                  onClick={() => handleDeleteThread(thread.id)}
                  className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  title="Delete note"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">{formatDate(thread.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {isAdding && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <textarea
            value={newThreadText}
            onChange={(e) => setNewThreadText(e.target.value)}
            placeholder="Add context, notes, or links... (supports **bold**, *italic*, ~~strikethrough~~, - bullets)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            rows={3}
            autoFocus
          />
          <div className="mt-2">
            <MarkdownHelp />
          </div>
          {error && (
            <p className="text-xs text-red-600 mt-2">{error}</p>
          )}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddThread}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Add Note
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewThreadText('');
                setError('');
              }}
              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {threads.length === 0 && !isAdding && (
        <p className="text-xs text-gray-500 italic">No notes yet</p>
      )}
    </div>
  );
}

export default ThreadList;
