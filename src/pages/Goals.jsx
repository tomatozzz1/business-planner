import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  Plus, 
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  Trash2,
  Edit3,
  Flag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

const categoryConfig = {
  personal: { label: 'Personal', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  professional: { label: 'Professional', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  project: { label: 'Project', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
};

const timeframeConfig = {
  'short-term': { label: 'Short-term', color: 'bg-amber-100 text-amber-700' },
  'medium-term': { label: 'Medium-term', color: 'bg-orange-100 text-orange-700' },
  'long-term': { label: 'Long-term', color: 'bg-rose-100 text-rose-700' }
};

const statusConfig = {
  'not-started': { label: 'Not Started', color: 'text-stone-500' },
  'in-progress': { label: 'In Progress', color: 'text-blue-600' },
  'completed': { label: 'Completed', color: 'text-emerald-600' },
  'on-hold': { label: 'On Hold', color: 'text-amber-600' }
};

export default function Goals() {
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal',
    timeframe: 'short-term',
    target_date: '',
    status: 'not-started',
    progress: 0,
    milestones: []
  });
  const [newMilestone, setNewMilestone] = useState('');

  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => base44.entities.Goal.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: async () => {
      const list = await base44.entities.PlannerSettings.list();
      return list[0] || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Goal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      handleCloseForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      handleCloseForm();
    }
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';
  const accentColor = settings?.accent_color || '#c9a962';

  const handleOpenForm = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        title: goal.title || '',
        description: goal.description || '',
        category: goal.category || 'personal',
        timeframe: goal.timeframe || 'short-term',
        target_date: goal.target_date || '',
        status: goal.status || 'not-started',
        progress: goal.progress || 0,
        milestones: goal.milestones || []
      });
    } else {
      setEditingGoal(null);
      setFormData({
        title: '',
        description: '',
        category: 'personal',
        timeframe: 'short-term',
        target_date: '',
        status: 'not-started',
        progress: 0,
        milestones: []
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setNewMilestone('');
  };

  const handleSubmit = () => {
    if (editingGoal) {
      updateMutation.mutate({ id: editingGoal.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const addMilestone = () => {
    if (newMilestone.trim()) {
      setFormData({
        ...formData,
        milestones: [...formData.milestones, { title: newMilestone.trim(), completed: false }]
      });
      setNewMilestone('');
    }
  };

  const toggleMilestone = (index) => {
    const newMilestones = [...formData.milestones];
    newMilestones[index].completed = !newMilestones[index].completed;
    
    const completedCount = newMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / newMilestones.length) * 100);
    
    setFormData({ ...formData, milestones: newMilestones, progress });
  };

  const removeMilestone = (index) => {
    const newMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({ ...formData, milestones: newMilestones });
  };

  const updateGoalProgress = (goal, milestone, index) => {
    const newMilestones = [...(goal.milestones || [])];
    newMilestones[index].completed = !milestone.completed;
    
    const completedCount = newMilestones.filter(m => m.completed).length;
    const progress = Math.round((completedCount / newMilestones.length) * 100);
    const status = progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : goal.status;
    
    updateMutation.mutate({ 
      id: goal.id, 
      data: { milestones: newMilestones, progress, status }
    });
  };

  const filteredGoals = activeTab === 'all' 
    ? goals 
    : goals.filter(g => g.category === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Goals & Objectives"
        subtitle="Track your personal, professional, and project goals"
        icon={Target}
        actions={
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-stone-800 hover:bg-stone-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        }
      />

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-stone-100">
          <TabsTrigger value="all">All Goals</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="project">Project</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set your first goal to start tracking your progress"
          actionLabel="Add Goal"
          onAction={() => handleOpenForm()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredGoals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="h-full border-stone-100 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant="outline" 
                            className={categoryConfig[goal.category]?.color}
                          >
                            {categoryConfig[goal.category]?.label}
                          </Badge>
                          <Badge className={timeframeConfig[goal.timeframe]?.color}>
                            {timeframeConfig[goal.timeframe]?.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg font-semibold text-stone-800">
                          {goal.title}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenForm(goal)}
                        className="text-stone-400 hover:text-stone-600"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goal.description && (
                      <p className="text-sm text-stone-600 line-clamp-2">
                        {goal.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className={statusConfig[goal.status]?.color}>
                          {statusConfig[goal.status]?.label}
                        </span>
                        <span className="font-semibold">{goal.progress || 0}%</span>
                      </div>
                      <Progress 
                        value={goal.progress || 0} 
                        className="h-2"
                      />
                    </div>

                    {/* Milestones */}
                    {goal.milestones && goal.milestones.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-stone-500 uppercase">
                          Milestones
                        </p>
                        <div className="space-y-1.5">
                          {goal.milestones.slice(0, 3).map((milestone, idx) => (
                            <button
                              key={idx}
                              onClick={() => updateGoalProgress(goal, milestone, idx)}
                              className="flex items-center gap-2 w-full text-left group"
                            >
                              {milestone.completed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <Circle className="w-4 h-4 text-stone-300 group-hover:text-stone-400 flex-shrink-0" />
                              )}
                              <span className={cn(
                                "text-sm truncate",
                                milestone.completed 
                                  ? "text-stone-400 line-through" 
                                  : "text-stone-700"
                              )}>
                                {milestone.title}
                              </span>
                            </button>
                          ))}
                          {goal.milestones.length > 3 && (
                            <p className="text-xs text-stone-500 pl-6">
                              +{goal.milestones.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Target Date */}
                    {goal.target_date && (
                      <div className="flex items-center gap-2 text-sm text-stone-500 pt-2 border-t border-stone-100">
                        <Calendar className="w-4 h-4" />
                        <span>Target: {format(parseISO(goal.target_date), 'MMM d, yyyy')}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Goal Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Goal' : 'Create New Goal'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What do you want to achieve?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your goal in detail"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="project">Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timeframe</Label>
                <Select
                  value={formData.timeframe}
                  onValueChange={(value) => setFormData({ ...formData, timeframe: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short-term">Short-term</SelectItem>
                    <SelectItem value="medium-term">Medium-term</SelectItem>
                    <SelectItem value="long-term">Long-term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="not-started">Not Started</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-3">
              <Label>Milestones</Label>
              <div className="flex gap-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  placeholder="Add a milestone"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMilestone())}
                />
                <Button type="button" onClick={addMilestone} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.milestones.map((milestone, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 p-2 bg-stone-50 rounded-lg"
                  >
                    <button
                      type="button"
                      onClick={() => toggleMilestone(index)}
                    >
                      {milestone.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-stone-300" />
                      )}
                    </button>
                    <span className={cn(
                      "flex-1 text-sm",
                      milestone.completed && "line-through text-stone-400"
                    )}>
                      {milestone.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(index)}
                      className="text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Progress</Label>
                <span className="text-sm font-medium">{formData.progress}%</span>
              </div>
              <Input
                type="range"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            {editingGoal && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(editingGoal.id)}
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
              {editingGoal ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}