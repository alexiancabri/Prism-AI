import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { MarketSnapshot } from "@/components/MarketSnapshot";
import { Card } from "@/components/ui/card";
import { popularStocks } from "@/data/mockData";
import { TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Powered by Warren Buffett's Investment Philosophy
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Invest Like
            <span className="text-primary"> Warren Buffett</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze stocks using legendary value investing principles. Get intrinsic value calculations,
            quality scores, and intelligent buy/sell recommendations.
          </p>
        </div>

        {/* Search Section */}
        <div className="flex justify-center animate-slide-up">
          <SearchBar />
        </div>

        {/* Market Snapshot */}
        <div className="animate-slide-up">
          <MarketSnapshot />
        </div>

        {/* Popular Stocks */}
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Popular Stocks</h2>
            <Link to="/watchlist" className="text-primary hover:underline flex items-center gap-1">
              View Watchlist <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularStocks.map((stock) => (
              <Link key={stock.ticker} to={`/analyze/${stock.ticker}`}>
                <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">{stock.ticker}</h3>
                        <p className="text-sm text-muted-foreground">{stock.name}</p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          stock.recommendation === "BUY"
                            ? "bg-success/10 text-success"
                            : stock.recommendation === "HOLD"
                            ? "bg-warning/10 text-warning"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {stock.recommendation}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                        <p className="text-xl font-bold">${stock.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Buffett Score</p>
                        <p className="text-xl font-bold text-primary">{stock.buffettScore}/100</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Intrinsic Value</span>
                        <span className="font-semibold">${stock.intrinsicValue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 animate-slide-up">
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Quality Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Evaluate stocks across moat strength, financial health, and management quality
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Intrinsic Value</h3>
            <p className="text-sm text-muted-foreground">
              Calculate true business value using discounted cash flow analysis
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get clear buy, hold, or sell signals based on margin of safety
            </p>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Index;
