import { memo, forwardRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
}

const SearchInput = memo(forwardRef<HTMLInputElement, SearchInputProps>(({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  showClearButton = true,
  disabled = false,
  ...props
}, ref) => {
  const handleClear = () => {
    onChange('');
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-slate-400" />
      </div>
      
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="block w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        {...props}
      />
      
      {showClearButton && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-slate-100 rounded-r-xl transition-colors duration-200"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
        </button>
      )}
    </div>
  );
}));

SearchInput.displayName = 'SearchInput';

export default SearchInput;