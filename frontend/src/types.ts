// define the shape of an Item — TypeScript will warn you if you miss a field
// export this type so ItemCard.tsx can import it
export type Item = {
  id: number;
  title: string;
  type: "book" | "movie";
  status: "to_watch" | "done";
  rating: number | null; // number | null means it can be a number OR empty
  description: string;
  review: string;
};