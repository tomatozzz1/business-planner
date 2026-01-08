import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search,
  Star,
  Phone,
  Mail,
  Building2,
  Trash2,
  Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PageHeader from '@/components/common/PageHeader';
import EmptyState from '@/components/common/EmptyState';
import { cn } from '@/lib/utils';

const categoryConfig = {
  client: { label: 'Client', color: 'bg-blue-100 text-blue-700' },
  colleague: { label: 'Colleague', color: 'bg-emerald-100 text-emerald-700' },
  vendor: { label: 'Vendor', color: 'bg-amber-100 text-amber-700' },
  partner: { label: 'Partner', color: 'bg-violet-100 text-violet-700' },
  personal: { label: 'Personal', color: 'bg-pink-100 text-pink-700' },
  other: { label: 'Other', color: 'bg-stone-100 text-stone-600' }
};

export default function Contacts() {
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [viewingContact, setViewingContact] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    secondary_phone: '',
    address: '',
    category: 'other',
    notes: '',
    is_favorite: false
  });

  const queryClient = useQueryClient();

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: async () => {
      const list = await base44.entities.PlannerSettings.list();
      return list[0] || {};
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Contact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      handleCloseForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Contact.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contacts'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      handleCloseForm();
      setViewingContact(null);
    }
  });

  const primaryColor = settings?.primary_color || '#1e3a5f';

  const handleOpenForm = (contact = null) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name || '',
        company: contact.company || '',
        position: contact.position || '',
        email: contact.email || '',
        phone: contact.phone || '',
        secondary_phone: contact.secondary_phone || '',
        address: contact.address || '',
        category: contact.category || 'other',
        notes: contact.notes || '',
        is_favorite: contact.is_favorite || false
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        company: '',
        position: '',
        email: '',
        phone: '',
        secondary_phone: '',
        address: '',
        category: 'other',
        notes: '',
        is_favorite: false
      });
    }
    setShowForm(true);
    setViewingContact(null);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  const handleSubmit = () => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: formData });
      handleCloseForm();
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleFavorite = (contact) => {
    updateMutation.mutate({
      id: contact.id,
      data: { is_favorite: !contact.is_favorite }
    });
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || '?';
  };

  const filteredContacts = contacts
    .filter(contact => {
      if (activeTab === 'favorites' && !contact.is_favorite) return false;
      if (activeTab !== 'all' && activeTab !== 'favorites' && contact.category !== activeTab) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.includes(query)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return a.name?.localeCompare(b.name);
    });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        subtitle="Manage your important contacts"
        icon={Users}
        actions={
          <Button 
            onClick={() => handleOpenForm()}
            className="bg-stone-800 hover:bg-stone-900"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-stone-100">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="client">Clients</TabsTrigger>
            <TabsTrigger value="colleague">Colleagues</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="pl-9"
          />
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No contacts found"
          description="Add your first contact to get started"
          actionLabel="Add Contact"
          onAction={() => handleOpenForm()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card 
                  className="border-stone-100 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setViewingContact(contact)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={contact.avatar_url} />
                        <AvatarFallback 
                          className="text-white font-medium"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {getInitials(contact.name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-stone-800 truncate">
                              {contact.name}
                            </h3>
                            {contact.position && (
                              <p className="text-sm text-stone-500 truncate">
                                {contact.position}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(contact);
                            }}
                            className="text-stone-300 hover:text-amber-500"
                          >
                            <Star className={cn("w-5 h-5", contact.is_favorite && "fill-amber-400 text-amber-400")} />
                          </button>
                        </div>
                        
                        {contact.company && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-stone-500">
                            <Building2 className="w-3 h-3" />
                            <span className="truncate">{contact.company}</span>
                          </div>
                        )}
                        
                        <Badge className={cn("mt-2", categoryConfig[contact.category]?.color)}>
                          {categoryConfig[contact.category]?.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-stone-100">
                      {contact.phone && (
                        <a
                          href={`tel:${contact.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-stone-500 hover:text-stone-800"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {contact.email && (
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-stone-500 hover:text-stone-800"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={!!viewingContact} onOpenChange={() => setViewingContact(null)}>
        <DialogContent className="sm:max-w-md">
          {viewingContact && (
            <>
              <div className="flex flex-col items-center text-center pt-4">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarImage src={viewingContact.avatar_url} />
                  <AvatarFallback 
                    className="text-2xl text-white font-medium"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {getInitials(viewingContact.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-stone-800">
                  {viewingContact.name}
                </h2>
                {viewingContact.position && (
                  <p className="text-stone-500">{viewingContact.position}</p>
                )}
                {viewingContact.company && (
                  <p className="text-sm text-stone-400 mt-1">{viewingContact.company}</p>
                )}
                <Badge className={cn("mt-3", categoryConfig[viewingContact.category]?.color)}>
                  {categoryConfig[viewingContact.category]?.label}
                </Badge>
              </div>

              <div className="space-y-4 py-4">
                {viewingContact.email && (
                  <a href={`mailto:${viewingContact.email}`} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100">
                    <Mail className="w-5 h-5 text-stone-500" />
                    <span className="text-stone-700">{viewingContact.email}</span>
                  </a>
                )}
                
                {viewingContact.phone && (
                  <a href={`tel:${viewingContact.phone}`} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100">
                    <Phone className="w-5 h-5 text-stone-500" />
                    <span className="text-stone-700">{viewingContact.phone}</span>
                  </a>
                )}
                
                {viewingContact.secondary_phone && (
                  <a href={`tel:${viewingContact.secondary_phone}`} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl hover:bg-stone-100">
                    <Phone className="w-5 h-5 text-stone-500" />
                    <span className="text-stone-700">{viewingContact.secondary_phone}</span>
                  </a>
                )}

                {viewingContact.address && (
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <p className="text-sm text-stone-500 mb-1">Address</p>
                    <p className="text-stone-700">{viewingContact.address}</p>
                  </div>
                )}

                {viewingContact.notes && (
                  <div className="p-3 bg-stone-50 rounded-xl">
                    <p className="text-sm text-stone-500 mb-1">Notes</p>
                    <p className="text-stone-700">{viewingContact.notes}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button variant="destructive" onClick={() => deleteMutation.mutate(viewingContact.id)}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button variant="outline" onClick={() => handleOpenForm(viewingContact)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  placeholder="Job title"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_phone">Secondary Phone</Label>
                <Input
                  id="secondary_phone"
                  value={formData.secondary_phone}
                  onChange={(e) => setFormData({ ...formData, secondary_phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address"
                rows={2}
              />
            </div>

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
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_favorite}
                onChange={(e) => setFormData({ ...formData, is_favorite: e.target.checked })}
                className="rounded"
              />
              <Star className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Mark as favorite</span>
            </label>
          </div>

          <DialogFooter className="flex gap-2">
            {editingContact && (
              <Button variant="destructive" onClick={() => deleteMutation.mutate(editingContact.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseForm}>Cancel</Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.name}
              className="bg-stone-800 hover:bg-stone-900"
            >
              {editingContact ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}