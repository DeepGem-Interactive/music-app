import { z } from 'zod';

export const inviteChannelSchema = z.enum(['sms', 'email']);

export const contactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  contact: z.string().min(1, 'Contact is required'),
  channel: inviteChannelSchema,
}).refine((data) => {
  if (data.channel === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(data.contact);
  }
  if (data.channel === 'sms') {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    return phoneRegex.test(data.contact);
  }
  return false;
}, {
  message: 'Invalid contact format for selected channel',
  path: ['contact'],
});

export const createInvitesSchema = z.object({
  contacts: z.array(contactSchema).min(1, 'Add at least one contact'),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type CreateInvitesInput = z.infer<typeof createInvitesSchema>;
