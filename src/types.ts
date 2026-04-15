export interface Party {
  id: string;
  name: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  itemId: string;
  text: string;
  createdAt: string;
}

export interface Item {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  completedAt: string | null;
  reminderAt: string | null;
  isStarred: boolean;
  parties: Party[];
  threads: Thread[];
}
