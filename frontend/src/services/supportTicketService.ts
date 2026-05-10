import api from './api';

export interface SupportTicketPayload {
  full_name: string;
  email: string;
  category: string;
  message: string;
  attachment?: File | null;
}

export interface SupportTicketResponse {
  message?: string;
  data?: {
    reference?: string;
  };
}

export const supportTicketService = {
  async createTicket(payload: SupportTicketPayload): Promise<SupportTicketResponse> {
    const formData = new FormData();
    formData.append('full_name', payload.full_name);
    formData.append('email', payload.email);
    formData.append('category', payload.category);
    formData.append('message', payload.message);

    if (payload.attachment) {
      formData.append('attachment', payload.attachment);
    }

    const { data } = await api.post('/support-tickets', formData);
    return data;
  },
};
