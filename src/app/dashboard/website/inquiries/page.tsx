'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  EnvelopeIcon,
  PhoneIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  status: string;
  notes: string;
  created_at: string;
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [filteredInquiries, setFilteredInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'closed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchInquiries();
  }, []);

  useEffect(() => {
    filterInquiries();
  }, [inquiries, filter]);

  const fetchInquiries = async () => {
    try {
      const { data, error } = await supabase
        .from('website_inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInquiries(data || []);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterInquiries = () => {
    if (filter === 'all') {
      setFilteredInquiries(inquiries);
    } else {
      setFilteredInquiries(inquiries.filter((inq) => inq.status === filter));
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('website_inquiries')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      fetchInquiries();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateNotes = async (id: string) => {
    try {
      const { error } = await supabase
        .from('website_inquiries')
        .update({ notes })
        .eq('id', id);

      if (error) throw error;
      setSelectedInquiry(null);
      setNotes('');
      fetchInquiries();
    } catch (error) {
      console.error('Error updating notes:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700';
      case 'contacted':
        return 'bg-yellow-100 text-yellow-700';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inquiries</h1>
        <p className="text-gray-600 mt-1">Manage customer inquiries and bookings</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({inquiries.length})
        </button>
        <button
          onClick={() => setFilter('new')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'new'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          New ({inquiries.filter((i) => i.status === 'new').length})
        </button>
        <button
          onClick={() => setFilter('contacted')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'contacted'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Contacted ({inquiries.filter((i) => i.status === 'contacted').length})
        </button>
        <button
          onClick={() => setFilter('closed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'closed'
              ? 'bg-sceneside-navy text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Closed ({inquiries.filter((i) => i.status === 'closed').length})
        </button>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <EnvelopeIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No inquiries yet
            </h3>
            <p className="text-gray-600">
              Customer inquiries will appear here
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry) => (
            <div key={inquiry.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {inquiry.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                        {inquiry.status}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {inquiry.inquiry_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <EnvelopeIcon className="w-4 h-4" />
                        <a href={`mailto:${inquiry.email}`} className="hover:text-sceneside-navy">
                          {inquiry.email}
                        </a>
                      </div>
                      {inquiry.phone && (
                        <div className="flex items-center gap-1">
                          <PhoneIcon className="w-4 h-4" />
                          <a href={`tel:${inquiry.phone}`} className="hover:text-sceneside-navy">
                            {inquiry.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(inquiry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {inquiry.status !== 'contacted' && (
                      <button
                        onClick={() => updateStatus(inquiry.id, 'contacted')}
                        className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {inquiry.status !== 'closed' && (
                      <button
                        onClick={() => updateStatus(inquiry.id, 'closed')}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                </div>

                {inquiry.notes && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <strong>Notes:</strong> {inquiry.notes}
                    </p>
                  </div>
                )}

                {selectedInquiry?.id === inquiry.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input"
                      rows={3}
                      placeholder="Add notes..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateNotes(inquiry.id)}
                        className="btn-primary text-sm"
                      >
                        Save Notes
                      </button>
                      <button
                        onClick={() => {
                          setSelectedInquiry(null);
                          setNotes('');
                        }}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedInquiry(inquiry);
                      setNotes(inquiry.notes || '');
                    }}
                    className="text-sm text-sceneside-navy hover:underline"
                  >
                    {inquiry.notes ? 'Edit Notes' : 'Add Notes'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
