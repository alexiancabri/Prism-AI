import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card } from "@/components/ui/card";

interface PriceChartProps {
  data: { date: string; price: number }[];
  intrinsicValue: number;
}

export const PriceChart = ({ data, intrinsicValue }: PriceChartProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-4">Price History (12 Months)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="date" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
          />
          <ReferenceLine 
            y={intrinsicValue} 
            stroke="hsl(var(--success))" 
            strokeDasharray="5 5"
            label={{ value: "Intrinsic Value", position: "right", fill: "hsl(var(--success))" }}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
