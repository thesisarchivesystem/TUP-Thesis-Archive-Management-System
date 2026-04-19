import api from './api';

export const messageService = {
  async getContacts() {
    const { data } = await api.get('/messages/contacts');
    return data;
  },

  async getConversations() {
    const { data } = await api.get('/messages/conversations');
    return data;
  },

  async startConversation(contactId: string) {
    const { data } = await api.post('/messages/conversations', {
      contact_id: contactId,
    });
    return data;
  },

  async getMessages(conversationId: string) {
    const { data } = await api.get(`/messages/${conversationId}`);
    return data;
  },

  async sendMessage(conversationId: string, receiverId: string, body: string, attachment?: File | null, attachmentUrl?: string) {
    const formData = new FormData();
    formData.append('conversation_id', conversationId);
    formData.append('receiver_id', receiverId);
    formData.append('body', body);

    if (attachment) {
      formData.append('attachment', attachment);
    }

    if (attachmentUrl) {
      formData.append('attachment_url', attachmentUrl);
    }

    const { data } = await api.post('/messages', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: [(requestData) => requestData],
    });

    return data;
  },
};
