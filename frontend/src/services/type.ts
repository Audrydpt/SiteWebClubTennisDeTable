export interface ResultatData {
  id: string;
  equipe: string;
  adversaire: string;
  score: string;
  division: string;
  domicile: boolean;
}

export interface SponsorData {
  id: string;
  name: string;
  logo: string;
}

export interface TournoiData {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
}

export interface Image {
  id: string;
  label: string;
  url: string;
  uploadDate: string;
}

export interface ActualiteData {
  imageUrl: string | undefined;
  id: string;
  title: string;
  content: string;
  redirectUrl: string;
  order: number;
}
