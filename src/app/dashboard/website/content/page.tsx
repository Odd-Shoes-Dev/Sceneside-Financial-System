'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface ContentSection {
  section_key: string;
  title: string;
  content: string;
}

export default function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<Record<string, string>>({});

  const sections = [
    { key: 'hero_title', title: 'Homepage Hero Title', placeholder: 'Discover Your Perfect Vacation' },
    { key: 'hero_subtitle', title: 'Homepage Hero Subtitle', placeholder: 'Explore amazing destinations...' },
    { key: 'about_title', title: 'About Section Title', placeholder: 'About Us' },
    { key: 'about_content', title: 'About Section Content', placeholder: 'We are a leading tourism company...' },
    { key: 'contact_phone', title: 'Contact Phone', placeholder: '+1 (555) 123-4567' },
    { key: 'contact_email', title: 'Contact Email', placeholder: 'info@company.com' },
    { key: 'contact_address', title: 'Contact Address', placeholder: '123 Main St, City, State ZIP' },
    { key: 'footer_text', title: 'Footer Text', placeholder: '© 2025 Company Name. All rights reserved.' },
  ];

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('website_content')
        .select('*');

      if (error) throw error;

      const contentMap: Record<string, string> = {};
      data?.forEach((item) => {
        contentMap[item.section_key] = item.content;
      });

      setContent(contentMap);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upsert each content section
      for (const section of sections) {
        const contentValue = content[section.key] || '';
        
        const { error } = await supabase
          .from('website_content')
          .upsert({
            section_key: section.key,
            title: section.title,
            content: contentValue,
          }, {
            onConflict: 'section_key',
          });

        if (error) throw error;
      }

      alert('Content saved successfully!');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sceneside-navy"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Website Content</h1>
          <p className="text-gray-600 mt-1">
            Edit your website text and information
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Homepage Hero */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Homepage Hero</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Hero Title</label>
              <input
                type="text"
                value={content['hero_title'] || ''}
                onChange={(e) => setContent({ ...content, hero_title: e.target.value })}
                className="input"
                placeholder={sections.find(s => s.key === 'hero_title')?.placeholder}
              />
            </div>

            <div>
              <label className="label">Hero Subtitle</label>
              <textarea
                value={content['hero_subtitle'] || ''}
                onChange={(e) => setContent({ ...content, hero_subtitle: e.target.value })}
                className="input"
                rows={2}
                placeholder={sections.find(s => s.key === 'hero_subtitle')?.placeholder}
              />
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">About Section</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">About Title</label>
              <input
                type="text"
                value={content['about_title'] || ''}
                onChange={(e) => setContent({ ...content, about_title: e.target.value })}
                className="input"
                placeholder={sections.find(s => s.key === 'about_title')?.placeholder}
              />
            </div>

            <div>
              <label className="label">About Content</label>
              <textarea
                value={content['about_content'] || ''}
                onChange={(e) => setContent({ ...content, about_content: e.target.value })}
                className="input"
                rows={6}
                placeholder={sections.find(s => s.key === 'about_content')?.placeholder}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Contact Information</h2>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={content['contact_phone'] || ''}
                onChange={(e) => setContent({ ...content, contact_phone: e.target.value })}
                className="input"
                placeholder={sections.find(s => s.key === 'contact_phone')?.placeholder}
              />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={content['contact_email'] || ''}
                onChange={(e) => setContent({ ...content, contact_email: e.target.value })}
                className="input"
                placeholder={sections.find(s => s.key === 'contact_email')?.placeholder}
              />
            </div>

            <div>
              <label className="label">Physical Address</label>
              <textarea
                value={content['contact_address'] || ''}
                onChange={(e) => setContent({ ...content, contact_address: e.target.value })}
                className="input"
                rows={2}
                placeholder={sections.find(s => s.key === 'contact_address')?.placeholder}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900">Footer</h2>
          </div>
          <div className="card-body">
            <div>
              <label className="label">Footer Text</label>
              <input
                type="text"
                value={content['footer_text'] || ''}
                onChange={(e) => setContent({ ...content, footer_text: e.target.value })}
                className="input"
                placeholder={sections.find(s => s.key === 'footer_text')?.placeholder}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
