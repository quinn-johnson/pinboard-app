import { useStore } from '../store';
import ItemCard from './ItemCard';

function ItemList() {
  const { items, selectedPartyId, selectedView } = useStore();

  // Filter items based on selected view
  let filteredItems = items;

  if (selectedView === 'starred') {
    // Show only starred items
    filteredItems = items.filter(item => item.isStarred);
  } else if (selectedView === 'party' && selectedPartyId) {
    // Show items for selected party
    filteredItems = items.filter(item => item.parties.some(p => p.id === selectedPartyId));
  }
  // If selectedView === 'all', show all items (no filtering)

  // Sort active items: starred first (by creation date), then unstarred (by creation date)
  const activeItems = filteredItems
    .filter(item => !item.isCompleted)
    .sort((a, b) => {
      // Starred items come first
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      // Within same star status, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const completedItems = filteredItems
    .filter(item => item.isCompleted)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Active ({activeItems.length})
        </h2>
        {activeItems.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">No active items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>

      {completedItems.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Completed ({completedItems.length})
          </h2>
          <div className="space-y-3">
            {completedItems.map(item => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemList;
