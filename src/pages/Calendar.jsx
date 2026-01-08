import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  X,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import PageHeader from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';

const eventTypeColors = {
  meeting: '#3b82f6',
  deadline: '#ef4444',
  reminder: '#f59e0b',
  holiday: '#10b981',
  'company-event': '#8b5cf6',
  personal: '#ec4899'
};

const eventTypeLabels = {
  meeting: 'Meeting',
  deadline: 'Deadline',
  reminder: 'Reminder',
  holiday: 'Holiday',
  'company-event': 'Company Event',
  personal: 'Personal'
};

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    event_type: 'meeting',
    location: ''
  });

  const queryClient = useQueryClient();

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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      handleCloseForm();
    }
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';
  const weekStartsOn = settings?.week_starts_on === 'sunday' ? 0 : 1;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  if (weekStartsOn === 0) {
    weekDays.unshift(weekDays.pop());
  }

  const getEventsForDate = (date) => {
    return events.filter(event => {
      if (!event.date) return false;
      return isSameDay(parseISO(event.date), date);
    });
  };

  const handleOpenForm = (date = null, event = null) => {
    if (event) {
      setEditingEvent(event);
      setFormData({
        title: event.title || '',
        description: event.description || '',
        date: event.date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        event_type: event.event_type || 'meeting',
        location: event.location || ''
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        date: date ? format(date, 'yyyy-MM-dd') : '',
        start_time: '',
        end_time: '',
        event_type: 'meeting',
        location: ''
      });
    }
    setShowEventForm(true);
  };

  const handleCloseForm = () => {
    setShowEventForm(false);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      event_type: 'meeting',
      location: ''
    });
  };

  const handleSubmit = () => {
    const eventData = {
      ...formData,
      color: eventTypeColors[formData.event_type]
    };

    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createMutation.mutate(eventData);
    }
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendar"
        subtitle="Manage your events and schedule"
        icon={CalendarIcon}
        actions={
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-stone-800 hover:bg-stone-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <Card className="lg:col-span-3 border-stone-100">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-stone-800">
                {format(currentDate, 'MMMM yyyy')}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Days Header */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div 
                  key={day} 
                  className="text-center text-sm font-medium text-stone-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDate(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <motion.button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[100px] p-2 rounded-xl border transition-all text-left",
                      isCurrentMonth ? "bg-white border-stone-100" : "bg-stone-50 border-transparent",
                      isSelected && "ring-2 ring-offset-2",
                      "hover:border-stone-200"
                    )}
                    style={isSelected ? { ringColor: primaryColor } : {}}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={cn(
                      "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                      !isCurrentMonth && "text-stone-400",
                      isTodayDate && "text-white",
                      isCurrentMonth && !isTodayDate && "text-stone-700"
                    )}
                    style={isTodayDate ? { backgroundColor: primaryColor } : {}}
                    >
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <div
                          key={event.id}
                          className="text-xs truncate px-1.5 py-0.5 rounded"
                          style={{ 
                            backgroundColor: `${event.color || eventTypeColors.meeting}20`,
                            color: event.color || eventTypeColors.meeting
                          }}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-stone-500 px-1">
                          +{dayEvents.length - 3} more
                        </div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Events */}
        <Card className="border-stone-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-stone-800">
              {selectedDate 
                ? format(selectedDate, 'EEEE, MMM d') 
                : 'Select a date'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mb-4"
                onClick={() => handleOpenForm(selectedDate)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add event
              </Button>
            )}
            
            <div className="space-y-3">
              {selectedDateEvents.length === 0 ? (
                <div className="text-center py-8 text-stone-500">
                  <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No events</p>
                </div>
              ) : (
                selectedDateEvents.map((event) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors"
                    onClick={() => handleOpenForm(null, event)}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-1 h-full min-h-[40px] rounded-full"
                        style={{ backgroundColor: event.color || eventTypeColors.meeting }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 text-sm">
                          {event.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                          {event.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {event.start_time}
                              {event.end_time && ` - ${event.end_time}`}
                            </span>
                          )}
                        </div>
                        {event.location && (
                          <span className="flex items-center gap-1 text-xs text-stone-500 mt-1">
                            <MapPin className="w-3 h-3" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Form Dialog */}
      <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? 'Edit Event' : 'Add New Event'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Event title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type</Label>
              <Select
                value={formData.event_type}
                onValueChange={(value) => setFormData({ ...formData, event_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: eventTypeColors[key] }}
                        />
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Event location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Event details"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {editingEvent && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(editingEvent.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.date}
              className="bg-stone-800 hover:bg-stone-900"
            >
              {editingEvent ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}