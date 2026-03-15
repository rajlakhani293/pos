"use client"

import { useEffect, useMemo, useState } from "react";
import { sales } from "@/lib/api/sales";
import { Spinner } from "@/components/ui/spinner";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";

type DashboardStats = {
  total_sales_count: number;
  total_sales_amount: number | string;
  today_sales_count: number;
  today_sales_amount: number | string;
  today_collection: number | string;
  items_count: number;
  total_stock: number | string;
  total_returns_count?: number;
  total_returns_amount?: number | string;
};

type ChartPoint = {
  label: string;
  total: number | string;
  count?: number | string;
};

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const toNumber = (value: number | string | undefined | null) => Number(value || 0);

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export default function Page() {
  const [getDashboardStats] = sales.useGetDashboardStatsMutation();
  const [getDashboardCharts] = sales.useGetDashboardChartsMutation();
  const [getDashboardTopProducts] = sales.useGetDashboardTopProductsMutation();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("daily");
  const [loadingStats, setLoadingStats] = useState(false);
  const [loadingChart, setLoadingChart] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const result = await getDashboardStats({}).unwrap() as { data: DashboardStats };
        setStats(result?.data || null);
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, [getDashboardStats]);

  useEffect(() => {
    const loadChart = async () => {
      setLoadingChart(true);
      try {
        const result = await getDashboardCharts({ period }).unwrap() as { data?: { series?: ChartPoint[] } };
        setChartData(result?.data?.series || []);
      } finally {
        setLoadingChart(false);
      }
    };
    loadChart();
  }, [getDashboardCharts, period]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const result = await getDashboardTopProducts({ limit: 5 }).unwrap() as { data?: any[] };
        setTopProducts(result?.data || []);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [getDashboardTopProducts]);

  const chartSeries = useMemo(() => {
    return chartData.map((item) => ({
      date: item.label,
      sales: toNumber(item.total),
      totalAmount: toNumber(item.total),
      totalCount: toNumber(item.count),
    }));
  }, [chartData]);  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="@container/card col-span-12 xl:col-span-8">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardAction>
              <ToggleGroup
                type="single"
                value={period}
                onValueChange={(value) => value && setPeriod(value as any)}
                variant="outline"
                className="*:data-[slot=toggle-group-item]:px-4!"
              >
                <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
                <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
                <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
              </ToggleGroup>
            </CardAction>
          </CardHeader>
          <CardContent className="">
            {loadingChart ? (
              <div className="h-[250px] flex items-center justify-center"><Spinner /></div>
            ) : (
              <ChartContainer config={chartConfig} className="aspect-auto h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartSeries} key={period}>
                    <defs>
                      <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-sales)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-sales)" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => value}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={100}
                      tickFormatter={(value) => currency.format(Number(value))}
                    />
                    <ChartTooltip
                      cursor={true}
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => value}
                          indicator="dot"
                        />
                      }
                    />
                    <Area
                      dataKey="sales"
                      type="natural"
                      fill="url(#fillSales)"
                      stroke="var(--color-sales)"
                      stackId="a"
                      activeDot={{ r: 4 }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="@container/card col-span-12 xl:col-span-4">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Today and lifetime snapshot</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Total Sales</div>
              <div className="text-lg font-semibold">{currency.format(toNumber(stats?.total_sales_amount))}</div>
              <div className="text-xs text-muted-foreground">{stats?.total_sales_count || 0} invoices</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Today Sales</div>
              <div className="text-lg font-semibold">{currency.format(toNumber(stats?.today_sales_amount))}</div>
              <div className="text-xs text-muted-foreground">{stats?.today_sales_count || 0} invoices</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Today Collection</div>
              <div className="text-lg font-semibold">{currency.format(toNumber(stats?.today_collection))}</div>
              <div className="text-xs text-muted-foreground">Paid amount</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">Returns</div>
              <div className="text-lg font-semibold">{currency.format(toNumber(stats?.total_returns_amount))}</div>
              <div className="text-xs text-muted-foreground">{stats?.total_returns_count || 0} returns</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="@container/card col-span-12 xl:col-span-8">
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="h-40 flex items-center justify-center"><Spinner /></div>
            ) : topProducts.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Product</TableHead>
                    <TableHead className="text-right">Total Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((item) => (
                    <TableRow key={item.item_id}>
                      <TableCell>{item.item__item_name}</TableCell>
                      <TableCell className="text-right">{toNumber(item.total_sold).toFixed(2)}</TableCell>
                      <TableCell className="text-right">{currency.format(toNumber(item.total_revenue))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-sm text-muted-foreground">No sales data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {loadingStats && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Loading stats...
        </div>
      )}
    </div>
  );
}
