import { Trash2 } from "lucide-react";

// --- Sub-Component: Sidebar Item ---
const SidebarItem = ({ s, isSelected, onClick, onDelete }) => {
  return (
    <div
      onClick={() => onClick(s)}
      // Added 'group' class to parent to show/hide delete button on hover
      className={`flex justify-between items-center p-3 border-b border-gray-100 cursor-pointer transition-colors group
        ${isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50"}`}
    >
      <div className="flex flex-col">
        <span className="font-bold text-sm text-gray-800">{s.symbol}</span>
        <span className="text-[10px] text-gray-400 font-mono uppercase">
          {s.currency}
        </span>
      </div>

      <div className="flex flex-col items-end">
        <span className="font-mono text-sm font-semibold">
          {s.price?.toFixed(2)}
        </span>
      </div>
      <div>
        <button
          onClick={(e) => onDelete(e, s.id)}
          className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
          title="Remove stock"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default SidebarItem;
