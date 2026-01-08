import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { 
  format, 
  parseISO, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  subWeeks,
  isWithinInterval,
  startOfMonth,
  endOfMonth
} from 'date-fns';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp,
  CheckCircle2,
  Target,
  Calendar,
  Clock,
  Award
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import PageHeader from '@/components/common/PageHeader';
import StatCard from '@/components/common/StatCard';
import { cn } from '@/lib/utils';

const COLORS = ['#1e3a5f', '#c9a962', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function ProgressPage() {
  const [timeRange, setTimeRange] = useState('week');

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.Event.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: async () => {
      const list = await base44.entities.PlannerSettings.list();
      return list[0] || {};
    },
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';
  const accentColor = settings?.accent_color || '#c9a962';

  const now = new Date();
  const getDateRange = () => {
    if (timeRange === 'week') {
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    } else if (timeRange === 'month') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
    return { start: subWeeks(now, 4), end: now };
  };

  const dateRange = getDateRange();

  // Task Statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Tasks by priority
  const tasksByPriority = [
    { name: 'Urgent & Important', value: tasks.filter(t => t.priority === 'urgent-important').length },
    { name: 'Important', value: tasks.filter(t => t.priority === 'important').length },
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length },
    { name: 'Normal', value: tasks.filter(t => t.priority === 'normal').length }
  ];

  // Goals Statistics
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const avgGoalProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length)
    : 0;

  // Goals by category
  const goalsByCategory = [
    { name: 'Personal', value: goals.filter(g => g.category === 'personal').length },
    { name: 'Professional', value: goals.filter(g => g.category === 'professional').length },
    { name: 'Project', value: goals.filter(g => g.category === 'project').length }
  ];

  // Weekly task completion data
  const getWeeklyData = () => {
    const days = eachDayOfInterval({ 
      start: startOfWeek(now, { weekStartsOn: 1 }), 
      end: endOfWeek(now, { weekStartsOn: 1 }) 
    });

    return days.map(day => {
      const dayTasks = tasks.filter(t => {
        if (!t.updated_at) return false;
        const taskDate = parseISO(t.updated_at);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });

      const completed = dayTasks.filter(t => t.status === 'completed').length;
      const created = tasks.filter(t => {
        if (!t.created_at) return false;
        const taskDate = parseISO(t.created_at);
        return format(taskDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      }).length;

      return {
        day: format(day, 'EEE'),
        completed,
        created
      };
    });
  };

  const weeklyData = getWeeklyData();

  // Productivity score (simple calculation)
  const productivityScore = Math.min(100, Math.round(
    (completionRate * 0.4) + 
    (avgGoalProgress * 0.4) + 
    (Math.min(completedTasks, 20) * 1)
  ));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Progress & Analytics"
        subtitle="Track your productivity and achievements"
        icon={BarChart3}
        actions={
          <Tabs value={timeRange} onValueChange={setTimeRange}>
            <TabsList className="bg-stone-100">
              <TabsTrigger value="week">This Week</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Completion Rate"
          value={`${completionRate}%`}
          subtitle={`${completedTasks} of ${totalTasks} tasks`}
          icon={CheckCircle2}
          accentColor={accentColor}
        />
        <StatCard
          title="Goals Progress"
          value={`${avgGoalProgress}%`}
          subtitle={`${activeGoals.length} active goals`}
          icon={Target}
          accentColor={accentColor}
        />
        <StatCard
          title="Pending Tasks"
          value={pendingTasks}
          subtitle="Need attention"
          icon={Clock}
          accentColor={accentColor}
        />
        <StatCard
          title="Productivity Score"
          value={productivityScore}
          subtitle="Based on activity"
          icon={Award}
          accentColor={accentColor}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-stone-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-800">
                Weekly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                      }} 
                    />
                    <Bar dataKey="completed" fill={primaryColor} radius={[4, 4, 0, 0]} name="Completed" />
                    <Bar dataKey="created" fill={accentColor} radius={[4, 4, 0, 0]} name="Created" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tasks by Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-stone-100">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stone-800">
                Tasks by Priority
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tasksByPriority}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {tasksByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goals Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-stone-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-stone-800">
                Goals Progress
              </CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  Completed: {completedGoals}
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Active: {activeGoals.length}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-stone-500">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No active goals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-800">{goal.title}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          goal.category === 'personal' && "bg-violet-100 text-violet-700",
                          goal.category === 'professional' && "bg-blue-100 text-blue-700",
                          goal.category === 'project' && "bg-emerald-100 text-emerald-700"
                        )}>
                          {goal.category}
                        </span>
                      </div>
                      <span className="font-semibold text-stone-600">{goal.progress || 0}%</span>
                    </div>
                    <Progress value={goal.progress || 0} className="h-2" />
                    {goal.target_date && (
                      <p className="text-xs text-stone-500">
                        Target: {format(parseISO(goal.target_date), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-stone-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <CheckCircle2 className="w-6 h-6" style={{ color: primaryColor }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-800">{completedTasks}</p>
                  <p className="text-sm text-stone-500">Tasks Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-stone-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${accentColor}20` }}
                >
                  <Target className="w-6 h-6" style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-800">{completedGoals}</p>
                  <p className="text-sm text-stone-500">Goals Achieved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="border-stone-100">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-stone-800">{events.length}</p>
                  <p className="text-sm text-stone-500">Events Scheduled</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}