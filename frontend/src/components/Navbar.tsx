type NavbarProps = {
  onAdd: () => void;
  showForm: boolean;
};

function Navbar({ onAdd, showForm }: NavbarProps) {
  const { pathname } = useLocation();
  const navClass = (path: string) => `rounded-full px-4 py-2 transition-colors hover:bg-[#f1e6d7] ${pathname === path ? "bg-[#452c1d] text-[#fff9ef] hover:bg-[#452c1d]" : ""}`;

  return (
    <header className="mb-8 border-b border-[#e5d8c7] bg-[#fbf4e9]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-10" aria-label="Main navigation">
        <Link to="/" className="flex shrink-0 items-center gap-3 text-[#2f2118]" aria-label="Thoughts and Titles home">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[#b4442a] font-serif text-base font-semibold text-white" aria-hidden="true">栞</span>
          <span className="font-serif text-xl leading-none sm:text-2xl">Thoughts &amp; Titles</span>
        </Link>

        <div className="hidden items-center gap-1 text-sm font-medium text-[#39281e] lg:flex">
          <Link to="/" className={navClass("/")}>Home</Link>
          <Link to="/shelf" className={navClass("/shelf")}>Shelf</Link>
          <Link to="/nightstand" className={navClass("/nightstand")}>Nightstand</Link>
          <a href="#year-in-review" className="rounded-full px-4 py-2 transition-colors hover:bg-[#f1e6d7]">Year in review</a>
        </div>

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
import { Link, useLocation } from "react-router-dom";
