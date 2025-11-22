import { TrendingUp, MinusCircle, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecommendationBadgeProps {
  recommendation: "BUY" | "HOLD" | "SELL";
  price: number;
  intrinsicValue: number;
}

export const RecommendationBadge = ({
  recommendation,
  price,
  intrinsicValue,
}: RecommendationBadgeProps) => {
  const marginOfSafety = ((intrinsicValue - price) / price) * 100;

  const getRecommendationStyle = () => {
    switch (recommendation) {
      case "BUY":
        return "border-success bg-success/10 text-success";
      case "HOLD":
        return "border-warning bg-warning/10 text-warning";
      case "SELL":
        return "border-destructive bg-destructive/10 text-destructive";
    }
  };

  const getIcon = () => {
    switch (recommendation) {
      case "BUY":
        return <TrendingUp className="h-12 w-12" />;
      case "HOLD":
        return <MinusCircle className="h-12 w-12" />;
      case "SELL":
        return <TrendingDown className="h-12 w-12" />;
    }
  };

  const getDescription = () => {
    switch (recommendation) {
      case "BUY":
        return "Stock is undervalued with a significant margin of safety. Good buying opportunity.";
      case "HOLD":
        return "Stock is fairly valued. Consider holding current position.";
      case "SELL":
        return "Stock is overvalued. Consider reducing position or avoiding.";
    }
  };

  return (
    <Card className={cn("p-8 border-4 text-center space-y-4", getRecommendationStyle())}>
      <div className="flex justify-center">{getIcon()}</div>
      <div>
        <h2 className="text-4xl font-bold mb-2">{recommendation}</h2>
        <p className="text-lg font-medium mb-4">{getDescription()}</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between max-w-md mx-auto">
            <span className="text-muted-foreground">Current Price:</span>
            <span className="font-semibold">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between max-w-md mx-auto">
            <span className="text-muted-foreground">Intrinsic Value:</span>
            <span className="font-semibold">${intrinsicValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between max-w-md mx-auto">
            <span className="text-muted-foreground">Margin of Safety:</span>
            <span className="font-semibold">
              {marginOfSafety >= 0 ? "+" : ""}
              {marginOfSafety.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
