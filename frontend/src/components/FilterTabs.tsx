// define the allowed filter values as a type
// this means TypeScript will warn you if you pass an invalid filter string
export type FilterType = "all" | "books" | "movies" | "to_watch" | "done"

type FilterTabsProps = {
  current: FilterType               // which filter is currently active
  onChange: (f: FilterType) => void // function to call when user clicks a different filter
}

// define the tabs as an array so we can loop over them instead of repeating code
const Tabs: { key: FilterType; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "books",    label: "Books" },
  { key: "movies",   label: "Movies" },
  { key: "to_watch", label: "To watch/read" },
  { key: "done",     label: "Done" },
]

function FilterTabs({ current, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-6">
      {Tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}   // tell the parent which filter was clicked
          className={`px-4 py-1.5 rounded-full text-sm border transition-colors
            ${current === tab.key
              ? "bg-gray-900 text-white border-gray-900"   // active style
              : "bg-white text-gray-500 border-stone-200 hover:bg-stone-50"  // inactive style
            }`}
            // the backtick string lets us combine fixed classes with a conditional
            // this pattern replaces what we'd normally do with a separate CSS class
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export default FilterTabs