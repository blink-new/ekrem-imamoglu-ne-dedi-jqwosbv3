import { useState } from 'react';
import { Search, Filter, X, Calendar, Tag, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';

interface AdvancedSearchProps {
  onSearch: (query: string) => void;
  onFilter: (filters: SearchFilters) => void;
  categories: string[];
  popularTags: string[];
  searchQuery: string;
  filters: SearchFilters;
}

export interface SearchFilters {
  platform?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

const platformOptions = [
  { value: 'twitter', label: 'Twitter', icon: '🐦' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'facebook', label: 'Facebook', icon: '👥' },
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'rss', label: 'RSS', icon: '📡' }
];

export function AdvancedSearch({
  onSearch,
  onFilter,
  categories,
  popularTags,
  searchQuery,
  filters
}: AdvancedSearchProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleSearchChange = (value: string) => {
    onSearch(value);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilter(newFilters);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = localFilters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    
    handleFilterChange('tags', newTags);
  };

  const clearFilters = () => {
    const emptyFilters: SearchFilters = {};
    setLocalFilters(emptyFilters);
    onFilter(emptyFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
  );

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Açıklamalarda, etiketlerde ve kategorilerde ara..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant={hasActiveFilters ? "default" : "outline"} 
              className="h-12 px-6 flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtreler
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                  {Object.values(localFilters).filter(v => 
                    v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
                  ).length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <Card className="border-0 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Gelişmiş Filtreler</CardTitle>
                  {hasActiveFilters && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={clearFilters}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Temizle
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Platform
                  </label>
                  <Select 
                    value={localFilters.platform || ''} 
                    onValueChange={(value) => handleFilterChange('platform', value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tüm platformlar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tüm platformlar</SelectItem>
                      {platformOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            {option.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Kategori
                    </label>
                    <Select 
                      value={localFilters.category || ''} 
                      onValueChange={(value) => handleFilterChange('category', value || undefined)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tüm kategoriler" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tüm kategoriler</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Separator />

                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Tarih Aralığı
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Başlangıç</label>
                      <Input
                        type="date"
                        value={localFilters.dateFrom || ''}
                        onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Bitiş</label>
                      <Input
                        type="date"
                        value={localFilters.dateTo || ''}
                        onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Popular Tags */}
                {popularTags.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Popüler Etiketler</label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {popularTags.map(tag => {
                        const isSelected = localFilters.tags?.includes(tag) || false;
                        return (
                          <Badge
                            key={tag}
                            variant={isSelected ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                            {isSelected && <X className="h-3 w-3 ml-1" />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
          
          {localFilters.platform && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {platformOptions.find(p => p.value === localFilters.platform)?.label}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleFilterChange('platform', undefined)}
              />
            </Badge>
          )}
          
          {localFilters.category && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {localFilters.category}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleFilterChange('category', undefined)}
              />
            </Badge>
          )}
          
          {localFilters.dateFrom && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {new Date(localFilters.dateFrom).toLocaleDateString('tr-TR')} sonrası
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleFilterChange('dateFrom', undefined)}
              />
            </Badge>
          )}
          
          {localFilters.dateTo && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {new Date(localFilters.dateTo).toLocaleDateString('tr-TR')} öncesi
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleFilterChange('dateTo', undefined)}
              />
            </Badge>
          )}
          
          {localFilters.tags?.map(tag => (
            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
              #{tag}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => handleTagToggle(tag)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}