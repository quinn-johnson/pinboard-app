import { Party } from '../types';

interface PartyPillProps {
  party: Party;
  selected?: boolean;
  onClick?: () => void;
}

function PartyPill({ party, selected = false, onClick }: PartyPillProps) {
  const baseClasses = "px-3 py-1.5 text-sm font-medium rounded-full transition-colors";

  const classes = onClick
    ? `${baseClasses} cursor-pointer ${
        selected
          ? 'bg-blue-600 text-white'
          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
      }`
    : `${baseClasses} bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300`;

  return (
    <span
      className={classes}
      onClick={onClick}
    >
      {party.name}
    </span>
  );
}

export default PartyPill;
