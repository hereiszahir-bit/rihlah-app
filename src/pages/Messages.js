import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2 } from 'react-icons/fi';
import { colors, fonts, radius } from '../design';

import { useUser } from '../context/UserContext';
import { db, auth } from '../firebase';
import {
  collection, query, where, onSnapshot, orderBy, addDoc,
  getDocs, serverTimestamp, doc, getDoc, deleteDoc, writeBatch
} from 'firebase/firestore';

function Messages() {
  const navigate = useNavigate();
  const { currentUser, allUsers, connections } = useUser();
  const [conversations, setConversations] = useState([]);
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Real-time conversation list
  useEffect(() => {
    if (!currentUser) return;

    const convRef = collection(db, 'conversations');
    const q = query(
      convRef,
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const convs = [];
      snapshot.forEach(docSnap => {
        convs.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort client-side (avoids needing a composite index)
      convs.sort((a, b) => {
        const aTime = a.lastMessageTime?.toDate?.() || new Date(0);
        const bTime = b.lastMessageTime?.toDate?.() || new Date(0);
        return bTime - aTime;
      });
      setConversations(convs);
    });

    return unsub;
  }, [currentUser]);

  const getOtherUser = (conv) => {
    const otherUid = conv.participants.find(p => p !== currentUser?.uid);
    return allUsers.find(u => u.id === otherUid) || { name: 'User', id: otherUid };
  };

  const getUnread = (conv) => {
    return conv[`unread_${currentUser?.uid}`] || 0;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const startConversation = async (otherUserId) => {
    // Check local state first
    const existing = conversations.find(c =>
      c.participants.includes(otherUserId)
    );
    if (existing) {
      navigate(`/chat/${existing.id}`);
      setShowNewChat(false);
      return;
    }

    // Double-check Firestore to prevent duplicates
    const convRef = collection(db, 'conversations');
    const q = query(convRef, where('participants', 'array-contains', currentUser.uid));
    const snap = await getDocs(q);
    const existingDoc = snap.docs.find(d => d.data().participants.includes(otherUserId));
    if (existingDoc) {
      navigate(`/chat/${existingDoc.id}`);
      setShowNewChat(false);
      return;
    }

    // Create new conversation
    const newConv = await addDoc(convRef, {
      participants: [currentUser.uid, otherUserId],
      lastMessage: '',
      lastMessageTime: serverTimestamp(),
      lastSenderId: '',
      [`unread_${currentUser.uid}`]: 0,
      [`unread_${otherUserId}`]: 0,
      createdAt: serverTimestamp(),
    });

    navigate(`/chat/${newConv.id}`);
    setShowNewChat(false);
  };

  const deleteConversation = async (convId) => {
    // Optimistic: remove from UI immediately
    setConversations(prev => prev.filter(c => c.id !== convId));
    setDeleteId(null);

    try {
      // Delete all messages in the conversation
      const messagesRef = collection(db, 'conversations', convId, 'messages');
      const msgSnap = await getDocs(messagesRef);
      const batch = writeBatch(db);
      msgSnap.forEach(msgDoc => {
        batch.delete(msgDoc.ref);
      });
      batch.delete(doc(db, 'conversations', convId));
      await batch.commit();
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const filtered = conversations.filter(conv => {
    if (!search.trim()) return true;
    const other = getOtherUser(conv);
    return other.name?.toLowerCase().includes(search.toLowerCase());
  });

  // Get connections that don't have an existing conversation yet (for new chat)
  const availableConnections = (connections || []).filter(conn => {
    return !conversations.some(c => c.participants.includes(conn.userId));
  });

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.pageTitle}>Messages</h1>
          <button style={styles.newChatBtn} onClick={() => setShowNewChat(!showNewChat)}>
            <FiEdit size={20} color={colors.terracotta} />
          </button>
        </div>

        <div style={styles.searchBox}>
          <FiSearch size={18} color={colors.textMuted} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        {/* New Chat Picker */}
        {showNewChat && (
          <motion.div
            style={styles.newChatPanel}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <h3 style={styles.newChatTitle}>Start a new conversation</h3>
            {connections && connections.length > 0 ? (
              <div style={styles.connectionsList}>
                {connections.map(conn => (
                  <button
                    key={conn.userId}
                    style={styles.connectionItem}
                    onClick={() => startConversation(conn.userId)}
                  >
                    <div style={styles.avatar}>
                      {conn.photoURL ? (
                        <img src={conn.photoURL} alt="" style={styles.avatarImg} />
                      ) : (
                        (conn.name || 'U')[0]
                      )}
                    </div>
                    <span style={styles.connectionName}>{conn.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p style={styles.noConnections}>
                Connect with travelers first to start messaging
              </p>
            )}
          </motion.div>
        )}

        {/* Conversations List */}
        <div style={styles.list}>
          {filtered.map((conv, index) => {
            const other = getOtherUser(conv);
            const unread = getUnread(conv);
            return (
              <motion.div
                key={conv.id}
                style={styles.conversationWrapper}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                {deleteId === conv.id ? (
                  <div style={styles.deleteConfirm}>
                    <p style={styles.deleteText}>Delete this conversation?</p>
                    <div style={styles.deleteActions}>
                      <button
                        style={styles.deleteCancelBtn}
                        onClick={() => setDeleteId(null)}
                      >Cancel</button>
                      <button
                        style={styles.deleteConfirmBtn}
                        onClick={() => deleteConversation(conv.id)}
                      >Delete</button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={styles.conversation}
                    onClick={() => navigate(`/chat/${conv.id}`)}
                  >
                    <div style={styles.avatar}>
                      {other.photoURL ? (
                        <img src={other.photoURL} alt="" style={styles.avatarImg} />
                      ) : (
                        (other.name || 'U')[0]
                      )}
                      {unread > 0 && <div style={styles.onlineDot} />}
                    </div>

                    <div style={styles.convContent}>
                      <div style={styles.convHeader}>
                        <h3 style={{
                          ...styles.convName,
                          fontWeight: unread > 0 ? '700' : '600',
                        }}>{other.name}</h3>
                        <div style={styles.convHeaderRight}>
                          <span style={styles.convTime}>{formatTime(conv.lastMessageTime)}</span>
                          <button
                            style={styles.deleteBtn}
                            onClick={(e) => { e.stopPropagation(); setDeleteId(conv.id); }}
                          >
                            <FiTrash2 size={14} color={colors.textMuted} />
                          </button>
                        </div>
                      </div>
                      <div style={styles.convFooter}>
                        <p style={{
                          ...styles.lastMessage,
                          fontWeight: unread > 0 ? '600' : '400',
                          color: unread > 0 ? colors.text : colors.textSecondary,
                        }}>
                          {conv.lastSenderId === currentUser?.uid && conv.lastMessage ? 'You: ' : ''}
                          {conv.lastMessage || 'No messages yet'}
                        </p>
                        {unread > 0 && (
                          <div style={styles.unreadBadge}>{unread}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {conversations.length === 0 && !showNewChat && (
          <div style={styles.empty}>
            <h3 style={styles.emptyTitle}>No messages yet</h3>
            <p style={styles.emptyText}>
              Start connecting with travelers to begin messaging
            </p>
            <button
              style={styles.startBtn}
              onClick={() => setShowNewChat(true)}
            >
              Start a conversation
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    paddingBottom: '90px',
  },
  container: {
    padding: '0 24px 16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 0 0',
  },
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: '28px',
    fontWeight: '500',
    color: colors.text,
    margin: 0,
    letterSpacing: '-0.3px',
  },
  newChatBtn: {
    background: 'none',
    border: 'none',
    padding: '8px',
    cursor: 'pointer',
    borderRadius: '50%',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: colors.surface,
    padding: '12px 16px',
    borderRadius: radius.md,
    marginTop: '16px',
    marginBottom: '20px',
    border: `1px solid ${colors.border}`,
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: colors.text,
    background: 'transparent',
    fontFamily: 'inherit',
  },
  newChatPanel: {
    background: colors.surface,
    borderRadius: radius.md,
    padding: '16px',
    marginBottom: '20px',
    border: `1px solid ${colors.border}`,
    overflow: 'hidden',
  },
  newChatTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: colors.textMuted,
    margin: '0 0 12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  connectionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  connectionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px',
    background: 'none',
    border: 'none',
    borderRadius: radius.sm,
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
  },
  connectionName: {
    fontSize: '15px',
    fontWeight: '500',
    color: colors.text,
  },
  noConnections: {
    fontSize: '14px',
    color: colors.textMuted,
    margin: 0,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  conversationWrapper: {
    overflow: 'hidden',
  },
  conversation: {
    display: 'flex',
    gap: '14px',
    padding: '16px 0',
    borderBottom: `1px solid ${colors.border}`,
    cursor: 'pointer',
  },
  deleteConfirm: {
    padding: '16px 0',
    borderBottom: `1px solid ${colors.border}`,
    textAlign: 'center',
  },
  deleteText: {
    fontSize: '14px',
    color: colors.text,
    margin: '0 0 12px',
  },
  deleteActions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
  },
  deleteCancelBtn: {
    background: colors.warmGray,
    border: 'none',
    padding: '8px 20px',
    borderRadius: radius.sm,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: colors.textSecondary,
  },
  deleteConfirmBtn: {
    background: colors.error,
    border: 'none',
    padding: '8px 20px',
    borderRadius: radius.sm,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    color: '#fff',
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: colors.dark,
    color: colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    fontFamily: fonts.serif,
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '12px',
    height: '12px',
    background: colors.olive,
    border: `2.5px solid ${colors.bg}`,
    borderRadius: '50%',
  },
  convContent: {
    flex: 1,
    minWidth: 0,
  },
  convHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px',
  },
  convName: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
    margin: 0,
  },
  convHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  convTime: {
    fontSize: '12px',
    color: colors.textMuted,
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.6,
  },
  convFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: '14px',
    color: colors.textSecondary,
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  },
  unreadBadge: {
    background: colors.terracotta,
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '100px',
    minWidth: '20px',
    textAlign: 'center',
    marginLeft: '8px',
  },
  empty: {
    textAlign: 'center',
    padding: '80px 20px 60px',
  },
  emptyTitle: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '12px',
    letterSpacing: '-0.3px',
  },
  emptyText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.7,
    maxWidth: '260px',
    margin: '0 auto 28px',
  },
  startBtn: {
    background: colors.terracotta,
    color: '#0a0a0a',
    border: 'none',
    padding: '14px 28px',
    borderRadius: radius.md,
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

export default Messages;
