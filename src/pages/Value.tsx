import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  ArrowRight,
  Clock,
  TrendingUp,
  Banknote,
  Zap,
  Check,
  X,
  Search,
  CalendarClock,
} from "lucide-react";
import { Nav } from "@/components/prism/Nav";
import { Footer } from "@/components/prism/Footer";
import { Slider } from "@/components/ui/slider";

/* ---------- formatting helpers ---------- */
const usd0 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const fmtMoney = (n: number) => usd0.format(Math.round(n));
const fmtNum = (n: number) => num0.format(Math.round(n));

const SLATE = "hsl(215, 25%, 55%)";
const BRAND = "hsl(221, 83%, 53%)";
const CYAN = "hsl(190, 85%, 41%)";

/* Prism recovers ~90% of time otherwise lost to searching. */
const RECOVERY = 0.9;
const PRISM_SEAT_MONTHLY = 39;
const WORK_HOURS_YEAR = 2080;

const Value = () => {
  const navigate = useNavigate();

  // Calculator inputs
  const [employees, setEmployees] = useState(50);
  const [salary, setSalary] = useState(85000);
  const [hoursPerWeek, setHoursPerWeek] = useState(5);

  const calc = useMemo(() => {
    const hourlyCost = salary / WORK_HOURS_YEAR;
    const withPrismHours = hoursPerWeek * (1 - RECOVERY);
    const recoveredPerEmpWeek = hoursPerWeek * RECOVERY;

    const annualHoursLostBefore = hoursPerWeek * 52 * employees;
    const annualHoursRecovered = recoveredPerEmpWeek * 52 * employees;

    const costBefore = annualHoursLostBefore * hourlyCost;
    const costAfter = withPrismHours * 52 * employees * hourlyCost;
    const moneyRecovered = costBefore - costAfter;

    const prismAnnualCost = employees * PRISM_SEAT_MONTHLY * 12;
    const netSavings = moneyRecovered - prismAnnualCost;
    const roiMultiple = moneyRecovered / prismAnnualCost;
    const paybackMonths = prismAnnualCost / (moneyRecovered / 12);

    return {
      hourlyCost,
      withPrismHours,
      annualHoursRecovered,
      costBefore,
      costAfter,
      moneyRecovered,
      prismAnnualCost,
      netSavings,
      roiMultiple,
      paybackMonths,
    };
  }, [employees, salary, hoursPerWeek]);

  const hoursData = [
    { name: "Without Prism", value: hoursPerWeek, fill: SLATE },
    { name: "With Prism", value: calc.withPrismHours, fill: BRAND },
  ];

  const costData = [
    { name: "Without Prism", value: calc.costBefore, fill: SLATE },
    { name: "With Prism", value: calc.costAfter + calc.prismAnnualCost, fill: BRAND },
  ];

  const cumulativeData = useMemo(() => {
    const monthlyNet = calc.netSavings / 12;
    return Array.from({ length: 12 }, (_, i) => ({
      month: `M${i + 1}`,
      saved: Math.round(monthlyNet * (i + 1)),
    }));
  }, [calc.netSavings]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-32 left-1/2 h-[440px] w-[820px] -translate-x-1/2 rounded-full bg-spectrum-1/[0.06] blur-[120px]" />
        <div className="absolute inset-0 bg-grid" />
      </div>

      <Nav />

      <main className="relative z-10">
        {/* ===================== HERO ===================== */}
        <section className="container pt-36 pb-12 text-center md:pt-44">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3.5 py-1.5 text-xs font-medium text-muted-foreground animate-fade-in">
            <TrendingUp className="h-3.5 w-3.5 text-spectrum-1" />
            The business case
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl font-display text-5xl font-semibold leading-[1.05] tracking-tight text-foreground animate-slide-up sm:text-6xl">
            Stop paying people to <span className="text-spectrum">search.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground animate-slide-up delay-100">
            Knowledge workers lose nearly a full day every week just hunting for
            information that already exists. Prism gives that day back — and turns
            it into measurable productivity and money recovered.
          </p>
          <div className="mt-9 flex justify-center animate-slide-up delay-200">
            <a
              href="#calculator"
              className="group inline-flex items-center gap-2 rounded-xl bg-spectrum-gradient bg-[length:200%_auto] px-6 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-[position:100%] hover:shadow-md"
            >
              Calculate your savings
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </section>

        {/* ===================== STAT BAND ===================== */}
        <section className="container pb-8">
          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock, v: "9.3 hrs", l: "spent searching for information, per employee, every week", c: "spectrum-1" },
              { icon: Search, v: "1 in 5", l: "working hours lost to finding internal information", c: "spectrum-2" },
              { icon: Banknote, v: "$14,000", l: "annual cost of wasted search time, per knowledge worker", c: "spectrum-3" },
              { icon: Zap, v: "90%", l: "of that time recovered with instant, cited answers", c: "spectrum-4" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.l} className="bg-card p-7">
                  <Icon className="h-5 w-5" style={{ color: `hsl(var(--${s.c}))` }} />
                  <p className="mt-4 font-display text-4xl font-semibold text-foreground">{s.v}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.l}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sources: McKinsey Global Institute (time spent searching & gathering
            information); IDC knowledge-worker productivity research. Figures
            illustrative.
          </p>
        </section>

        {/* ===================== PROBLEM CHART ===================== */}
        <section className="container scroll-mt-24 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-spectrum-1">
              The hidden cost
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              A day a week, gone to searching
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              The same question, answered two ways. Prism collapses minutes of
              hunting into a single cited answer.
            </p>
          </div>

          <div className="mt-12 grid items-center gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 card-shadow">
              <p className="text-sm font-medium text-foreground">
                Hours per employee, per week, finding information
              </p>
              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hoursData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} unit="h" />
                    <Tooltip content={<HoursTooltip />} cursor={{ fill: "hsl(var(--secondary))" }} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={90}>
                      {hoursData.map((d, i) => (
                        <Cell key={i} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  t: "Without Prism",
                  d: "Employees ping colleagues, scroll endless folders, and re-read whole documents to find one clause. Context is lost; the same answer gets re-discovered again and again.",
                  bad: true,
                },
                {
                  t: "With Prism",
                  d: "One question, one cited answer, in under a second — drawn from the entire library and traceable to the exact page. The work happens instead of the searching.",
                  bad: false,
                },
              ].map((row) => (
                <div
                  key={row.t}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-5"
                >
                  <div
                    className={
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " +
                      (row.bad ? "bg-destructive/10 text-destructive" : "bg-spectrum-1/10 text-spectrum-1")
                    }
                  >
                    {row.bad ? <X className="h-5 w-5" /> : <Check className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-display text-lg font-semibold text-foreground">{row.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{row.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===================== CALCULATOR ===================== */}
        <section id="calculator" className="container scroll-mt-24 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-spectrum-1">
              ROI calculator
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              See what Prism wins back
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Adjust the numbers to match your team. Everything updates live.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            {/* Inputs */}
            <div className="rounded-3xl border border-border bg-card p-7 card-shadow">
              <SliderRow
                label="Employees"
                value={`${fmtNum(employees)}`}
                min={5}
                max={1000}
                step={5}
                val={employees}
                onChange={setEmployees}
              />
              <SliderRow
                label="Average salary"
                value={fmtMoney(salary)}
                min={40000}
                max={250000}
                step={5000}
                val={salary}
                onChange={setSalary}
              />
              <SliderRow
                label="Hours/week each spends searching"
                value={`${hoursPerWeek} hrs`}
                min={1}
                max={15}
                step={0.5}
                val={hoursPerWeek}
                onChange={setHoursPerWeek}
                last
              />

              <div className="mt-6 rounded-2xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                Assumes Prism eliminates <span className="font-medium text-foreground">{Math.round(RECOVERY * 100)}%</span> of
                search time and a Team plan at{" "}
                <span className="font-medium text-foreground">${PRISM_SEAT_MONTHLY}/seat/mo</span>.
              </div>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <KpiCard
                  icon={Clock}
                  label="Hours recovered / year"
                  value={fmtNum(calc.annualHoursRecovered)}
                  accent="spectrum-1"
                />
                <KpiCard
                  icon={Banknote}
                  label="Net savings / year"
                  value={fmtMoney(calc.netSavings)}
                  accent="spectrum-3"
                  highlight
                />
                <KpiCard
                  icon={CalendarClock}
                  label="Payback period"
                  value={
                    calc.paybackMonths < 1
                      ? "<1 mo"
                      : `${calc.paybackMonths.toFixed(1)} mo`
                  }
                  accent="spectrum-4"
                />
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 card-shadow">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Annual cost of search time
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Prism returns{" "}
                    <span className="font-semibold text-spectrum-1">
                      {calc.roiMultiple.toFixed(1)}×
                    </span>{" "}
                    its cost
                  </p>
                </div>
                <div className="mt-5 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={costData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={96} />
                      <Tooltip content={<MoneyTooltip />} cursor={{ fill: "hsl(var(--secondary))" }} />
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={48}>
                        {costData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6 card-shadow">
                <p className="text-sm font-medium text-foreground">
                  Cumulative net savings — first 12 months
                </p>
                <div className="mt-5 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cumulativeData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="saveFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={BRAND} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
                      <Tooltip content={<MoneyTooltip />} cursor={{ stroke: "hsl(var(--border))" }} />
                      <Area type="monotone" dataKey="saved" stroke={BRAND} strokeWidth={2.5} fill="url(#saveFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== COMPARISON TABLE ===================== */}
        <section className="container py-16">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card card-shadow">
            <div className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border bg-secondary/40 text-sm font-semibold text-foreground">
              <div className="p-4">Metric</div>
              <div className="p-4 text-center text-muted-foreground">Without Prism</div>
              <div className="flex items-center justify-center gap-1.5 p-4 text-center text-spectrum-1">
                With Prism
              </div>
            </div>
            {[
              ["Time to find one answer", "6–20 min", "< 1 second"],
              ["Source of truth", "Scattered across files & people", "One queryable library"],
              ["Answer reliability", "Best guess, often re-asked", "Cited to the exact page"],
              ["Onboarding new hires", "Weeks of tribal knowledge", "Ask and learn instantly"],
              ["Cost of search (per 50 staff)", "≈ $700k / year", "≈ $70k / year recovered cost"],
            ].map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-[1.4fr_1fr_1fr] border-b border-border text-sm last:border-0"
              >
                <div className="p-4 font-medium text-foreground">{row[0]}</div>
                <div className="flex items-center justify-center gap-1.5 p-4 text-center text-muted-foreground">
                  <X className="h-4 w-4 shrink-0 text-destructive/70" />
                  {row[1]}
                </div>
                <div className="flex items-center justify-center gap-1.5 p-4 text-center font-medium text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-success" />
                  {row[2]}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== CTA ===================== */}
        <section className="container py-16">
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card px-8 py-16 text-center card-shadow">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-dots opacity-60" />
              <div className="absolute left-1/2 top-0 h-72 w-[700px] -translate-x-1/2 rounded-full bg-spectrum-1/[0.07] blur-[120px]" />
            </div>
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                The day you get back <span className="text-spectrum">pays for itself.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
                Put your team's hours back where they belong. See it work on your
                own questions in the live demo.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={() => navigate("/app")}
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-spectrum-gradient bg-[length:200%_auto] px-7 py-4 font-semibold text-white shadow-sm transition-all hover:bg-[position:100%] hover:shadow-md"
                >
                  Try the live demo
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/30 px-7 py-4 font-semibold text-foreground transition-colors hover:bg-secondary/60"
                >
                  Back to overview
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

/* ---------- sub-components ---------- */
function SliderRow({
  label,
  value,
  min,
  max,
  step,
  val,
  onChange,
  last,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  val: number;
  onChange: (v: number) => void;
  last?: boolean;
}) {
  return (
    <div className={last ? "" : "mb-7"}>
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="font-display text-lg font-semibold text-spectrum-1">{value}</span>
      </div>
      <Slider
        className="mt-3"
        min={min}
        max={max}
        step={step}
        value={[val]}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
  highlight,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  accent: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        "rounded-2xl border p-5 " +
        (highlight ? "border-spectrum bg-card glow-violet" : "border-border bg-card card-shadow")
      }
    >
      <Icon className="h-5 w-5" style={{ color: `hsl(var(--${accent}))` }} />
      <p className="mt-3 font-display text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{label}</p>
    </div>
  );
}

function HoursTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground">{payload[0].value} hrs / week</p>
    </div>
  );
}

function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-foreground">{label ?? payload[0].payload.name}</p>
      <p className="text-muted-foreground">{fmtMoney(payload[0].value)}</p>
    </div>
  );
}

export default Value;
