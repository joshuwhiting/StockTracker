

// --- Sub-Component: Sidebar Item ---
const SidebarItem = ({ s, isSelected, onClick }) => {
  return (
    <div 
      onClick={() => onClick(s)}
      className={`flex justify-between items-center p-3 border-b border-gray-100 cursor-pointer transition-colors
        ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'}`}
    >
      <div className="flex flex-col">
        <span className="font-bold text-sm text-gray-800">{s.symbol}</span>
        <span className="text-[10px] text-gray-400 font-mono uppercase">{s.currency}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-mono text-sm font-semibold">{s.price?.toFixed(2)}</span>
      </div>
    </div>
  );
};

export default SidebarItem;