import { useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, Paperclip } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAblyClient } from '../../hooks/useAbly';
import { useChatChannel } from '../../hooks/useChatChannel';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
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

const getOtherParticipant = (
  conversation: Conversation,
  currentUserId?: string,
  contacts: MessageContact[] = [],
) => {
  const participants = [conversation.participant_one, conversation.participant_two]
    .filter((participant): participant is User => Boolean(participant));
  const relatedUsers = [conversation.faculty, conversation.student]
    .filter((participant): participant is User => Boolean(participant));

  const knownParticipant = [...participants, ...relatedUsers]
    .find((participant) => participant.id !== currentUserId);

  if (knownParticipant) {
    return knownParticipant;
  }

  const otherParticipantId = [
    conversation.participant_one_id,
    conversation.participant_two_id,
    conversation.student_id,
    conversation.faculty_id,
  ].find((id) => id && id !== currentUserId);

  if (!otherParticipantId) {
    return null;
  }

  const matchedContact = contacts.find((contact) => contact.id === otherParticipantId);
  if (!matchedContact) {
    return null;
  }

  return {
    id: matchedContact.id,
    name: matchedContact.name,
    email: matchedContact.email,
    role: matchedContact.role,
    avatar_url: matchedContact.avatar_url,
    is_active: true,
    created_at: '',
  } as User;
};

const formatRoleLabel = (role?: User['role']) => {
  if (!role) return 'User';
  return role === 'vpaa' ? 'VPAA' : role.charAt(0).toUpperCase() + role.slice(1);
};

