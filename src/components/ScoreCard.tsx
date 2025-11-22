import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ScoreCardProps {
  title: string;
  score: number;
  maxScore: number;
  description?: string;
  metrics?: { label: string; value: string | number }[];
}

export const ScoreCard = ({ title, score, maxScore, description, metrics }: ScoreCardProps) => {
  const percentage = (score / maxScore) * 100;
  const getScoreColor = () => {
    if (percentage >= 80) return "text-success border-success/20 bg-success/5";
    if (percentage >= 60) return "text-warning border-warning/20 bg-warning/5";
    return "text-destructive border-destructive/20 bg-destructive/5";
  };

  return (
    <Card className={cn("p-6 border-2", getScoreColor())}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <div className="text-3xl font-bold">
            {score}/{maxScore}
          </div>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {metrics && (
          <div className="space-y-2 pt-2 border-t">
            {metrics.map((metric, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className="font-medium">{metric.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
