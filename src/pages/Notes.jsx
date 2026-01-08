import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  FileText, 
  Plus, 
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  Tag,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

const categoryConfig = {
  meeting: { label: 'Meeting', color: 'bg-blue-100 text-blue-700' },
  ideas: { label: 'Ideas', color: 'bg-violet-100 text-violet-700' },
  project: { label: 'Project', color: 'bg-emerald-100 text-emerald-700' },
  personal: { label: 'Personal', color: 'bg-pink-100 text-pink-700' },
  general: { label: 'General', color: 'bg-stone-100 text-stone-700' }
};

const noteColors = [
  { name: 'Default', value: '', bg: 'bg-white' },
  { name: 'Yellow', value: '#fef9c3', bg: 'bg-yellow-100' },
  { name: 'Green', value: '#dcfce7', bg: 'bg-green-100' },
  { name: 'Blue', value: '#dbeafe', bg: 'bg-blue-100' },
  { name: 'Pink', value: '#fce7f3', bg: 'bg-pink-100' },
  { name: 'Purple', value: '#f3e8ff', bg: 'bg-purple-100' }
];

export default function Notes() {
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [viewingNote, setViewingNote] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: [],
    is_pinned: false,
    color: ''
  });
  const [newTag, setNewTag] = useState('');

  const queryClient = useQueryClient();

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes'],
    queryFn: () => base44.entities.Note.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: async () => {
      const list = await base44.entities.PlannerSettings.list();
      return list[0] || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Note.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Note.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notes'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Note.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      handleCloseForm();
      setViewingNote(null);
    }
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';

  const handleOpenForm = (note = null) => {
    if (note) {
      setEditingNote(note);
      setFormData({
        title: note.title || '',
        content: note.content || '',
        category: note.category || 'general',
        tags: note.tags || [],
        is_pinned: note.is_pinned || false,
        color: note.color || ''
      });
    } else {
      setEditingNote(null);
      setFormData({
        title: '',
        content: '',
        category: 'general',
        tags: [],
        is_pinned: false,
        color: ''
      });
    }
    setShowForm(true);
    setViewingNote(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingNote(null);
    setNewTag('');
  };

  const handleSubmit = () => {
    if (editingNote) {
      updateMutation.mutate({ id: editingNote.id, data: formData });
      handleCloseForm();
    } else {
      createMutation.mutate(formData);
    }
  };

  const togglePin = (note) => {
    updateMutation.mutate({
      id: note.id,
      data: { is_pinned: !note.is_pinned }
    });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData({ 
      ...formData, 
      tags: formData.tags.filter(t => t !== tagToRemove) 
    });
  };

  const filteredNotes = notes
    .filter(note => {
      if (activeTab !== 'all' && note.category !== activeTab) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          note.title?.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query) ||
          note.tags?.some(t => t.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.created_date || b.created_at) - new Date(a.created_date || a.created_at);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notes"
        subtitle="Capture ideas, meeting notes, and more"
        icon={FileText}
        actions={
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-stone-800 hover:bg-stone-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        }
      />

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="meeting">Meeting</TabsTrigger>
            <TabsTrigger value="ideas">Ideas</TabsTrigger>
            <TabsTrigger value="project">Project</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No notes yet"
          description="Create your first note to get started"
          actionLabel="New Note"
          onAction={() => handleOpenForm()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredNotes.map((note, index) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className={cn(
                    "h-full border-stone-100 hover:shadow-lg transition-all cursor-pointer group overflow-hidden",
                    note.is_pinned && "ring-1 ring-amber-200"
                  )}
                  style={{ backgroundColor: note.color || undefined }}
                  onClick={() => setViewingNote(note)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={categoryConfig[note.category]?.color}>
                            {categoryConfig[note.category]?.label}
                          </Badge>
                          {note.is_pinned && (
                            <Pin className="w-3 h-3 text-amber-500" />
                          )}
                        </div>
                        <CardTitle className="text-base font-semibold text-stone-800 truncate">
                          {note.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(note);
                          }}
                          className="p-1 hover:bg-stone-200 rounded"
                        >
                          {note.is_pinned ? (
                            <PinOff className="w-4 h-4 text-stone-500" />
                          ) : (
                            <Pin className="w-4 h-4 text-stone-500" />
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenForm(note);
                          }}
                          className="p-1 hover:bg-stone-200 rounded"
                        >
                          <Edit3 className="w-4 h-4 text-stone-500" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-stone-600 line-clamp-4 prose prose-sm prose-stone max-w-none">
                      <ReactMarkdown>
                        {note.content?.substring(0, 200) || 'No content'}
                      </ReactMarkdown>
                    </div>
                    
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {note.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-white/50">
                            #{tag}
                          </Badge>
                        ))}
                        {note.tags.length > 3 && (
                          <Badge variant="outline" className="text-xs bg-white/50">
                            +{note.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-stone-400 mt-3">
                      {format(parseISO(note.created_date || note.created_at), 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* View Note Dialog */}
      <Dialog open={!!viewingNote} onOpenChange={() => setViewingNote(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {viewingNote && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={categoryConfig[viewingNote.category]?.color}>
                    {categoryConfig[viewingNote.category]?.label}
                  </Badge>
                  {viewingNote.is_pinned && (
                    <Pin className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <DialogTitle className="text-xl">
                  {viewingNote.title}
                </DialogTitle>
                <p className="text-sm text-stone-500">
                  Created {format(parseISO(viewingNote.created_date || viewingNote.created_at), 'MMMM d, yyyy')}
                </p>
              </DialogHeader>
              
              <div className="prose prose-stone max-w-none py-4">
                <ReactMarkdown>{viewingNote.content}</ReactMarkdown>
              </div>

              {viewingNote.tags && viewingNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 py-2 border-t border-stone-100">
                  {viewingNote.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <DialogFooter className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(viewingNote.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOpenForm(viewingNote)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Note Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Note title"
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
                    {Object.entries(categoryConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-1">
                  {noteColors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={cn(
                        "w-6 h-6 rounded-full border-2 transition-all",
                        color.bg,
                        formData.color === color.value 
                          ? "border-stone-800 scale-110" 
                          : "border-transparent hover:border-stone-300"
                      )}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content (Markdown supported)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your note here... Markdown is supported!"
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, idx) => (
                    <Badge 
                      key={idx} 
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="rounded"
              />
              <Pin className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Pin this note</span>
            </label>
          </div>

          <DialogFooter className="flex gap-2">
            {editingNote && (
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate(editingNote.id)}
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
              {editingNote ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}