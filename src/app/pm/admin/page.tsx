'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box, Flex, Grid, Heading, Spinner, Text, VStack,
  Button, ButtonGroup,
} from '@chakra-ui/react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { SummaryBar, Summary } from '../../../components/pm/SummaryBar';
import { isDemoMode, demoFetch } from '../../../lib/demoApi';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
);

// ── Types ─────────────────────────────────────────────────────────────────────
interface DayMetric {
  date: string;
  active_users: number;
  api_calls: number;
  avg_latency_ms: number;
  error_rate_pct: number;
  tickets_opened: number;
  tickets_closed: number;
}

interface MetricsSummary {
  active_users: number;
  api_calls: number;
  avg_latency_ms: number;
  error_rate_pct: number;
}

interface MetricsData {
  range: number;
  summary: MetricsSummary;
  daily: DayMetric[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PM_API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8100';

const CHART_BASE = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: '#9CA3AF', font: { size: 11 }, boxWidth: 12 },
    },
    tooltip: {
      backgroundColor: '#111827',
      borderColor: '#374151',
      borderWidth: 1,
      titleColor: '#F9FAFB',
      bodyColor: '#D1D5DB',
    },
  },
  scales: {
    x: {
      ticks: { color: '#6B7280', font: { size: 10 } },
      grid:  { color: 'rgba(75,85,99,0.2)' },
    },
    y: {
      ticks:       { color: '#6B7280', font: { size: 10 } },
      grid:        { color: 'rgba(75,85,99,0.2)' },
      beginAtZero: true,
    },
  },
};

// ── Demo seed ─────────────────────────────────────────────────────────────────
function buildDemoMetrics(range: number): MetricsData {
  const days: DayMetric[] = [];
  const base = Date.now();
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(base - i * 86400000).toISOString().slice(0, 10);
    const opened = Math.floor(Math.random() * 5) + 1;
    const closed  = Math.floor(Math.random() * 4);
    days.push({
      date: d,
      active_users:   Math.floor(Math.random() * 3) + 2,
      api_calls:      Math.floor(Math.random() * 40) + 10,
      avg_latency_ms: Math.floor(Math.random() * 120) + 80,
      error_rate_pct: parseFloat((Math.random() * 8).toFixed(1)),
      tickets_opened: opened,
      tickets_closed: closed,
    });
  }
  return {
    range,
    summary: {
      active_users:   4,
      api_calls:      days.reduce((s, d) => s + d.api_calls, 0),
      avg_latency_ms: 143.2,
      error_rate_pct: 12.5,
    },
    daily: days,
  };
}

// ── Subcomponents ─────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, color }: {
  label: string; value: string | number; unit?: string; color?: string;
}) {
  return (
    <Box bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="lg" p={{ base: 4, md: 5 }}>
      <Text fontSize="sm" color="gray.400" fontFamily="mono" mb={2}>{label}</Text>
      <Flex align="baseline" gap={1}>
        <Text fontSize="2xl" fontWeight="bold" color={color || 'white'} lineHeight={1}>
          {value}
        </Text>
        {unit && <Text fontSize="xs" color="gray.500" ml={1}>{unit}</Text>}
      </Flex>
    </Box>
  );
}

function ChartCard({ title, children, h = '200px' }: {
  title: string; children: React.ReactNode; h?: string;
}) {
  return (
    <Box bg="gray.900" border="1px solid" borderColor="gray.700" borderRadius="lg" p={{ base: 4, md: 6 }}>
      <Text fontSize="xs" fontWeight="bold" color="gray.400" fontFamily="mono"
        mb={4} letterSpacing="wider">
        {title}
      </Text>
      <Box h={h} position="relative">{children}</Box>
    </Box>
  );
}

