import { Trash2 } from "lucide-react";

// --- Sub-Component: Sidebar Item ---
const SidebarItem = ({ s, isSelected, onClick, onDelete }) => {
  // Determine if the stock is up or down
  const isPositive = s.percent >= 0;
  const textColor = isPositive ? "text-green-600" : "text-red-500";

  return (
    <div
      onClick={() => onClick(s)}
      className={`flex justify-between items-center p-3 border-b border-gray-100 cursor-pointer transition-all group
        ${isSelected ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50"}`}
    >
      {/* Left side: Symbol and Currency */}
      <div className="flex flex-col min-w-0">
        <span className="font-bold text-sm text-gray-800 truncate">
          {s.symbol}
        </span>
        <span className="text-[10px] text-gray-400 font-mono uppercase">
          {s.currency || "USD"}
        </span>
      </div>

      {/* Right side: Price, Percent, and Delete Button */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end">
          <span className="font-mono text-sm font-semibold text-gray-900">
            {s.price ? s.price.toFixed(2) : "0.00"}
          </span>
          <span className={`font-mono text-[11px] font-bold ${textColor}`}>
            {isPositive ? "+" : ""}
            {s.percent?.toFixed(2)}%
          </span>
        </div>

        {/* Delete Button - only visible on group hover */}
        <div className="w-8 flex justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation(); // Double safety to prevent selecting the stock when deleting
              onDelete(e, s.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
            title="Remove stock"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SidebarItem;
