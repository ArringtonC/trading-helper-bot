export interface TraderProfile {
  id: string;
  name: string;
  imageUrl: string;
  bio: string;
  philosophy: string;
  famousTrades: {
    title: string;
    summary: string;
  }[];
  latestPicks: {
    ticker: string;
    thesis: string;
    date: string;
  }[];
} 