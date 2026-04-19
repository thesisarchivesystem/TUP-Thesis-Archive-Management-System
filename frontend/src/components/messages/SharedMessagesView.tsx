import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Paperclip } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useChatChannel } from '../../hooks/useChatChannel';
import { messageService } from '../../services/messageService';
import type { Conversation, Message, MessageContact } from '../../types/message.types';
import type { User } from '../../types/user.types';

type ConversationView = {
  conversation: Conversation;
  contact: User | null;
  preview: string;
  timeLabel: string;
};

type MessageGroup =
  | { type: 'divider'; key: string; label: string }
  | { type: 'message'; key: string; message: Message };

const formatConversationTime = (timestamp?: string) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86400000);

  if (diffDays === 0) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatDividerLabel = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfTarget.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getInitials = (name?: string | null) =>
  (name || 'NA')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

const getPreview = (conversation: Conversation) => {
  if (conversation.last_message?.attachment_url && !conversation.last_message?.body) {
    return 'Sent an attachment';
  }

  return conversation.last_message?.body || 'No messages yet.';
};

const getOtherParticipant = (conversation: Conversation, currentUserId?: string) => {
  const participants = [conversation.participant_one, conversation.participant_two].filter(Boolean) as User[];

  return participants.find((participant) => participant.id !== currentUserId)
    ?? conversation.faculty
    ?? conversation.student
    ?? null;
};

const formatRoleLabel = (role?: User['role']) => {
  if (!role) return 'User';
  return role === 'vpaa' ? 'VPAA' : role.charAt(0).toUpperCase() + role.slice(1);
};

const getAttachmentLabel = (url?: string) => {
  if (!url) return 'FILE';

  const fileName = url.split('/').pop()?.split('?')[0] || '';
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') return 'PDF';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension || '')) return 'VID';
  if (['mp3', 'wav', 'aac'].includes(extension || '')) return 'AUD';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) return 'IMG';

  return 'FILE';
};

