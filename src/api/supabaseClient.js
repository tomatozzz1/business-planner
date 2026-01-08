import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// API wrapper compatible con base44
export const base44 = {
  entities: {
    Goal: {
      list: async () => {
        const { data, error } = await supabase.from('goals').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      create: async (goal) => {
        const { data, error } = await supabase.from('goals').insert([goal]).select().single();
        if (error) throw error;
        return data;
      },
      update: async (id, goal) => {
        const { data, error } = await supabase.from('goals').update(goal).eq('id', id).select().single();
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase.from('goals').delete().eq('id', id);
        if (error) throw error;
      }
    },
    Task: {
      list: async () => {
        const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      create: async (task) => {
        const { data, error } = await supabase.from('tasks').insert([task]).select().single();
        if (error) throw error;
        return data;
      },
      update: async (id, task) => {
        const { data, error } = await supabase.from('tasks').update(task).eq('id', id).select().single();
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) throw error;
      }
    },
    Event: {
      list: async () => {
        const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
        if (error) throw error;
        return data || [];
      },
      create: async (event) => {
        const { data, error } = await supabase.from('events').insert([event]).select().single();
        if (error) throw error;
        return data;
      },
      update: async (id, event) => {
        const { data, error } = await supabase.from('events').update(event).eq('id', id).select().single();
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase.from('events').delete().eq('id', id);
        if (error) throw error;
      }
    },
    Note: {
      list: async () => {
        const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      create: async (note) => {
        const { data, error } = await supabase.from('notes').insert([note]).select().single();
        if (error) throw error;
        return data;
      },
      update: async (id, note) => {
        const { data, error } = await supabase.from('notes').update(note).eq('id', id).select().single();
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase.from('notes').delete().eq('id', id);
        if (error) throw error;
      }
    },
    Contact: {
      list: async () => {
        const { data, error } = await supabase.from('contacts').select('*').order('name', { ascending: true });
        if (error) throw error;
        return data || [];
      },
      create: async (contact) => {
        const { data, error } = await supabase.from('contacts').insert([contact]).select().single();
        if (error) throw error;
        return data;
      },
      update: async (id, contact) => {
        const { data, error } = await supabase.from('contacts').update(contact).eq('id', id).select().single();
        if (error) throw error;
        return data;
      },
      delete: async (id) => {
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) throw error;
      }
    },
    PlannerSettings: {
      list: async () => {
        const { data, error } = await supabase.from('planner_settings').select('*').limit(1);
        if (error) throw error;
        return data || [];
      },
      create: async (settings) => {
        const { data, error } = await supabase.from('planner_settings').insert([settings]).select().single();
        if (error) throw error;
        return data;
      },
      update: async (id, settings) => {
        const { data, error } = await supabase.from('planner_settings').update(settings).eq('id', id).select().single();
        if (error) throw error;
        return data;
      }
    }
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('public')
          .upload(filePath, file);
        
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
        
        return { file_url: publicUrl };
      }
    }
  }
};