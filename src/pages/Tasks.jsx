import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { format, parseISO, isToday, isTomorrow, isPast } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, 
  Plus, 
  Clock,
  Calendar,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

const priorityConfig = {
  'urgent-important': { 
    label: 'Urgent & Important', 
    description: 'Do first',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
    dotColor: 'bg-rose-500'
  },
  'important': { 
    label: 'Important', 
    description: 'Schedule',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    dotColor: 'bg-amber-500'
  },
  'urgent': { 
    label: 'Urgent', 
    description: 'Delegate',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    dotColor: 'bg-orange-500'
  },
  'normal': { 
    label: 'Normal', 
    description: 'Do later',
    color: 'bg-stone-100 text-stone-600 border-stone-200',
    dotColor: 'bg-stone-400'
  }
};

const statusConfig = {
  pending: { label: 'Pending', color: 'text-stone-600' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600' },
  completed: { label: 'Completed', color: 'text-emerald-600' },
  cancelled: { label: 'Cancelled', color: 'text-stone-400' }
};

export default function Tasks() {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    priority: 'normal',
    status: 'pending',
    category: ''
  });

  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: async () => {
      const list = await base44.entities.PlannerSettings.list();
      return list[0] || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleCloseForm();
    }
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';

  const handleOpenForm = (task = null) => {
    if (task) {
      setEditingTask(task);
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        due_time: task.due_time || '',
        priority: task.priority || 'normal',
        status: task.status || 'pending',
        category: task.category || ''
      });
    } else {
      setEditingTask(null);
      setFormData({
        title: '',
        description: '',
        due_date: '',
        due_time: '',
        priority: 'normal',
        status: 'pending',
        category: ''
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleSubmit = () => {
    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: formData });
      handleCloseForm();
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleTaskComplete = (task) => {
    updateMutation.mutate({
      id: task.id,
      data: { status: task.status === 'completed' ? 'pending' : 'completed' }
    });
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    // Status filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending' || t.status === 'in-progress');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(t => t.status === 'completed');
    } else if (activeTab === 'today') {
      filtered = filtered.filter(t => t.due_date && isToday(parseISO(t.due_date)));
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  const getDateLabel = (dateStr) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isPast(date)) return 'Overdue';
    return format(date, 'MMM d');
  };

  const isOverdue = (task) => {
    return task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'completed';
  };

  // Group tasks by priority for Eisenhower matrix view
  const tasksByPriority = {
    'urgent-important': filteredTasks.filter(t => t.priority === 'urgent-important'),
    'important': filteredTasks.filter(t => t.priority === 'important'),
    'urgent': filteredTasks.filter(t => t.priority === 'urgent'),
    'normal': filteredTasks.filter(t => t.priority === 'normal')
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage your tasks with priority levels"
        icon={CheckSquare}
        actions={
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-stone-800 hover:bg-stone-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Priority: {priorityFilter === 'all' ? 'All' : priorityConfig[priorityFilter]?.label}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setPriorityFilter('all')}>
              All Priorities
            </DropdownMenuItem>
            {Object.entries(priorityConfig).map(([key, config]) => (
              <DropdownMenuItem key={key} onClick={() => setPriorityFilter(key)}>
                <div className={cn("w-2 h-2 rounded-full mr-2", config.dotColor)} />
                {config.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Priority Matrix View */}
      {priorityFilter === 'all' && activeTab === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(priorityConfig).map(([key, config]) => (
            <Card key={key} className="border-stone-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-full", config.dotColor)} />
                    <CardTitle className="text-base font-semibold">
                      {config.label}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {tasksByPriority[key].filter(t => t.status !== 'completed').length} tasks
                  </Badge>
                </div>
                <p className="text-xs text-stone-500">{config.description}</p>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[300px] overflow-y-auto">
                {tasksByPriority[key].filter(t => t.status !== 'completed').length === 0 ? (
                  <p className="text-sm text-stone-400 text-center py-4">No tasks</p>
                ) : (
                  tasksByPriority[key]
                    .filter(t => t.status !== 'completed')
                    .map((task) => (
                      <TaskItem 
                        key={task.id} 
                        task={task} 
                        onToggle={toggleTaskComplete}
                        onEdit={handleOpenForm}
                        getDateLabel={getDateLabel}
                        isOverdue={isOverdue}
                      />
                    ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {(priorityFilter !== 'all' || activeTab !== 'all') && (
        <Card className="border-stone-100">
          <CardContent className="p-4 space-y-2">
            {filteredTasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks found"
                description="Create a new task to get started"
                actionLabel="Add Task"
                onAction={() => handleOpenForm()}
              />
            ) : (
              filteredTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTaskComplete}
                  onEdit={handleOpenForm}
                  getDateLabel={getDateLabel}
                  isOverdue={isOverdue}
                  showPriority
                />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Task Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What needs to be done?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Priority (Eisenhower Matrix)</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", config.dotColor)} />
                        <span>{config.label}</span>
                        <span className="text-xs text-stone-500">({config.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="due_time">Due Time</Label>
                <Input
                  id="due_time"
                  type="time"
                  value={formData.due_time}
                  onChange={(e) => setFormData({ ...formData, due_time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Work, Personal, Project"
              />
            </div>

            {editingTask && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            {editingTask && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(editingTask.id)}
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
              disabled={!formData.title}
              className="bg-stone-800 hover:bg-stone-900"
            >
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TaskItem({ task, onToggle, onEdit, getDateLabel, isOverdue, showPriority }) {
  const dateLabel = getDateLabel(task.due_date);
  const overdue = isOverdue(task);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group",
        task.status === 'completed' && "opacity-60"
      )}
    >
      <button
        onClick={() => onToggle(task)}
        className="mt-0.5 flex-shrink-0"
      >
        {task.status === 'completed' ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <Circle className="w-5 h-5 text-stone-300 group-hover:text-stone-400" />
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <p className={cn(
            "font-medium text-sm",
            task.status === 'completed' 
              ? "text-stone-400 line-through" 
              : "text-stone-800"
          )}>
            {task.title}
          </p>
          <button
            onClick={() => onEdit(task)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-stone-400 hover:text-stone-600"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {showPriority && (
            <Badge 
              variant="outline" 
              className={cn("text-xs", priorityConfig[task.priority]?.color)}
            >
              {priorityConfig[task.priority]?.label}
            </Badge>
          )}
          
          {dateLabel && (
            <span className={cn(
              "flex items-center gap-1 text-xs",
              overdue ? "text-rose-500" : "text-stone-500"
            )}>
              {overdue && <AlertTriangle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {dateLabel}
            </span>
          )}
          
          {task.due_time && (
            <span className="flex items-center gap-1 text-xs text-stone-500">
              <Clock className="w-3 h-3" />
              {task.due_time}
            </span>
          )}
          
          {task.category && (
            <Badge variant="outline" className="text-xs bg-stone-50">
              {task.category}
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}