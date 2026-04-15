import { useEffect, useState } from 'react';
import { useStore } from './store';
import { db } from './db';
import Sidebar from './components/Sidebar';
import ItemCreator from './components/ItemCreator';
import ItemList from './components/ItemList';

function App() {
  const { refreshParties, refreshItems, selectedPartyId, selectedView, parties } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await db.init();
        await refreshParties();
        await refreshItems();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (isInitialized) {
      refreshItems();
    }
  }, [selectedPartyId, selectedView, isInitialized]);

  // Check for due reminders every 30 seconds
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshItems();
    }, 30000);

    return () => clearInterval(interval);
  }, [isInitialized, refreshItems]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="text-xl font-semibold text-gray-900 mb-2">Loading...</div>
          <div className="text-gray-600">Initializing database</div>
        </div>
      </div>
    );
  }

  const selectedParty = selectedPartyId
    ? parties.find(p => p.id === selectedPartyId)
    : null;

  let viewTitle = 'All Items';
  if (selectedView === 'starred') {
    viewTitle = 'Starred Items';
  } else if (selectedView === 'party' && selectedParty) {
    viewTitle = selectedParty.name;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">{viewTitle}</h1>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            <ItemCreator />
            <ItemList />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
