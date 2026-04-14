import api from './api';

export interface SupportTicketPayload {
  full_name: string;
  email: string;
  category: string;
  message: string;
}

export const supportTicketService = {
  async createTicket(payload: SupportTicketPayload) {
    const { data } = await api.post('/support-tickets', payload);
    return data;
  },
};
