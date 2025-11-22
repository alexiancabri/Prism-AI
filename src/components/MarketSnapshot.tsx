import { TrendingUp, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { marketIndices } from "@/data/mockData";

export const MarketSnapshot = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Market Snapshot</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {marketIndices.map((index) => (
          <Card key={index.name} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">{index.name}</p>
              <p className="text-2xl font-bold">{index.value.toLocaleString()}</p>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  index.change >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {index.change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>
                  {index.change >= 0 ? "+" : ""}
                  {index.change.toFixed(2)} ({index.changePercent >= 0 ? "+" : ""}
                  {index.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
