'use client';

import { useState } from 'react';
import { X, Plus, Trash2, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import type { InviteChannel } from '@/types';

interface Contact {
  name: string;
  contact: string;
  channel: InviteChannel;
}

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onInvitesSent: () => void;
}

export function InviteModal({
  isOpen,
  onClose,
  projectId,
  onInvitesSent,
}: InviteModalProps) {
  const [contacts, setContacts] = useState<Contact[]>([
    { name: '', contact: '', channel: 'email' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<Array<{ contact: Contact; success: boolean; error?: string }> | null>(null);

  if (!isOpen) return null;

  const addContact = () => {
    setContacts([...contacts, { name: '', contact: '', channel: 'email' }]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-detect channel based on contact format
    if (field === 'contact') {
      if (isValidEmail(value)) {
        updated[index].channel = 'email';
      } else if (isValidPhone(value)) {
        updated[index].channel = 'sms';
      }
    }

    setContacts(updated);
  };

  const validateContacts = (): boolean => {
    for (const contact of contacts) {
      if (!contact.name.trim()) {
        setError('All contacts must have a name');
        return false;
      }
      if (contact.channel === 'email' && !isValidEmail(contact.contact)) {
        setError(`Invalid email: ${contact.contact}`);
        return false;
      }
      if (contact.channel === 'sms' && !isValidPhone(contact.contact)) {
        setError(`Invalid phone number: ${contact.contact}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validateContacts()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/v1/projects/${projectId}/invites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send invites');
      }

      const data = await response.json();
      setResults(data);
      onInvitesSent();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setContacts([{ name: '', contact: '', channel: 'email' }]);
    setResults(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {results ? 'Invitations Sent' : 'Invite Contributors'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {results ? (
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    result.success ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {result.success ? (
                    <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                    {result.contact.name}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                    {result.success ? 'Invitation sent' : result.error}
                  </p>
                </div>
              </div>
            ))}
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <p className="text-gray-600 mb-4">
              Enter the contact information for people you&apos;d like to contribute
              memories. They&apos;ll receive an invitation with a link to share their
              stories.
            </p>

            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="Name"
                      value={contact.name}
                      onChange={(e) => updateContact(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      placeholder="Email or phone"
                      value={contact.contact}
                      onChange={(e) => updateContact(index, 'contact', e.target.value)}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => updateContact(index, 'channel', 'email')}
                      className={`p-2 rounded-lg ${
                        contact.channel === 'email'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      aria-label="Send via email"
                    >
                      <Mail className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => updateContact(index, 'channel', 'sms')}
                      className={`p-2 rounded-lg ${
                        contact.channel === 'sms'
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      aria-label="Send via SMS"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                  {contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      aria-label="Remove contact"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addContact}
              className="flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add another contact
            </button>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={loading}>
                Send Invitations
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
