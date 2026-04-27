/**
 * Hand-written types for the Supabase tables.
 *
 * If you wire up the Supabase CLI, you can replace this with the generated
 * types via:  supabase gen types typescript --project-id <ref> > types/database.ts
 */

export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
};

export type Board = {
  id: string;
  owner_id: string;
  title: string;
  share_token: string | null;
  created_at: string;
  updated_at: string;
};

export type Column = {
  id: string;
  board_id: string;
  title: string;
  position: number;
  created_at: string;
};

export type Card = {
  id: string;
  column_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: string;
  updated_at: string;
};

export type ColumnWithCards = Column & { cards: Card[] };
export type BoardWithColumns = Board & { columns: ColumnWithCards[] };
