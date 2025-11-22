import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { popularStocks } from "@/data/mockData";
import { Link } from "react-router-dom";
import { Plus, TrendingUp } from "lucide-react";

const Watchlist = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Watchlist</h1>
            <p className="text-muted-foreground">Track your favorite stocks and monitor their performance</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Stock
          </Button>
        </div>

        <div className="space-y-4">
          {popularStocks.map((stock) => (
            <Card key={stock.ticker} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <Link to={`/analyze/${stock.ticker}`} className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{stock.ticker}</h3>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                </Link>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Price</p>
                    <p className="text-lg font-bold">${stock.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Intrinsic Value</p>
                    <p className="text-lg font-bold">${stock.intrinsicValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Buffett Score</p>
                    <p className="text-lg font-bold text-primary">{stock.buffettScore}/100</p>
                  </div>
                  <div className="flex items-center">
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-semibold ${
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
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Watchlist;
