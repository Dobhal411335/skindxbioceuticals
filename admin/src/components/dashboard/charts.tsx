"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatePoint, NamedCount } from "@/types/dashboard";

const COLORS = ["#287F79", "#1D3B68", "#7B4AA5", "#247547", "#946200", "#626A73"];

function ChartShell({
  title,
  description,
  children,
  empty,
  testId,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  empty?: boolean;
  testId?: string;
}) {
  return (
    <Card className="shadow-(--shadow-card)" data-testid={testId}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="h-72">
        {empty ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            No data for this date range.
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function RevenueAreaChart({ data }: { data: DatePoint[] }) {
  return (
    <ChartShell title="Revenue over time" description="Excludes cancelled orders" empty={data.length === 0} testId="chart-revenue">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#287F79" fill="#287F7933" name="Revenue" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function OrdersLineChart({ data }: { data: DatePoint[] }) {
  return (
    <ChartShell title="Order activity" empty={data.length === 0} testId="chart-orders-activity">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#1D3B68" strokeWidth={2} name="Orders" />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function StatusDonutChart({ data, title }: { data: NamedCount[]; title: string }) {
  return (
    <ChartShell title={title} empty={data.length === 0} testId="chart-status">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={55} outerRadius={90}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function HorizontalBarChart({ data, title }: { data: NamedCount[]; title: string }) {
  return (
    <ChartShell title={title} empty={data.length === 0} testId="chart-bestsellers">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EB" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#287F79" name="Units" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function EnquiryLineChart({ data }: { data: DatePoint[] }) {
  return (
    <ChartShell title="Enquiries over time" empty={data.length === 0} testId="chart-enquiries">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E4E7EB" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#287F79" strokeWidth={2} name="Enquiries" />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
