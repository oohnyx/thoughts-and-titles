// this component receives two things from its parent (App.tsx):
// - onAdd: a function to call when the button is clicked
// - showForm: whether the form is currently open (so we can change the button label)

// "Props" short for properties — how a parent passes data to a child component
type NavbarProps = {
  onAdd: () => void      // () => void - a function that takes no arguments and returns nothing
  showForm: boolean
}

function Navbar({ onAdd, showForm }: NavbarProps) {
  // we "destructure" the props here - instead of props.onAdd and props.showForm,
  // we pull them out directly: { onAdd, showForm }

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold tracking-tight">Thoughts and Titles</h1>
      <button
        onClick={onAdd}    // call the function passed down from App.tsx
        className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        {showForm ? "Cancel" : "+ Add item"}
        {/* ternary: show "Cancel" if form is open, "+ Add item" if not */}
      </button>
    </div>
  )
}

export default Navbar