import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { ScoreCard } from "@/components/ScoreCard";
import { RecommendationBadge } from "@/components/RecommendationBadge";
import { PriceChart } from "@/components/PriceChart";
import { BuffettCriteriaChecklist } from "@/components/BuffettCriteriaChecklist";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getStockDetails } from "@/data/mockData";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const StockAnalysis = () => {
  const { ticker } = useParams<{ ticker: string }>();
  const stock = getStockDetails(ticker?.toUpperCase() || "AAPL");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <Link to="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        {/* Company Header */}
        <Card className="p-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{stock.name}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="text-2xl font-semibold text-primary">{stock.ticker}</span>
                  <span>•</span>
                  <span>{stock.industry}</span>
                  <span>•</span>
                  <span>Market Cap: {stock.marketCap}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Current Price</p>
              <p className="text-4xl font-bold">${stock.price.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Buffett Score Overview */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-transparent">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Buffett Score</h2>
              <p className="text-muted-foreground">Comprehensive quality assessment</p>
            </div>
            <div className="text-center">
              <div className="text-6xl font-bold text-primary mb-2">{stock.buffettScore}</div>
              <div className="text-sm text-muted-foreground">out of 100</div>
            </div>
          </div>
        </Card>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Score Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ScoreCard
              title="Economic Moat"
              score={stock.scoreBreakdown.moat}
              maxScore={25}
              description="Competitive advantage & pricing power"
              metrics={[
                { label: "ROIC", value: `${stock.metrics.roic}%` },
                { label: "Operating Margin", value: `${stock.metrics.operatingMargin}%` },
              ]}
            />
            <ScoreCard
              title="Financial Strength"
              score={stock.scoreBreakdown.financialStrength}
              maxScore={25}
              description="Balance sheet quality & stability"
              metrics={[
                { label: "Debt/Equity", value: stock.metrics.debtToEquity.toFixed(2) },
                { label: "Interest Coverage", value: `${stock.metrics.interestCoverage}x` },
              ]}
            />
            <ScoreCard
              title="Management Quality"
              score={stock.scoreBreakdown.managementQuality}
              maxScore={25}
              description="Capital allocation & execution"
              metrics={[
                { label: "ROE", value: `${stock.metrics.roe}%` },
                { label: "FCF (B)", value: `$${stock.metrics.freeCashFlow}` },
              ]}
            />
            <ScoreCard
              title="Intrinsic Value"
              score={stock.scoreBreakdown.intrinsicValueRating}
              maxScore={25}
              description="Price vs. true business value"
              metrics={[
                { label: "Fair Value", value: `$${stock.intrinsicValue.toFixed(2)}` },
                { label: "Current Price", value: `$${stock.price.toFixed(2)}` },
              ]}
            />
          </div>
        </div>

        {/* Recommendation */}
        <RecommendationBadge
          recommendation={stock.recommendation}
          price={stock.price}
          intrinsicValue={stock.intrinsicValue}
        />

        {/* Price Chart */}
        <PriceChart data={stock.priceHistory} intrinsicValue={stock.intrinsicValue} />

        {/* Financial Data Tabs */}
        <Card className="p-6">
          <Tabs defaultValue="ratios" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
              <TabsTrigger value="ratios">Key Ratios</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
              <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ratios" className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "ROIC", value: `${stock.metrics.roic}%` },
                  { label: "ROE", value: `${stock.metrics.roe}%` },
                  { label: "Gross Margin", value: `${stock.metrics.grossMargin}%` },
                  { label: "Operating Margin", value: `${stock.metrics.operatingMargin}%` },
                  { label: "Debt-to-Equity", value: stock.metrics.debtToEquity.toFixed(2) },
                  { label: "Free Cash Flow (B)", value: `$${stock.metrics.freeCashFlow}` },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between p-4 rounded-lg bg-muted/50">
                    <span className="font-medium">{item.label}</span>
                    <span className="font-bold text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="income" className="pt-4">
              <p className="text-muted-foreground">Income statement data will be displayed here.</p>
            </TabsContent>
            
            <TabsContent value="balance" className="pt-4">
              <p className="text-muted-foreground">Balance sheet data will be displayed here.</p>
            </TabsContent>
            
            <TabsContent value="cashflow" className="pt-4">
              <p className="text-muted-foreground">Cash flow statement data will be displayed here.</p>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Buffett Criteria */}
        <BuffettCriteriaChecklist criteria={stock.criteria} />
      </main>
    </div>
  );
};

export default StockAnalysis;
