import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { format, isToday, isTomorrow, startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Calendar, 
  Target, 
  CheckSquare, 
  TrendingUp,
  Clock,
  ChevronRight,
  Zap,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import StatCard from '@/components/common/StatCard';

const priorityConfig = {
  'urgent-important': { label: 'Urgent', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  'important': { label: 'Important', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  'urgent': { label: 'Urgent', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'normal': { label: 'Normal', color: 'bg-stone-100 text-stone-600 border-stone-200' }
};

export default function Dashboard() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

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

  // Calculate stats
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeGoals = goals.filter(g => g.status !== 'completed');
  const avgGoalProgress = activeGoals.length > 0 
    ? Math.round(activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / activeGoals.length)
    : 0;

  const todayTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    return isToday(parseISO(t.due_date)) && t.status !== 'completed';
  });

  const todayEvents = events.filter(e => {
    if (!e.date) return false;
    return isToday(parseISO(e.date));
  });

  const upcomingEvents = events
    .filter(e => {
      if (!e.date) return false;
      const eventDate = parseISO(e.date);
      return eventDate >= today && eventDate <= weekEnd;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-stone-800 to-stone-900 rounded-3xl p-8 text-white"
      >
        <p className="text-stone-400 text-sm font-medium">
          {format(today, 'EEEE, MMMM d, yyyy')}
        </p>
        <h1 className="text-3xl font-bold mt-2">Welcome back</h1>
        <p className="text-stone-400 mt-2">
          You have {todayTasks.length} tasks and {todayEvents.length} events scheduled for today.
        </p>
        
        <div className="flex flex-wrap gap-4 mt-6">
          <Link 
            to={createPageUrl('Tasks')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <CheckSquare className="w-4 h-4" />
            <span className="text-sm font-medium">View Tasks</span>
          </Link>
          <Link 
            to={createPageUrl('Calendar')}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Open Calendar</span>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Tasks"
          value={pendingTasks.length}
          subtitle={`${completedTasks.length} completed`}
          icon={CheckSquare}
          accentColor={accentColor}
        />
        <StatCard
          title="Active Goals"
          value={activeGoals.length}
          subtitle={`${avgGoalProgress}% avg progress`}
          icon={Target}
          accentColor={accentColor}
        />
        <StatCard
          title="Today's Events"
          value={todayEvents.length}
          subtitle={format(today, 'EEEE')}
          icon={Calendar}
          accentColor={accentColor}
        />
        <StatCard
          title="This Week"
          value={upcomingEvents.length}
          subtitle="Upcoming events"
          icon={TrendingUp}
          accentColor={accentColor}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full border-stone-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-800">
                  Today's Tasks
                </CardTitle>
                <Link 
                  to={createPageUrl('Tasks')}
                  className="text-sm font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayTasks.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks for today</p>
                </div>
              ) : (
                todayTasks.slice(0, 5).map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
                  >
                    <div 
                      className="w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0"
                      style={{ borderColor: primaryColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.due_time && (
                          <span className="text-xs text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.due_time}
                          </span>
                        )}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${priorityConfig[task.priority]?.color || priorityConfig.normal.color}`}
                        >
                          {priorityConfig[task.priority]?.label || 'Normal'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Goals Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full border-stone-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-800">
                  Goals Progress
                </CardTitle>
                <Link 
                  to={createPageUrl('Goals')}
                  className="text-sm font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeGoals.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active goals</p>
                </div>
              ) : (
                activeGoals.slice(0, 4).map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-stone-800 text-sm truncate flex-1">
                        {goal.title}
                      </p>
                      <span className="text-sm font-semibold text-stone-600 ml-2">
                        {goal.progress || 0}%
                      </span>
                    </div>
                    <Progress 
                      value={goal.progress || 0} 
                      className="h-2"
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full border-stone-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-stone-800">
                  Upcoming Events
                </CardTitle>
                <Link 
                  to={createPageUrl('Calendar')}
                  className="text-sm font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1"
                >
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const eventDate = parseISO(event.date);
                  const dateLabel = isToday(eventDate) 
                    ? 'Today' 
                    : isTomorrow(eventDate) 
                      ? 'Tomorrow' 
                      : format(eventDate, 'EEE, MMM d');
                  
                  return (
                    <div 
                      key={event.id}
                      className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl"
                    >
                      <div 
                        className="w-1 h-full min-h-[40px] rounded-full"
                        style={{ backgroundColor: event.color || accentColor }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 text-sm truncate">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                          <span>{dateLabel}</span>
                          {event.start_time && (
                            <>
                              <span>•</span>
                              <span>{event.start_time}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Priority Matrix Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-stone-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-stone-800">
                Priority Overview
              </CardTitle>
              <Link 
                to={createPageUrl('Tasks')}
                className="text-sm font-medium text-stone-500 hover:text-stone-800 flex items-center gap-1"
              >
                Manage tasks <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(priorityConfig).map(([key, config]) => {
                const count = pendingTasks.filter(t => t.priority === key).length;
                return (
                  <div 
                    key={key}
                    className={`p-4 rounded-xl border ${config.color}`}
                  >
                    <div className="flex items-center gap-2">
                      {key === 'urgent-important' && <AlertCircle className="w-4 h-4" />}
                      {key === 'urgent' && <Zap className="w-4 h-4" />}
                      <span className="font-medium text-sm">{config.label}</span>
                    </div>
                    <p className="text-2xl font-bold mt-2">{count}</p>
                    <p className="text-xs opacity-70">tasks</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}