import { Check, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BuffettCriteria } from "@/types/stock";

interface BuffettCriteriaChecklistProps {
  criteria: BuffettCriteria;
}

export const BuffettCriteriaChecklist = ({ criteria }: BuffettCriteriaChecklistProps) => {
  const items = [
    {
      label: "Consistent Earnings History",
      value: criteria.consistentEarnings,
      description: "Company shows stable and predictable earnings over time",
    },
    {
      label: "Low Debt Levels",
      value: criteria.lowDebt,
      description: "Manageable debt levels relative to equity and earnings",
    },
    {
      label: "Durable Competitive Advantage",
      value: criteria.competitiveAdvantage,
      description: "Strong moat protecting business from competitors",
    },
    {
      label: "Competent Management",
      value: criteria.competentManagement,
      description: "Track record of strong returns and shareholder-friendly decisions",
    },
    {
      label: "Buying at a Discount",
      value: criteria.buyingAtDiscount,
      description: "Trading below calculated intrinsic value",
    },
  ];

  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-6">Buffett Investment Criteria</h3>
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-start gap-3 p-4 rounded-lg border bg-muted/30">
            <div
              className={`mt-0.5 flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                item.value ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"
              }`}
            >
              {item.value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </div>
            <div>
              <h4 className="font-semibold mb-1">{item.label}</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
