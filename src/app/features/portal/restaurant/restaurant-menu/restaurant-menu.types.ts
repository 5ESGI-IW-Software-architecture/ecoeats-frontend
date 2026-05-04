export enum AllergenType {
  GLUTEN = 'GLUTEN',
  DAIRY = 'DAIRY',
  EGGS = 'EGGS',
  NUTS = 'NUTS',
  PEANUTS = 'PEANUTS',
  SHELLFISH = 'SHELLFISH',
  FISH = 'FISH',
  SOY = 'SOY',
  SESAME = 'SESAME',
  CELERY = 'CELERY',
  MUSTARD = 'MUSTARD',
  LUPIN = 'LUPIN',
  MOLLUSCS = 'MOLLUSCS',
  SULPHITES = 'SULPHITES',
}

export type PlateResponse = {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  unitPrice: number;
  currency: string;
  dailyStock: number;
  isAvailable: boolean;
  imageUrl?: string;
  allergens?: string[];
};

export type CreatePlateRequest = {
  name: string;
  description: string;
  dailyStock: number;
  unitPrice: number;
  imageUrl?: string;
  allergens?: string[];
};

export type UpdatePlateRequest = Partial<CreatePlateRequest>;
