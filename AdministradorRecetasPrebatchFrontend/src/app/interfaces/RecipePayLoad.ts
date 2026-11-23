export interface RecipePayload {

  id: string;
  idNumeric: number;
  name: string;
  mass: number;
  brix: number;
  density: number;
  type: number;
  sucrose: number;
  fructose: number;
  water: number;
  agitationDuration: number; 
  holdingDuration: number;   
  comments: string;
  version: number;     

  [key: `c${string}_id`]: string | '';
  [key: `c${string}_pos`]: number | 0;

}