export interface Stock {
  ticker: string;
  name: string;
  industry: string;
  price: number;
  intrinsicValue: number;
  buffettScore: number;
  marketCap: string;
  recommendation: "BUY" | "HOLD" | "SELL";
}

export interface BuffettScoreBreakdown {
  moat: number;
  financialStrength: number;
  managementQuality: number;
  intrinsicValueRating: number;
}

export interface FinancialMetrics {
  roic: number;
  roe: number;
  grossMargin: number;
  operatingMargin: number;
  debtToEquity: number;
  freeCashFlow: number;
  interestCoverage: number;
}

export interface BuffettCriteria {
  consistentEarnings: boolean;
  lowDebt: boolean;
  competitiveAdvantage: boolean;
  competentManagement: boolean;
  buyingAtDiscount: boolean;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}
