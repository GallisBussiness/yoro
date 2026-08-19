import { Search } from 'lucide-react';
import { Input } from '../shadcn/input';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Champ de recherche shadcn (Input + icône lucide Search).
 */
export function SearchInput({ value, onChange, placeholder = 'Rechercher...', className }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className ? `pl-9 ${className}` : 'pl-9'}
      />
    </div>
  );
}

export default SearchInput;
