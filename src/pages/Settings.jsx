import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Palette,
  Clock,
  Calendar,
  Upload,
  Save,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import PageHeader from '@/components/common/PageHeader';
import { cn } from '@/lib/utils';

const themePresets = [
  { name: 'Classic Navy', primary: '#1e3a5f', accent: '#c9a962' },
  { name: 'Forest Green', primary: '#1a4d2e', accent: '#f5c45e' },
  { name: 'Royal Purple', primary: '#4a1d6e', accent: '#e8b4bc' },
  { name: 'Ocean Blue', primary: '#1e4d6b', accent: '#7fd1ae' },
  { name: 'Charcoal', primary: '#2d2d2d', accent: '#ff6b6b' },
  { name: 'Burgundy', primary: '#722f37', accent: '#d4a574' }
];

export default function Settings() {
  const [formData, setFormData] = useState({
    company_name: '',
    logo_url: '',
    slogan: '',
    primary_color: '#1e3a5f',
    accent_color: '#c9a962',
    theme: 'classic',
    week_starts_on: 'monday',
    time_format: '12h',
    date_format: 'MM/DD/YYYY'
  });
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ['plannerSettings'],
    queryFn: () => base44.entities.PlannerSettings.list(),
  });

  const settings = settingsList[0];

  useEffect(() => {
    if (settings) {
      setFormData({
        company_name: settings.company_name || '',
        logo_url: settings.logo_url || '',
        slogan: settings.slogan || '',
        primary_color: settings.primary_color || '#1e3a5f',
        accent_color: settings.accent_color || '#c9a962',
        theme: settings.theme || 'classic',
        week_starts_on: settings.week_starts_on || 'monday',
        time_format: settings.time_format || '12h',
        date_format: settings.date_format || 'MM/DD/YYYY'
      });
    }
  }, [settings]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PlannerSettings.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerSettings'] });
      toast.success('Settings saved successfully');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlannerSettings.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plannerSettings'] });
      toast.success('Settings updated successfully');
    }
  });

  const handleSave = () => {
    if (settings) {
      updateMutation.mutate({ id: settings.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
    } catch (error) {
      toast.error('Failed to upload logo');
    }
    setIsUploading(false);
  };

  const applyThemePreset = (preset) => {
    setFormData({
      ...formData,
      primary_color: preset.primary,
      accent_color: preset.accent
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Customize your planner"
        icon={SettingsIcon}
        actions={
          <Button 
            onClick={handleSave}
            className="bg-stone-800 hover:bg-stone-900"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-stone-100">
            <CardHeader>
              <CardTitle className="text-lg">Branding</CardTitle>
              <CardDescription>Customize your planner's identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company / Brand Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Your company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slogan">Slogan / Tagline</Label>
                  <Input
                    id="slogan"
                    value={formData.slogan}
                    onChange={(e) => setFormData({ ...formData, slogan: e.target.value })}
                    placeholder="Your tagline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {formData.logo_url && (
                    <div className="w-16 h-16 rounded-xl border border-stone-200 flex items-center justify-center overflow-hidden">
                      <img 
                        src={formData.logo_url} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload">
                      <Button 
                        variant="outline" 
                        asChild 
                        disabled={isUploading}
                        className="cursor-pointer"
                      >
                        <span>
                          <Upload className="w-4 h-4 mr-2" />
                          {isUploading ? 'Uploading...' : 'Upload Logo'}
                        </span>
                      </Button>
                    </label>
                    <p className="text-xs text-stone-500 mt-1">
                      Recommended: 200x200px, PNG or SVG
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Theme & Colors */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-stone-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Colors
              </CardTitle>
              <CardDescription>Choose your color scheme</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Theme Presets */}
              <div className="space-y-3">
                <Label>Color Presets</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {themePresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyThemePreset(preset)}
                      className={cn(
                        "p-3 rounded-xl border-2 transition-all text-left hover:shadow-md",
                        formData.primary_color === preset.primary 
                          ? "border-stone-800" 
                          : "border-stone-100 hover:border-stone-200"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-5 h-5 rounded-full"
                          style={{ backgroundColor: preset.accent }}
                        />
                        {formData.primary_color === preset.primary && (
                          <Check className="w-4 h-4 text-stone-800 ml-auto" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-stone-700">{preset.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="primary_color"
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <Input
                      value={formData.primary_color}
                      onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accent_color">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      id="accent_color"
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                    />
                    <Input
                      value={formData.accent_color}
                      onChange={(e) => setFormData({ ...formData, accent_color: e.target.value })}
                      className="flex-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div 
                  className="p-4 rounded-xl text-white"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <p className="font-semibold">Primary Color</p>
                  <p className="text-sm opacity-80">Used for headers and navigation</p>
                  <div 
                    className="mt-3 px-4 py-2 rounded-lg inline-block font-medium"
                    style={{ backgroundColor: formData.accent_color, color: formData.primary_color }}
                  >
                    Accent Button
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Date & Time Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-stone-100">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Date & Time
              </CardTitle>
              <CardDescription>Configure calendar preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Week Starts On</Label>
                  <Select
                    value={formData.week_starts_on}
                    onValueChange={(value) => setFormData({ ...formData, week_starts_on: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sunday">Sunday</SelectItem>
                      <SelectItem value="monday">Monday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select
                    value={formData.time_format}
                    onValueChange={(value) => setFormData({ ...formData, time_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={formData.date_format}
                    onValueChange={(value) => setFormData({ ...formData, date_format: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}