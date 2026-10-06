import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type NavbarProps = {
  onAdd: () => void;
  showForm: boolean;
};

function Navbar({ onAdd, showForm }: NavbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const navClass = (path: string) => `rounded-full px-4 py-2 transition-colors hover:bg-[#f1e6d7] ${pathname === path ? "bg-[#452c1d] text-[#fff9ef] hover:bg-[#452c1d]" : ""}`;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    navigate(term ? `/shelf?q=${encodeURIComponent(term)}` : "/shelf");
  }

  return (
    <header className="mb-8 border-b border-[#e5d8c7] bg-[#FBFAF7]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10" aria-label="Main navigation">
        <Link to="/" className="flex shrink-0 items-center gap-3 text-[#2f2118]" aria-label="Thoughts and Titles home">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#b4442a] font-serif text-base font-semibold text-white" aria-hidden="true">栞</span>
          <span className="font-serif text-xl leading-none sm:text-2xl">Thoughts &amp; Titles</span>
        </Link>

        <div className="hidden items-center gap-1 text-sm font-medium text-[#39281e] lg:flex">
          <Link to="/" className={navClass("/")}>Home</Link>
          <Link to="/shelf" className={navClass("/shelf")}>Collection</Link>
          <Link to="/queue" className={navClass("/queue")}>Queue</Link>
          <Link to="/yearbook" className={navClass("/yearbook")}>Yearbook</Link>
        </div>

        <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 xl:block xl:max-w-[250px]" role="search">
          <label className="sr-only" htmlFor="site-search">Search your cabinet</label>
          <div className="flex items-center rounded-full border border-[#d9c3a9] bg-[#FFFFFF] px-3 py-2 text-[#806858] shadow-[0_1px_2px_rgba(65,40,24,.04)] focus-within:border-[#b4442a] focus-within:ring-2 focus-within:ring-[#b4442a]/15">
            <svg viewBox="0 0 20 20" fill="none" className="mr-2 h-3.5 w-3.5 shrink-0" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="4.25" stroke="currentColor" strokeWidth="1.5" />
              <path d="m11.75 11.75 3.25 3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              id="site-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#927968]"
            />
          </div>
        </form>

        <button
          type="button"
          onClick={onAdd}
          aria-expanded={showForm}
          className="shrink-0 rounded-full bg-[#b4442a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#96371f] sm:px-5"
        >
          <span className="text-lg leading-none">＋</span> Add to the cabinet
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