const getAvatarToneClass = (role?: User['role']) => {
  if (role === 'student') return 'student';
  if (role === 'faculty') return 'faculty';
  return 'vpaa';
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

const getAttachmentFileName = (url?: string) => {
  if (!url) return 'Attachment';

  const rawFileName = url.split('/').pop()?.split('?')[0] || 'Attachment';

  try {
    return decodeURIComponent(rawFileName);
  } catch {
    return rawFileName;
  }
};

const getAttachmentHref = (message: Message) => message.attachment_access_url || message.attachment_url || '#';

const hydrateConversationContact = (
  conversation: Conversation,
  currentUser: User | null | undefined,
  contact: User | MessageContact | null | undefined,
): Conversation => {
  if (!currentUser || !contact) {
    return conversation;
  }

  const contactUser: User = {
    id: contact.id,
    name: contact.name,
    email: contact.email,
    role: contact.role,
    avatar_url: contact.avatar_url,
    is_active: true,
    created_at: '',
  };

  const participantOne = conversation.participant_one ?? (
    conversation.participant_one_id === currentUser.id ? currentUser : contactUser
  );
  const participantTwo = conversation.participant_two ?? (
    conversation.participant_two_id === currentUser.id ? currentUser : contactUser
  );

  return {
    ...conversation,
    participant_one: participantOne,
    participant_two: participantTwo,
    student: conversation.student ?? (contactUser.role === 'student' ? contactUser : currentUser.role === 'student' ? currentUser : undefined),
    faculty: conversation.faculty ?? (contactUser.role === 'faculty' ? contactUser : currentUser.role === 'faculty' ? currentUser : undefined),
  };
};

export default function SharedMessagesView() {
  const location = useLocation();
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
  const [startingConversationId, setStartingConversationId] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [syncingMessages, setSyncingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);
  const optimisticMessageIdRef = useRef(0);
  const typingTimeoutRef = useRef<number | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  const pendingConversationIdRef = useRef<string | null>(
    typeof location.state === 'object' && location.state && 'conversationId' in location.state
      ? String((location.state as { conversationId?: string }).conversationId ?? '') || null
      : null,
  );

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    const nextConversationId = typeof location.state === 'object' && location.state && 'conversationId' in location.state
      ? String((location.state as { conversationId?: string }).conversationId ?? '') || null
      : null;

    pendingConversationIdRef.current = nextConversationId;

    if (nextConversationId) {
      setActiveConversationId(nextConversationId);
    }
  }, [location.state]);

  const upsertConversation = (conversation: Conversation, unreadCount?: number) => {
    setConversations((current) => {
      const existing = current.find((item) => item.id === conversation.id);
      const nextConversation = existing
        ? {
          ...existing,
          ...conversation,
          unread_count: unreadCount ?? conversation.unread_count ?? existing.unread_count ?? 0,
        }
        : {
          ...conversation,
          unread_count: unreadCount ?? conversation.unread_count ?? 0,
        };

      return [nextConversation, ...current.filter((item) => item.id !== conversation.id)].sort((a, b) => {
        const aTime = new Date(a.last_message_at || a.last_message?.created_at || 0).getTime();
        const bTime = new Date(b.last_message_at || b.last_message?.created_at || 0).getTime();
        return bTime - aTime;
      });
    });
  };

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
    setError(null);

    try {
      const conversationResponse = await messageService.getConversations();
      const nextConversations = (conversationResponse.data ?? []) as Conversation[];

      setConversations(nextConversations);
      setActiveConversationId((current) => {
        if (current && nextConversations.some((item) => item.id === current)) {
          return current;
        }

        return nextConversations[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations.');
      setConversations([]);
      setActiveConversationId(null);
    }
  };

  const loadMessages = async (conversationId: string, options?: { background?: boolean }) => {
    const isBackgroundRefresh = options?.background === true;

    if (isBackgroundRefresh) {
      setSyncingMessages(true);
    } else {
      setLoadingMessages(true);
    }

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
      if (!isBackgroundRefresh) {
        setMessages([]);
      }
    } finally {
      if (isBackgroundRefresh) {
        setSyncingMessages(false);
      } else {
        setLoadingMessages(false);
      }
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

  useEffect(() => {
    const pendingConversationId = pendingConversationIdRef.current;
    if (!pendingConversationId) return;

    if (conversations.some((conversation) => conversation.id === pendingConversationId)) {
      setActiveConversationId(pendingConversationId);
      pendingConversationIdRef.current = null;
    }
  }, [conversations]);

  const conversationViews = useMemo<ConversationView[]>(
    () => conversations.map((conversation) => ({
      conversation,
      contact: getOtherParticipant(conversation, user?.id, contacts),
      preview: getPreview(conversation),
      timeLabel: formatConversationTime(conversation.last_message_at || conversation.last_message?.created_at),
    })),
    [contacts, conversations, user?.id],
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

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [activeConversationId, conversations],
  );

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === activeContactId) ?? null,
    [activeContactId, contacts],
  );

  const activeRecipient = useMemo(() => {
    const fromConversation = activeConversation ? getOtherParticipant(activeConversation, user?.id, contacts) : null;
    if (fromConversation) {
      return fromConversation;
    }

    return activeContact;
  }, [activeConversation, activeContact, contacts, user?.id]);

  const canCompose = Boolean(activeConversationId || activeRecipient?.id);
  const canSend = Boolean((messageInput.trim() || selectedAttachment) && activeRecipient?.id && !sending && !startingConversationId);

  const activeHeaderName = activeConversationView?.contact?.name || activeRecipient?.name || 'Select a conversation';
  const activeHeaderEmail = activeConversationView?.contact?.email || activeRecipient?.email || 'Choose a user to start chatting';
  const activeHeaderInitials = getInitials(activeConversationView?.contact?.name || activeRecipient?.name);
  const activeHeaderRole = activeConversationView?.contact?.role || activeRecipient?.role;
  const activeRecipientIsOnline = Boolean(activeRecipient?.id && onlineUserIds.includes(activeRecipient.id));
  const { typingUserId, publishTyping } = useTypingIndicator(activeConversationId, user?.id || '');
  const isOtherUserTyping = Boolean(typingUserId && typingUserId !== user?.id);

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
        url: getAttachmentHref(message),
        label: getAttachmentLabel(message.attachment_url),
        fileName: getAttachmentFileName(message.attachment_url),
      })),
    [messages],
  );

  useEffect(() => {
    if (chatBodyRef.current) {
      const frameId = window.requestAnimationFrame(() => {
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
      });

      return () => window.cancelAnimationFrame(frameId);
    }
  }, [isOtherUserTyping, syncingMessages, messageGroups, loadingMessages]);

  useEffect(() => () => {
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    let channelCleanup: (() => void) | undefined;

    void (async () => {
      const client = await getAblyClient();
      const channel = client.channels.get(`private:notifications.${user.id}`);

      const listener = () => {
        void loadContacts();
        void loadConversations();

        if (activeConversationIdRef.current) {
          void loadMessages(activeConversationIdRef.current, { background: true });
        }
      };

      channel.subscribe('notification.new', listener);
      channelCleanup = () => channel.unsubscribe('notification.new', listener);
    })();

    return () => {
      channelCleanup?.();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    let cleanup: (() => void) | undefined;

    void (async () => {
      const client = await getAblyClient();
      const channel = client.channels.get('private:presence.messaging');
      const presence = (channel as unknown as {
        presence: {
          enterClient: (clientId: string, data?: unknown) => Promise<void>;
          leaveClient: (clientId: string) => Promise<void>;
          get: () => Promise<Array<{ clientId: string }>>;
          subscribe: (action: 'enter' | 'leave' | 'update', listener: () => void) => void;
          unsubscribe: (action: 'enter' | 'leave' | 'update', listener: () => void) => void;
        };
      }).presence;

      const refreshMembers = async () => {
        try {
          const members = await presence.get();
          if (!isMounted) return;
          setOnlineUserIds(Array.from(new Set(members.map((member) => member.clientId))));
        } catch {
          if (!isMounted) return;
          setOnlineUserIds([]);
        }
      };

      const handlePresenceChange = () => {
        void refreshMembers();
      };

      await presence.enterClient(user.id, { role: user.role });
      await refreshMembers();

      presence.subscribe('enter', handlePresenceChange);
      presence.subscribe('leave', handlePresenceChange);
      presence.subscribe('update', handlePresenceChange);

      cleanup = () => {
        presence.unsubscribe('enter', handlePresenceChange);
        presence.unsubscribe('leave', handlePresenceChange);
        presence.unsubscribe('update', handlePresenceChange);
        void presence.leaveClient(user.id);
      };
    })();

    return () => {
      isMounted = false;
      cleanup?.();
    };
  }, [user?.id, user?.role]);

  useChatChannel(activeConversationId, (incomingMessage) => {
    if (incomingMessage.conversation_id === activeConversationIdRef.current) {
      setMessages((current) => current.some((item) => item.id === incomingMessage.id) ? current : [...current, incomingMessage]);
    }

    const knownConversation = conversations.find((conversation) => conversation.id === incomingMessage.conversation_id);
    if (knownConversation) {
      const isIncomingForCurrentUser = incomingMessage.receiver_id === user?.id;
      const isActiveConversation = incomingMessage.conversation_id === activeConversationIdRef.current;

      upsertConversation({
        ...knownConversation,
        last_message_at: incomingMessage.created_at,
        last_message: incomingMessage,
      }, isIncomingForCurrentUser
        ? (isActiveConversation ? 0 : (knownConversation.unread_count ?? 0) + 1)
        : 0);
      return;
    }

      void loadConversations();
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
      const createdConversation = hydrateConversationContact(response.data as Conversation, user, contact);

      upsertConversation(createdConversation);
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

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedAttachment) || sending || !activeRecipient?.id) return;

    const receiverId = activeRecipient.id;
    const trimmedBody = messageInput.trim();
    const attachmentToSend = selectedAttachment;

    setSending(true);
    setError(null);

    try {
      let conversationId = activeConversationId;
      let conversationRecord = activeConversation;

      if (!conversationId) {
        const startResponse = await messageService.startConversation(receiverId);
        const createdConversation = hydrateConversationContact(startResponse.data as Conversation, user, activeRecipient);
        conversationId = createdConversation.id;
        conversationRecord = createdConversation;
        setActiveConversationId(createdConversation.id);
        upsertConversation(createdConversation);
        setContacts((current) => current.map((item) => (
          item.id === receiverId
            ? { ...item, conversation_id: createdConversation.id }
            : item
        )));
      }

      if (!conversationId) {
        throw new Error('Unable to start conversation.');
      }

      const optimisticId = `optimistic-${Date.now()}-${optimisticMessageIdRef.current++}`;
      const optimisticMessage: Message = {
        id: optimisticId,
        conversation_id: conversationId,
        sender_id: user?.id || '',
        receiver_id: receiverId,
        body: trimmedBody,
        attachment_url: attachmentToSend ? URL.createObjectURL(attachmentToSend) : undefined,
        is_read: true,
        created_at: new Date().toISOString(),
        sender: user || undefined,
      };

      setMessages((current) => [...current, optimisticMessage]);
      setMessageInput('');
      setSelectedAttachment(null);
      if (attachmentInputRef.current) {
        attachmentInputRef.current.value = '';
      }
      upsertConversation({
        ...(conversationRecord ?? {}),
        id: conversationId,
        last_message_at: optimisticMessage.created_at,
        last_message: optimisticMessage,
      }, 0);

      const response = await messageService.sendMessage(
        conversationId,
        receiverId,
        trimmedBody,
        attachmentToSend,
      );
      const createdMessage = response.data as Message;

      setMessages((current) => current.map((item) => item.id === optimisticId ? createdMessage : item));
      void publishTyping(false);
      upsertConversation({
        ...(conversationRecord ?? {}),
        id: conversationId,
        last_message_at: createdMessage.created_at,
        last_message: createdMessage,
      }, 0);
    } catch (err) {
      setMessages((current) => current.filter((item) => !item.id.startsWith('optimistic-')));
      setMessageInput(trimmedBody);
      setSelectedAttachment(attachmentToSend);
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
            <span>Available Users</span>
            <small>{filteredContacts.length}</small>
          </div>

          <div className="vpaa-contacts-list vpaa-contacts-list-users">
            {!loadingContacts && !filteredContacts.length ? (
              <div className="vpaa-messages-empty">No users matched your search.</div>
            ) : null}

            {filteredContacts.map((contact) => {
              const isActive = contact.conversation_id === activeConversationId;
              const isStarting = startingConversationId === contact.id;
              const isOnline = onlineUserIds.includes(contact.id);

              return (
                <button
                  key={contact.id}
                  type="button"
                  className={`vpaa-contact-item${isActive ? ' active' : ''}`}
                  onClick={() => void handleOpenContact(contact)}
                  disabled={isStarting}
                >
                  <div className={`vpaa-contact-avatar avatar-tone-${getAvatarToneClass(contact.role)}`}>{getInitials(contact.name)}</div>

                  <div className="vpaa-contact-main">
                    <div className="vpaa-contact-name-row">
                      <div className="vpaa-contact-name">{contact.name}</div>
                      {isOnline ? <span className="vpaa-contact-status-dot" /> : null}
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
              <div className={`vpaa-chat-avatar avatar-tone-${getAvatarToneClass(activeHeaderRole)}`}>{activeHeaderInitials}</div>
              <div>
                <div className="vpaa-chat-name-row">
                  <div className="vpaa-chat-name">{activeHeaderName}</div>
                  {activeRecipientIsOnline ? <span className="vpaa-online-dot" /> : null}
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
                      const messageSenderRole = isMine ? user?.role : message.sender?.role;
                      const hasAttachment = Boolean(message.attachment_url);
                      const attachmentLabel = getAttachmentFileName(message.attachment_url);

                      return (
                        <div key={group.key} className={`vpaa-bubble-row${isMine ? ' mine' : ''}`}>
                          {!isMine ? <div className={`vpaa-bubble-avatar avatar-tone-${getAvatarToneClass(messageSenderRole)}`}>{getInitials(messageSender?.name)}</div> : null}

                          <div className={`vpaa-bubble${hasAttachment ? ' file-bubble' : ''}`}>
                            {message.body ? <span>{message.body}</span> : null}
                            {hasAttachment ? (
                              <a href={getAttachmentHref(message)} target="_blank" rel="noreferrer" className="vpaa-message-attachment-link">
                                <span className="vpaa-file-thumb" />
                                <span>{attachmentLabel}</span>
                              </a>
                            ) : null}
                          </div>

                          {isMine ? <div className={`vpaa-bubble-avatar avatar-tone-${getAvatarToneClass(messageSenderRole)}`}>{getInitials(messageSender?.name)}</div> : null}
                        </div>
                      );
                    })}
                    {isOtherUserTyping ? (
                      <div className="vpaa-bubble-row">
                        <div className={`vpaa-bubble-avatar avatar-tone-${getAvatarToneClass(activeHeaderRole)}`}>{activeHeaderInitials}</div>
                        <div className="vpaa-bubble vpaa-typing-bubble" aria-live="polite">
                          <span className="vpaa-typing-dot" />
                          <span className="vpaa-typing-dot" />
                          <span className="vpaa-typing-dot" />
                        </div>
                      </div>
                    ) : null}
                    {syncingMessages && activeConversationId ? (
                      <div className="vpaa-bubble-row">
                        <div className={`vpaa-bubble-avatar avatar-tone-${getAvatarToneClass(activeHeaderRole)}`}>{activeHeaderInitials}</div>
                        <div className="vpaa-bubble vpaa-typing-bubble" aria-live="polite">
                          <span className="vpaa-typing-dot" />
                          <span className="vpaa-typing-dot" />
                          <span className="vpaa-typing-dot" />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <form
                className="vpaa-composer"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSendMessage();
                }}
              >
                <div className="vpaa-composer-input-wrap">
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      setSelectedAttachment(event.target.files?.[0] ?? null);
                    }}
                  />
                  <button
                    type="button"
                    className="vpaa-attach-button"
                    aria-label="Attach file"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={!canCompose || sending}
                  >
                    <Paperclip size={16} />
                  </button>
                  <input
                    className="vpaa-composer-input"
                    type="text"
                    value={messageInput}
                    onChange={(event) => {
                      setMessageInput(event.target.value);

                      if (!activeConversationId) {
                        return;
                      }

                      void publishTyping(event.target.value.trim().length > 0);

                      if (typingTimeoutRef.current) {
                        window.clearTimeout(typingTimeoutRef.current);
                      }

                      typingTimeoutRef.current = window.setTimeout(() => {
                        void publishTyping(false);
                      }, 1200);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                        event.preventDefault();
                        if (canSend) {
                          void handleSendMessage();
                        }
                      }
                    }}
                    placeholder="Write Something..."
                    disabled={!canCompose || sending}
                  />
                </div>

                <button
                  className="vpaa-send-button"
                  type="button"
                  disabled={!canSend}
                  onClick={() => {
                    void handleSendMessage();
                  }}
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
              {selectedAttachment ? (
                <div className="vpaa-message-attachment-preview">
                  <span>{selectedAttachment.name}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAttachment(null);
                      if (attachmentInputRef.current) {
                        attachmentInputRef.current.value = '';
                      }
                    }}
                  >
                    Remove
                  </button>
                </div>
              ) : null}
          </div>
        </section>

        <aside className={`vpaa-chat-details${detailsOpen ? ' open' : ''}`} aria-hidden={!detailsOpen}>
            <div className="vpaa-chat-details-hero">
              <div className={`vpaa-chat-details-avatar avatar-tone-${getAvatarToneClass(activeHeaderRole)}`}>{activeHeaderInitials}</div>
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

      {error && !error.includes('status code 500') ? <div className="vpaa-message-error">{error}</div> : null}
    </>
  );
}