export default function SharedMessagesView() {
  const { user } = useAuth();
  const [conversationSearch, setConversationSearch] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [startingConversationId, setStartingConversationId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  const loadContacts = async () => {
    setLoadingContacts(true);

    try {
      const response = await messageService.getContacts();
      setContacts((response.data ?? []) as MessageContact[]);
    } catch (err) {
      setContacts([]);
      setError((current) => current || (err instanceof Error ? err.message : 'Failed to load contacts.'));
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    setError(null);

    try {
      const conversationResponse = await messageService.getConversations();
      const nextConversations = (conversationResponse.data ?? []) as Conversation[];

      setConversations(nextConversations);
      setActiveConversationId((current) => current && nextConversations.some((item) => item.id === current)
        ? current
        : nextConversations[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
      setConversations([]);
      setActiveConversationId(null);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    setLoadingMessages(true);

    try {
      const response = await messageService.getMessages(conversationId);
      setMessages((response.data ?? []) as Message[]);
      setConversations((current) => current.map((conversation) => (
        conversation.id === conversationId
          ? { ...conversation, unread_count: 0 }
          : conversation
      )));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages.');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    void loadContacts();
    void loadConversations();
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    void loadMessages(activeConversationId);
  }, [activeConversationId]);

  const conversationViews = useMemo<ConversationView[]>(
    () => conversations.map((conversation) => ({
      conversation,
      contact: getOtherParticipant(conversation, user?.id),
      preview: getPreview(conversation),
      timeLabel: formatConversationTime(conversation.last_message_at || conversation.last_message?.created_at),
    })),
    [conversations, user?.id],
  );

  const filteredConversations = useMemo(
    () => conversationViews.filter(({ contact, preview }) => {
      const normalized = conversationSearch.trim().toLowerCase();
      if (!normalized) return true;

      return [contact?.name, preview, contact?.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalized);
    }),
    [conversationSearch, conversationViews],
  );

  const filteredContacts = useMemo(
    () => contacts
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter((contact) => {
        const normalized = conversationSearch.trim().toLowerCase();
        if (!normalized) return true;

        return [contact.name, contact.email, contact.role]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(normalized);
      }),
    [contacts, conversationSearch],
  );

  const activeConversationView = useMemo(
    () => conversationViews.find(({ conversation }) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversationViews],
  );

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId) ?? null,
    [activeContactId, contacts],
  );

  const activeHeaderName = activeConversationView?.contact?.name || activeContact?.name || 'Select a conversation';
  const activeHeaderEmail = activeConversationView?.contact?.email || activeContact?.email || 'Choose a user to start chatting';
  const activeHeaderInitials = getInitials(activeConversationView?.contact?.name || activeContact?.name);
  const activeHeaderRole = activeConversationView?.contact?.role || activeContact?.role;

  const messageGroups = useMemo<MessageGroup[]>(() => {
    const groups: MessageGroup[] = [];
    let lastDivider = '';

    messages.forEach((message) => {
      const label = formatDividerLabel(message.created_at);
      if (label && label !== lastDivider) {
        groups.push({ type: 'divider', key: `divider-${message.id}`, label });
        lastDivider = label;
      }
      groups.push({ type: 'message', key: message.id, message });
    });

    return groups;
  }, [messages]);

  const conversationAttachments = useMemo(
    () => messages
      .filter((message) => Boolean(message.attachment_url))
      .map((message) => ({
        id: message.id,
        url: message.attachment_url as string,
        label: getAttachmentLabel(message.attachment_url),
        fileName: message.attachment_url?.split('/').pop()?.split('?')[0] || 'Attachment',
      })),
    [messages],
  );

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messageGroups, loadingMessages]);

  useChatChannel(activeConversationId, (incomingMessage) => {
    setMessages((current) => current.some((item) => item.id === incomingMessage.id) ? current : [...current, incomingMessage]);

    setConversations((current) => current.map((conversation) => {
      if (conversation.id !== incomingMessage.conversation_id) return conversation;

      return {
        ...conversation,
        last_message_at: incomingMessage.created_at,
        last_message: incomingMessage,
        unread_count: activeConversationId === incomingMessage.conversation_id
          ? 0
          : incomingMessage.receiver_id === user?.id
            ? (conversation.unread_count ?? 0) + 1
            : conversation.unread_count ?? 0,
      };
    }).sort((a, b) => {
      const aTime = new Date(a.last_message_at || a.last_message?.created_at || 0).getTime();
      const bTime = new Date(b.last_message_at || b.last_message?.created_at || 0).getTime();
      return bTime - aTime;
    }));
  });

  const handleOpenContact = async (contact: MessageContact) => {
    setError(null);
    setActiveContactId(contact.id);

    if (contact.conversation_id) {
      setActiveConversationId(contact.conversation_id);
      return;
    }

    setStartingConversationId(contact.id);

    try {
      const response = await messageService.startConversation(contact.id);
      const createdConversation = response.data as Conversation;

      setConversations((current) => {
        const next = current.some((conversation) => conversation.id === createdConversation.id)
          ? current
          : [createdConversation, ...current];

        return next.sort((a, b) => {
          const aTime = new Date(a.last_message_at || a.last_message?.created_at || 0).getTime();
          const bTime = new Date(b.last_message_at || b.last_message?.created_at || 0).getTime();
          return bTime - aTime;
        });
      });
      setContacts((current) => current.map((item) => (
        item.id === contact.id
          ? { ...item, conversation_id: createdConversation.id }
          : item
      )));
      setActiveConversationId(createdConversation.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start conversation.');
    } finally {
      setStartingConversationId(null);
    }
  };

  const sendMessage = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeConversationView || !messageInput.trim() || sending) return;

    const receiverId = activeConversationView.contact?.id;
    if (!receiverId) return;

    setSending(true);
    setError(null);

    try {
      const response = await messageService.sendMessage(activeConversationView.conversation.id, receiverId, messageInput.trim());
      const createdMessage = response.data as Message;

      setMessages((current) => current.some((item) => item.id === createdMessage.id) ? current : [...current, createdMessage]);
      setConversations((current) => current.map((conversation) => {
        if (conversation.id !== activeConversationView.conversation.id) return conversation;
        return {
          ...conversation,
          last_message_at: createdMessage.created_at,
          last_message: createdMessage,
        };
      }).sort((a, b) => {
        const aTime = new Date(a.last_message_at || a.last_message?.created_at || 0).getTime();
        const bTime = new Date(b.last_message_at || b.last_message?.created_at || 0).getTime();
        return bTime - aTime;
      }));
      setMessageInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <section className={`vpaa-messages-shell${detailsOpen ? ' details-open' : ''}`}>
        <aside className="vpaa-contacts-panel">
          <input
            className="vpaa-panel-search"
            type="text"
            value={conversationSearch}
            onChange={(event) => setConversationSearch(event.target.value)}
            placeholder="Search Here..."
          />

          <div className="vpaa-contact-section-header">
            <span>Recent Conversations</span>
            <small>{filteredConversations.length}</small>
          </div>

          <div className="vpaa-contacts-list vpaa-contacts-list-conversations">
            {loadingConversations ? <div className="vpaa-messages-empty">Loading conversations...</div> : null}

            {!loadingConversations && !filteredConversations.length ? (
              <div className="vpaa-messages-empty">No conversations matched your search.</div>
            ) : null}

            {filteredConversations.map(({ conversation, contact, preview, timeLabel }) => (
              <button
                key={conversation.id}
                type="button"
                className={`vpaa-contact-item${conversation.id === activeConversationId ? ' active' : ''}`}
                onClick={() => setActiveConversationId(conversation.id)}
              >
                <div className="vpaa-contact-avatar">{getInitials(contact?.name)}</div>

                <div className="vpaa-contact-main">
                  <div className="vpaa-contact-name-row">
                    <div className="vpaa-contact-name">{contact?.name || 'Unknown Contact'}</div>
                    <span className="vpaa-contact-status-dot" />
                  </div>
                  <div className="vpaa-contact-preview">{preview}</div>
                </div>

                <div className="vpaa-contact-meta">
                  <div className="vpaa-contact-time">{timeLabel}</div>
                  {(conversation.unread_count ?? 0) > 0 ? (
                    <div className="vpaa-contact-unread">{conversation.unread_count}</div>
                  ) : (
                    <div className="vpaa-contact-unread empty">&#10003;</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          <div className="vpaa-contact-section-header">
            <span>Available Users</span>
            <small>{filteredContacts.length}</small>
          </div>

          <div className="vpaa-contacts-list vpaa-contacts-list-users">
            {loadingContacts ? <div className="vpaa-messages-empty">Loading users...</div> : null}

            {!loadingContacts && !filteredContacts.length ? (
              <div className="vpaa-messages-empty">No users matched your search.</div>
            ) : null}

            {filteredContacts.map((contact) => {
              const isActive = contact.conversation_id === activeConversationId;
              const isStarting = startingConversationId === contact.id;

              return (
                <button
                  key={contact.id}
                  type="button"
                  className={`vpaa-contact-item${isActive ? ' active' : ''}`}
                  onClick={() => void handleOpenContact(contact)}
                  disabled={isStarting}
                >
                  <div className="vpaa-contact-avatar">{getInitials(contact.name)}</div>

                  <div className="vpaa-contact-main">
                    <div className="vpaa-contact-name-row">
                      <div className="vpaa-contact-name">{contact.name}</div>
                      <span className="vpaa-contact-status-dot" />
                    </div>
                    <div className="vpaa-contact-preview">{contact.email}</div>
                  </div>

                  <div className="vpaa-contact-meta">
                    <div className="vpaa-contact-time">{formatRoleLabel(contact.role)}</div>
                    <div className="vpaa-contact-unread empty">{isStarting ? '...' : contact.conversation_id ? 'Open' : 'Chat'}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="vpaa-conversation-panel">
          <div className="vpaa-chat-header">
            <div className="vpaa-chat-person">
              <div className="vpaa-chat-avatar">{activeHeaderInitials}</div>
              <div>
                <div className="vpaa-chat-name-row">
                  <div className="vpaa-chat-name">{activeHeaderName}</div>
                  {activeConversationView || activeContact ? <span className="vpaa-online-dot" /> : null}
                </div>
                <div className="vpaa-chat-subtitle">{activeHeaderEmail}</div>
              </div>
            </div>

            <button
              type="button"
              className={`vpaa-details-toggle${detailsOpen ? ' active' : ''}`}
              aria-label="Conversation info"
              onClick={() => setDetailsOpen((current) => !current)}
            >
              <CircleAlert size={18} />
            </button>
          </div>

          <div className="vpaa-chat-main">
              <div className="vpaa-chat-body" ref={chatBodyRef}>
                {loadingMessages ? <div className="vpaa-messages-empty">Loading messages...</div> : null}

                {!loadingMessages && !activeConversationId ? (
                  <div className="vpaa-messages-empty">Start a conversation...</div>
                ) : null}

                {!loadingMessages && activeConversationId && !messages.length ? (
                  <div className="vpaa-messages-empty">This conversation does not have any messages yet.</div>
                ) : null}

                {!loadingMessages && messageGroups.length ? (
                  <div className="vpaa-chat-thread active">
                    {messageGroups.map((group) => {
                      if (group.type === 'divider') {
                        return <div key={group.key} className="vpaa-day-divider">{group.label}</div>;
                      }

                      const message = group.message;
                      const isMine = message.sender_id === user?.id;
                      const messageSender = isMine ? user : message.sender;
                      const hasAttachment = Boolean(message.attachment_url);
                      const attachmentLabel = message.attachment_url?.split('/').pop() || 'Attachment';

                      return (
                        <div key={group.key} className={`vpaa-bubble-row${isMine ? ' mine' : ''}`}>
                          {!isMine ? <div className="vpaa-bubble-avatar">{getInitials(messageSender?.name)}</div> : null}

                          <div className={`vpaa-bubble${hasAttachment ? ' file-bubble' : ''}`}>
                            {message.body ? <span>{message.body}</span> : null}
                            {hasAttachment ? (
                              <>
                                <span className="vpaa-file-thumb" />
                                <span>{attachmentLabel}</span>
                              </>
                            ) : null}
                          </div>

                          {isMine ? <div className="vpaa-bubble-avatar">{getInitials(messageSender?.name)}</div> : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              <form className="vpaa-composer" onSubmit={sendMessage}>
                <div className="vpaa-composer-input-wrap">
                  <button type="button" className="vpaa-attach-button" aria-label="Attach file" disabled>
                    <Paperclip size={16} />
                  </button>
                  <input
                    className="vpaa-composer-input"
                    type="text"
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    placeholder="Write Something..."
                    disabled={!activeConversationId || sending}
                  />
                </div>

                <button className="vpaa-send-button" type="submit" disabled={!activeConversationId || !messageInput.trim() || sending}>
                  {sending ? '...' : 'Send'}
                </button>
              </form>
          </div>
        </section>

        <aside className={`vpaa-chat-details${detailsOpen ? ' open' : ''}`} aria-hidden={!detailsOpen}>
            <div className="vpaa-chat-details-hero">
              <div className="vpaa-chat-details-avatar">{activeHeaderInitials}</div>
              <h3>{activeHeaderName}</h3>
              <p>{formatRoleLabel(activeHeaderRole)}</p>
            </div>

            <div className="vpaa-chat-details-card">
              <div className="vpaa-chat-details-label">Contact</div>
              <div className="vpaa-chat-details-meta">
                <span>{activeHeaderEmail}</span>
              </div>
            </div>

            <div className="vpaa-chat-details-section">
              <div className="vpaa-chat-details-section-head">
                <strong>Attachments</strong>
                <span>{conversationAttachments.length}</span>
              </div>
              <div className="vpaa-attachment-chip-grid">
                {conversationAttachments.length ? conversationAttachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="vpaa-attachment-chip"
                  >
                    <span>{attachment.label}</span>
                    <small>{attachment.fileName}</small>
                  </a>
                )) : <div className="vpaa-chat-details-empty">No attachments yet.</div>}
              </div>
              {conversationAttachments.length ? (
                <button type="button" className="vpaa-chat-details-view-all">View All</button>
              ) : null}
            </div>
        </aside>
      </section>

      {error ? <div className="vpaa-message-error">{error}</div> : null}
    </>
  );
}
