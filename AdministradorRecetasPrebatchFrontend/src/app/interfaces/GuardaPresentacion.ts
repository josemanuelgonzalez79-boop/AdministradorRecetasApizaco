export interface GuardaPresentacion {
  presentation_id: string;
  presentation_name: string;
  recipe_reference: string;
  units: number;
  c01_id: string | null;
  c02_id: string | null;
  c03_id: string | null;
  c04_id: string | null;
  c05_id: string | null;
  comments: string;
  version: number;
}