import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { mockDailyStats, mockRevenueByRestaurant, mockRevenueDaily } from '@/data/mockData';
import { useAuth } from '@/hooks/useAuth';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
} as const;

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
}

export default function Reports() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    const totalRevenue = mockRevenueDaily.reduce((s, d) => s + d.revenue, 0);
    const avgDaily = Math.round(totalRevenue / mockRevenueDaily.length);

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Revenue overview across your restaurants</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Total revenue (7 days)</p>
            <p className="text-2xl font-serif text-foreground">{formatCurrency(totalRevenue)}</p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Avg daily revenue</p>
            <p className="text-2xl font-serif text-foreground">{formatCurrency(avgDaily)}</p>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Restaurants</p>
            <p className="text-2xl font-serif text-foreground">{mockRevenueByRestaurant.length}</p>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
            <h3 className="font-serif text-lg text-foreground mb-4">Revenue by restaurant (last 7 days)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mockRevenueByRestaurant} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis type="category" dataKey="restaurantName" width={100} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
            <h3 className="font-serif text-lg text-foreground mb-4">Daily revenue (all restaurants)</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mockRevenueDaily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    );
  }

  const avgUtilization = Math.round(mockDailyStats.reduce((s, d) => s + d.tableUtilization, 0) / mockDailyStats.length);
  const totalCovers = mockDailyStats.reduce((s, d) => s + d.totalCovers, 0);
  const totalNoShows = mockDailyStats.reduce((s, d) => s + d.noShows, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">7-day performance overview</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Covers', value: totalCovers },
          { label: 'Avg Utilization', value: `${avgUtilization}%` },
          { label: 'No-Shows', value: totalNoShows },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{stat.label}</p>
            <p className="text-3xl font-serif text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
          <h3 className="font-serif text-lg text-foreground mb-4">Table Utilization</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockDailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="tableUtilization" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible" className="glass-card rounded-xl p-5">
          <h3 className="font-serif text-lg text-foreground mb-4">Daily Covers</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={mockDailyStats}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="totalCovers" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
              <Line type="monotone" dataKey="reservations" stroke="hsl(var(--status-available))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-4">
        {['POS Integration', 'CRM Integration'].map((label) => (
          <div key={label} className="glass-card rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[120px]">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Coming soon — integration-ready architecture</p>
          </div>
        ))}
      </div>
    </div>
  );
}
