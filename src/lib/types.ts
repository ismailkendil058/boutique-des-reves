// src/lib/types.ts
// Centralized shared type definitions for the application.

export type ArticleStatus = "Disponible" | "Loué" | "En entretien" | "Indisponible";
export type Category = "Tenues" | "Accessoires" | "Autre";

export interface Article {
  id: string;
  name: string; // article name
  title?: string;
  category: Category;
  size?: string;
  color?: string;
  price: number;
  caution: number;
  status: ArticleStatus;
  notes?: string;
  photo?: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  mesures?: string; // optional additional field used in some calls
}

export interface Employee {
  id: string;
  name: string;
  pin: string;
  active: boolean;
}

export interface Versement {
  id: string;
  date: string;
  amount: number;
  type: string;
}

export interface Location {
  id: string;
  clientId: string;
  articleIds: string[];
  articlePrices?: Record<string, number>;
  total: number;
  versements: Versement[];
  status: string;
  createdAt: string;
  pickupDate: string;
  returnDate: string;
  actualReturnDate?: string;
  caution: number;
  cautionReturned?: boolean;
  notes?: string;
  occasion: string;
}

export interface Reservation {
  id: string;
  clientId: string;
  articleIds: string[];
  articlePrices?: Record<string, number>;
  pickupDate: string;
  returnDate: string;
  occasion: string;
  total: number;
  caution: number;
  versement: number;
  versements: Versement[];
  notes?: string;
  createdAt: string;
}

export interface SavedContractArticle {
  name: string;
  price: number;
}

export interface SavedContract {
  id: string;
  locationId: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  pickupDate: string;
  returnDate: string;
  total: number;
  caution: number;
  verse: number;
  reste: number;
  notes?: string;
  savedAt: string;
  articles: SavedContractArticle[];
}

export interface Note {
  id: string;
  articleId: string;
  articleName: string;
  message: string;
  date: string;
  createdAt: string;
}
