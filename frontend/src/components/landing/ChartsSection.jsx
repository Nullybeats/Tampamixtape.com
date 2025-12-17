import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import {
  TrendingUp,
  Activity,
  Clock,
  ArrowUpRight,
  Zap
} from 'lucide-react'

const chartData = [
  { date: 'Mon', streams: 45000, listeners: 12000 },
  { date: 'Tue', streams: 52000, listeners: 14500 },
  { date: 'Wed', streams: 48000, listeners: 13200 },
  { date: 'Thu', streams: 61000, listeners: 16800 },
  { date: 'Fri', streams: 78000, listeners: 21000 },
  { date: 'Sat', streams: 95000, listeners: 28500 },
  { date: 'Sun', streams: 88000, listeners: 25200 },
]

const realtimeData = [
  { time: '12:00', streams: 1200 },
  { time: '12:05', streams: 1350 },
  { time: '12:10', streams: 1180 },
  { time: '12:15', streams: 1420 },
  { time: '12:20', streams: 1580 },
  { time: '12:25', streams: 1650 },
  { time: '12:30', streams: 1720 },
  { time: '12:35', streams: 1890 },
]

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg px-3 py-2">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-primary">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ChartsSection() {
  const features = [
    {
      icon: Activity,
      title: 'Real-Time Updates',
      description: 'Stream counts update every 5 minutes with data from all major platforms.'
    },
    {
      icon: Clock,
      title: 'Historical Data',
      description: 'Access years of historical chart data and trend analysis.'
    },
    {
      icon: TrendingUp,
      title: 'Predictive Analytics',
      description: 'AI-powered predictions for chart movements and viral potential.'
    },
    {
      icon: Zap,
      title: 'Instant Alerts',
      description: 'Get notified when artists hit milestones or chart positions change.'
    },
  ]

  return (
    <section id="charts" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Activity className="w-4 h-4 mr-1" />
            Live Analytics
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Real-Time <span className="text-gradient">Accurate Data</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch the numbers move as Tampa artists gain streams, listeners, and chart positions in real-time.
          </p>
        </motion.div>

        {/* Charts Preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden glow-green-sm">
            <CardHeader className="border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Streaming Data
                </CardTitle>
                <Badge variant="success" className="gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +23.5% today
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="weekly" className="w-full">
                <div className="px-6 pt-4">
                  <TabsList>
                    <TabsTrigger value="realtime">Real-Time</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="realtime" className="mt-0">
                  <div className="h-80 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={realtimeData}>
                        <defs>
                          <linearGradient id="streamGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="time" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="streams"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fill="url(#streamGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="weekly" className="mt-0">
                  <div className="h-80 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="streams"
                          stroke="#22c55e"
                          strokeWidth={2}
                          dot={{ fill: '#22c55e', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#22c55e' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="listeners"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: '#3b82f6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="monthly" className="mt-0">
                  <div className="h-80 p-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="monthlyGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                        <YAxis stroke="#71717a" fontSize={12} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="streams"
                          stroke="#22c55e"
                          strokeWidth={2}
                          fill="url(#monthlyGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full hover:glow-green-sm transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