function fmtDate(d: string): string {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [range, setRange]     = useState<7 | 30 | 90>(7);
  const [data,  setData]      = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]    = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    const fn = isDemoMode() ? demoFetch : fetch;
    fn(`${PM_API}/api/summary`)
      .then((r: Response) => r.json())
      .then((d: Summary) => setSummary(d))
      .catch(() => {});
  }, []);

  const fetchMetrics = useCallback((r: number) => {
    setLoading(true);
    setError(null);
    if (isDemoMode()) {
      setTimeout(() => { setData(buildDemoMetrics(r)); setLoading(false); }, 300);
      return;
    }
    fetch(`${PM_API}/api/admin/metrics?range=${r}`)
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
      .then((d: MetricsData) => { setData(d); setLoading(false); })
      .catch(e => { setError((e as Error).message); setLoading(false); });
  }, []);

  useEffect(() => { fetchMetrics(range); }, [range, fetchMetrics]);

  const labels = (data?.daily || []).map(d => fmtDate(d.date));

  const activeUsersChart = {
    labels,
    datasets: [{
      label: 'Active Users',
      data:            (data?.daily || []).map(d => d.active_users),
      borderColor:     '#60A5FA',
      backgroundColor: 'rgba(96,165,250,0.08)',
      tension: 0.3, fill: true, pointRadius: 3,
    }],
  };

  const ticketFlowChart = {
    labels,
    datasets: [
      {
        label:           'Opened',
        data:            (data?.daily || []).map(d => d.tickets_opened),
        backgroundColor: 'rgba(251,146,60,0.7)',
        borderRadius:    3,
      },
      {
        label:           'Closed',
        data:            (data?.daily || []).map(d => d.tickets_closed),
        backgroundColor: 'rgba(52,211,153,0.7)',
        borderRadius:    3,
      },
    ],
  };

  const stabilityChart = {
    labels,
    datasets: [
      {
        label:           'Avg Latency (ms)',
        data:            (data?.daily || []).map(d => d.avg_latency_ms),
        borderColor:     '#A78BFA',
        backgroundColor: 'rgba(167,139,250,0.08)',
        tension: 0.3, fill: true, pointRadius: 3,
        yAxisID: 'y',
      },
      {
        label:           'Error Rate %',
        data:            (data?.daily || []).map(d => d.error_rate_pct),
        borderColor:     '#F87171',
        backgroundColor: 'rgba(248,113,113,0.06)',
        tension: 0.3, fill: true, pointRadius: 3,
        yAxisID: 'y1',
      },
    ],
  };

  const stabilityOpts = {
    ...CHART_BASE,
    scales: {
      ...CHART_BASE.scales,
      y:  { ...CHART_BASE.scales.y, position: 'left'  as const,
            title: { display: true, text: 'ms', color: '#6B7280', font: { size: 10 } } },
      y1: { ...CHART_BASE.scales.y, position: 'right' as const,
            grid: { drawOnChartArea: false },
            title: { display: true, text: '%',  color: '#6B7280', font: { size: 10 } } },
    },
  };

  return (
    <Flex direction="column" minH="100dvh" bg="gray.950" overflowX="hidden">
      <SummaryBar summary={summary} loading={false} />

      <Box maxW="1600px" w="full" mx="auto" px={{ base: 4, md: 6 }} py={6}>

        {/* Header */}
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={3} mb={6}>
          <Heading size="lg" color="white" fontFamily="mono" fontWeight="black">
            System Vitality
          </Heading>
          <ButtonGroup size="sm" isAttached variant="outline">
            {([7, 30, 90] as const).map(r => (
              <Button
                key={r}
                onClick={() => setRange(r)}
                borderColor="gray.600"
                color={range === r ? 'white' : 'gray.400'}
                bg={range === r ? 'gray.700' : 'transparent'}
                _hover={{ bg: 'gray.700', color: 'white' }}
                fontFamily="mono" fontSize="xs"
              >
                {r}d
              </Button>
            ))}
          </ButtonGroup>
        </Flex>

        {/* Loading */}
        {loading && (
          <Flex justify="center" align="center" h="200px">
            <Spinner size="lg" color="blue.400" />
          </Flex>
        )}

        {/* Error */}
        {!loading && error && (
          <Box bg="gray.900" border="1px solid" borderColor="red.800"
            borderRadius="lg" p={6} textAlign="center">
            <Text color="red.400" fontSize="sm" fontFamily="mono">
              Unable to load metrics — {error}
            </Text>
          </Box>
        )}

        {/* Data */}
        {!loading && !error && data && (
          <VStack align="stretch" spacing={8}>

            {/* Summary cards */}
            <Grid
              templateColumns={{ base: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }}
              gap={4}
            >
              <MetricCard label="ACTIVE USERS"  value={data.summary.active_users}    color="blue.300" />
              <MetricCard label="API CALLS"     value={data.summary.api_calls}        color="purple.300" />
              <MetricCard label="AVG LATENCY"   value={data.summary.avg_latency_ms}   unit="ms" color="teal.300" />
              <MetricCard label="ERROR RATE"    value={data.summary.error_rate_pct}   unit="%"
                color={data.summary.error_rate_pct > 20 ? 'red.400' : 'green.300'} />
            </Grid>

            {/* Charts */}
            <VStack align="stretch" spacing={5}>
              <ChartCard title="ACTIVE USERS" h="200px">
                <Line data={activeUsersChart} options={CHART_BASE as any} />
              </ChartCard>

              <ChartCard title="TICKET FLOW — OPENED VS CLOSED" h="200px">
                <Bar data={ticketFlowChart} options={CHART_BASE as any} />
              </ChartCard>

              <ChartCard title="STABILITY — AVG LATENCY + ERROR RATE" h="220px">
                <Line data={stabilityChart} options={stabilityOpts as any} />
              </ChartCard>
            </VStack>

            <Text fontSize="xs" color="gray.600" fontFamily="mono" textAlign="right">
              {range}-day window · {data.daily.length} data points
            </Text>

          </VStack>
        )}

        {/* Empty state */}
        {!loading && !error && data && data.daily.length === 0 && (
          <Box bg="gray.900" border="1px solid" borderColor="gray.700"
            borderRadius="lg" p={8} textAlign="center">
            <Text color="gray.500" fontSize="sm" fontFamily="mono">
              No data available for this range.
            </Text>
          </Box>
        )}

      </Box>
    </Flex>
  );
}
