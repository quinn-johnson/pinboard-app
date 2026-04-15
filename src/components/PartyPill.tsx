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
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      }`
    : `${baseClasses} bg-blue-100 text-blue-700`;

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
