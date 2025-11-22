import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Award, Shield, TrendingUp } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12 space-y-12">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <h1 className="text-5xl font-bold">About Buffett Analyzer</h1>
          <p className="text-xl text-muted-foreground">
            Investment analysis powered by Warren Buffett's time-tested principles
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Value Investing</h3>
            <p className="text-sm text-muted-foreground">
              Focus on intrinsic value and long-term business fundamentals
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-6 w-6 text-success" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Margin of Safety</h3>
            <p className="text-sm text-muted-foreground">
              Buy quality businesses at prices below their true worth
            </p>
          </Card>
          
          <Card className="p-6 text-center">
            <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mx-auto mb-4">
              <Award className="h-6 w-6 text-warning" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Quality First</h3>
            <p className="text-sm text-muted-foreground">
              Prioritize companies with durable competitive advantages
            </p>
          </Card>
        </div>

        <Card className="p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">The Buffett Investment Philosophy</h2>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Warren Buffett's approach to investing is built on identifying exceptional businesses trading at
              reasonable prices. This analyzer evaluates stocks across four key dimensions:
            </p>
            
            <div className="space-y-3 pl-4">
              <div>
                <h4 className="font-semibold text-foreground mb-1">1. Economic Moat (25 points)</h4>
                <p>Companies with sustainable competitive advantages that protect their market position and pricing power.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-1">2. Financial Strength (25 points)</h4>
                <p>Strong balance sheets with manageable debt levels and consistent cash generation.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-1">3. Management Quality (25 points)</h4>
                <p>Competent leadership that allocates capital wisely and acts in shareholders' best interests.</p>
              </div>
              
              <div>
                <h4 className="font-semibold text-foreground mb-1">4. Intrinsic Value (25 points)</h4>
                <p>Opportunities to buy quality businesses at prices below their calculated intrinsic value.</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-8 max-w-4xl mx-auto bg-muted/50">
          <h2 className="text-2xl font-bold mb-4">Disclaimer</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This tool is for educational and informational purposes only. It does not constitute financial advice,
            investment recommendations, or an offer to buy or sell securities. Stock market investments carry risk,
            including the potential loss of principal. Past performance does not guarantee future results. Always
            conduct your own research and consider consulting with a qualified financial advisor before making
            investment decisions. The Buffett Score and analysis provided are based on publicly available data and
            proprietary algorithms that may not reflect all relevant factors for investment decisions.
          </p>
        </Card>
      </main>
    </div>
  );
};

export default About;
