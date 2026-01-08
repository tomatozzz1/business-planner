import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isSameDay,
  isToday,
  parseISO
} from 'date-fns';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays,
  Clock,
  Plus,
  CheckCircle2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import PageHeader from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const timeSlots = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

const priorityConfig = {
  'urgent-important': { label: 'Urgent & Important', color: 'bg-rose-500' },
  'important': { label: 'Important', color: 'bg-amber-500' },
  'urgent': { label: 'Urgent', color: 'bg-orange-500' },
  'normal': { label: 'Normal', color: 'bg-stone-400' }
};

export default function WeeklyPlanner() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
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

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';
  const accentColor = settings?.accent_color || '#c9a962';
  const weekStartsOn = settings?.week_starts_on === 'sunday' ? 0 : 1;

  const weekStart = startOfWeek(currentWeek, { weekStartsOn });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getItemsForDay = (day) => {
    const dayTasks = tasks.filter(t => t.due_date && isSameDay(parseISO(t.due_date), day));
    const dayEvents = events.filter(e => e.date && isSameDay(parseISO(e.date), day));
    return { tasks: dayTasks, events: dayEvents };
  };

  const toggleTaskComplete = (task) => {
    updateTaskMutation.mutate({
      id: task.id,
      data: { status: task.status === 'completed' ? 'pending' : 'completed' }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Planner"
        subtitle={`${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`}
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentWeek(new Date())}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        }
      />

      {/* Week Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((day, index) => {
          const { tasks: dayTasks, events: dayEvents } = getItemsForDay(day);
          const isTodayDate = isToday(day);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={cn(
                "h-full border-stone-100 overflow-hidden",
                isTodayDate && "ring-2 ring-offset-2"
              )}
              style={isTodayDate ? { ringColor: primaryColor } : {}}
              >
                <CardHeader 
                  className="py-3 px-4"
                  style={isTodayDate ? { backgroundColor: `${primaryColor}10` } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-stone-500 uppercase">
                        {format(day, 'EEE')}
                      </p>
                      <p className={cn(
                        "text-2xl font-bold",
                        isTodayDate ? "text-stone-800" : "text-stone-600"
                      )}>
                        {format(day, 'd')}
                      </p>
                    </div>
                    {isTodayDate && (
                      <Badge 
                        className="text-white text-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Today
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                  {/* Events */}
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-2 rounded-lg text-xs"
                      style={{ 
                        backgroundColor: `${event.color || accentColor}15`,
                        borderLeft: `3px solid ${event.color || accentColor}`
                      }}
                    >
                      <p className="font-medium text-stone-800 truncate">
                        {event.title}
                      </p>
                      {event.start_time && (
                        <p className="text-stone-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {event.start_time}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Tasks */}
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-start gap-2 p-2 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors",
                        task.status === 'completed' && "opacity-60"
                      )}
                    >
                      <button
                        onClick={() => toggleTaskComplete(task)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {task.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-stone-400" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-xs font-medium truncate",
                          task.status === 'completed' 
                            ? "text-stone-500 line-through" 
                            : "text-stone-800"
                        )}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-1 mt-1">
                          <div 
                            className={cn(
                              "w-2 h-2 rounded-full",
                              priorityConfig[task.priority]?.color || 'bg-stone-400'
                            )}
                          />
                          {task.due_time && (
                            <span className="text-xs text-stone-500">
                              {task.due_time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {dayTasks.length === 0 && dayEvents.length === 0 && (
                    <div className="text-center py-4 text-stone-400">
                      <p className="text-xs">No items</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Week Notes Section */}
      <Card className="border-stone-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-stone-800">
              Week Overview
            </CardTitle>
            <div className="flex gap-2">
              <Link to={createPageUrl('Tasks')}>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </Link>
              <Link to={createPageUrl('Calendar')}>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Event
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-stone-50">
              <p className="text-sm text-stone-500">Total Tasks</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">
                {weekDays.reduce((sum, day) => sum + getItemsForDay(day).tasks.length, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50">
              <p className="text-sm text-stone-500">Completed</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {weekDays.reduce((sum, day) => 
                  sum + getItemsForDay(day).tasks.filter(t => t.status === 'completed').length, 0
                )}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50">
              <p className="text-sm text-stone-500">Events</p>
              <p className="text-2xl font-bold text-stone-800 mt-1">
                {weekDays.reduce((sum, day) => sum + getItemsForDay(day).events.length, 0)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-stone-50">
              <p className="text-sm text-stone-500">High Priority</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {weekDays.reduce((sum, day) => 
                  sum + getItemsForDay(day).tasks.filter(t => 
                    t.priority === 'urgent-important' || t.priority === 'important'
                  ).length, 0
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}