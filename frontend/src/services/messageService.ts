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

  async sendMessage(conversationId: string, receiverId: string, body: string, attachmentUrl?: string) {
    const { data } = await api.post('/messages', {
      conversation_id: conversationId,
      receiver_id: receiverId,
      body,
      attachment_url: attachmentUrl,
    });
    return data;
  },
};
