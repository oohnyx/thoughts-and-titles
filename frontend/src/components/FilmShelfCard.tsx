import type { MovieEntry } from "../types";
import { RewatchRibbon, TagLabel } from "./CollectionDetails";

const posterBase = "https://image.tmdb.org/t/p/w342";

export function FilmPoster({ item, onClick }: { item: MovieEntry; index: number; onClick: () => void }) {
  const src = item.posterPath ? posterBase + item.posterPath : undefined;
  return <button type="button" onClick={onClick} className="min-w-0 text-left">
    <div className="relative aspect-[.69] overflow-hidden rounded-sm border border-[#d9cbb9] bg-[#f8eddb]">
      <span className="absolute -top-7 left-1/2 z-10 h-8 w-1 -translate-x-1/2 rotate-6 bg-[#8f684b]" />
      {(item.rewatchCount ?? 1) > 1 && <RewatchRibbon />}
      {src ? <img src={src} alt={item.title + " poster"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-4 text-center text-[#5d493b]"><span>▧</span><span className="mt-2 text-xs">drop poster — {item.title}</span></div>}
    </div>
  </button>;
}
export function FilmMetadata({ item, onClick }: { item: MovieEntry; onClick: () => void }) {
  const rewatchCount = item.rewatchCount ?? 1;
  return <button type="button" onClick={onClick} className="relative min-w-0 pt-7 text-left text-[#352218]">{item.sumUpInOneWord && <TagLabel className="absolute left-1/2 top-[-1px] z-10 -translate-x-1/2">{item.sumUpInOneWord}</TagLabel>}<div className="flex items-start gap-2"><h3 className="line-clamp-2 min-h-10 flex-1 font-serif text-lg leading-5">{item.title}</h3><span className="pt-1 text-[10px] text-[#806858]">{item.releaseYear}</span></div><p className="mt-1 text-xs text-[#806858]">{item.mediaType === "series" ? "Series" : "Movie"}{rewatchCount > 1 && <span className="text-[#b4442a]"> · rewatched ×{rewatchCount}</span>}</p><p className="text-sm text-[#b4442a]">{"★".repeat(item.rating ?? 0)}{"☆".repeat(5 - (item.rating ?? 0))}</p></button>;
}
