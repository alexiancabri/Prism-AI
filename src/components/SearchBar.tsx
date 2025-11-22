import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

const popularTickers = ["AAPL", "MSFT", "KO", "BRK.B", "JNJ", "PG", "V", "MA"];

export const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const filteredTickers = popularTickers.filter((ticker) =>
    ticker.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = (ticker: string) => {
    setQuery("");
    setShowSuggestions(false);
    navigate(`/analyze/${ticker}`);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search stocks by ticker (e.g., AAPL, MSFT, KO)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(e.target.value.length > 0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && query) {
              handleSearch(query.toUpperCase());
            }
          }}
          className="pl-12 h-14 text-lg rounded-xl border-2 focus-visible:ring-primary"
        />
      </div>

      {showSuggestions && filteredTickers.length > 0 && (
        <div className="absolute top-full mt-2 w-full bg-card border rounded-xl shadow-lg z-50 animate-fade-in">
          {filteredTickers.map((ticker) => (
            <button
              key={ticker}
              onClick={() => handleSearch(ticker)}
              className="w-full px-4 py-3 text-left hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              <span className="font-semibold text-primary">{ticker}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
