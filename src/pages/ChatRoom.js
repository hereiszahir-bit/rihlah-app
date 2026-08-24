import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSend, FiTrash2, FiX, FiMessageCircle, FiCamera } from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { db, auth } from '../firebase';
import { colors, fonts, radius, components, type } from '../design';
import {
  collection, query, orderBy, onSnapshot, addDoc, doc, getDoc,
  serverTimestamp, updateDoc, deleteDoc
} from 'firebase/firestore';

function ChatRoom() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { currentUser, allUsers, connections } = useUser();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [sending, setSending] = useState(false);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load conversation metadata to find the other user
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const convRef = doc(db, 'conversations', conversationId);
    const unsub = onSnapshot(convRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      const otherUid = data.participants.find(p => p !== currentUser.uid);
      const found = allUsers.find(u => u.id === otherUid);
      // Merge contact info from connection record (allUsers no longer includes PII)
      const connRecord = connections.find(c => c.userId === otherUid);
      const merged = found
        ? { ...found, whatsapp: connRecord?.whatsapp, instagram: connRecord?.instagram }
        : { id: otherUid, name: 'User' };
      setOtherUser(merged);
    });

    return unsub;
  }, [conversationId, currentUser, allUsers, connections]);

  // Real-time messages listener
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = [];
      snapshot.forEach(docSnap => {
        msgs.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(msgs);
    });

    return unsub;
  }, [conversationId]);

  // Mark conversation as read when viewing
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const markRead = async () => {
      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        [`unread_${currentUser.uid}`]: 0
      });
    };
    markRead();
  }, [conversationId, currentUser, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    setNewMessage('');

    try {
      // Add message to subcollection
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId: currentUser.uid,
        text,
        createdAt: serverTimestamp(),
      });

      // Update conversation metadata
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);
      const convData = convSnap.data();
      const otherUid = convData.participants.find(p => p !== currentUser.uid);

      await updateDoc(convRef, {
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastSenderId: currentUser.uid,
        [`unread_${otherUid}`]: (convData[`unread_${otherUid}`] || 0) + 1,
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const handleDeleteMessage = async (msgId) => {
    try {
      await deleteDoc(doc(db, 'conversations', conversationId, 'messages', msgId));
      setSelectedMsg(null);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateDivider = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const shouldShowDateDivider = (msg, index) => {
    if (index === 0) return true;
    const prev = messages[index - 1];
    if (!msg.createdAt || !prev.createdAt) return false;
    const d1 = (msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt)).toDateString();
    const d2 = (prev.createdAt.toDate ? prev.createdAt.toDate() : new Date(prev.createdAt)).toDateString();
    return d1 !== d2;
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={() => navigate('/messages')}>
          <FiArrowLeft size={22} color={colors.text} />
        </button>
        <div style={styles.headerClickable} onClick={() => otherUser && setShowProfile(true)}>
          <div style={styles.headerAvatar}>
            {otherUser?.photoURL ? (
              <img src={otherUser.photoURL} alt="" style={styles.headerAvatarImg} />
            ) : (
              <span>{(otherUser?.name || 'U')[0]}</span>
            )}
          </div>
          <h2 style={styles.headerName}>{otherUser?.name || 'Loading...'}</h2>
        </div>
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.emptyChat}>
            <p style={styles.emptyChatText}>Send a message to start the conversation</p>
          </div>
        )}
        {messages.map((msg, index) => {
          const isMine = msg.senderId === currentUser?.uid;
          return (
            <React.Fragment key={msg.id}>
              {shouldShowDateDivider(msg, index) && (
                <div style={styles.dateDivider}>
                  <span style={styles.dateDividerText}>{formatDateDivider(msg.createdAt)}</span>
                </div>
              )}
              <motion.div
                style={{
                  ...styles.messageBubbleRow,
                  justifyContent: isMine ? 'flex-end' : 'flex-start',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div
                  style={{
                    ...styles.bubble,
                    ...(isMine ? styles.bubbleMine : styles.bubbleTheirs),
                  }}
                  onClick={() => isMine && setSelectedMsg(selectedMsg === msg.id ? null : msg.id)}
                >
                  <p style={{
                    ...styles.bubbleText,
                    color: isMine ? '#0a0a0a' : colors.text,
                  }}>{msg.text}</p>
                  <div style={styles.bubbleFooter}>
                    <span style={{
                      ...styles.bubbleTime,
                      color: isMine ? 'rgba(10,10,10,0.5)' : colors.textMuted,
                    }}>{formatTime(msg.createdAt)}</span>
                    {isMine && selectedMsg === msg.id && (
                      <button
                        style={styles.msgDeleteBtn}
                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                      >
                        <FiTrash2 size={12} color={isMine ? 'rgba(10,10,10,0.6)' : colors.error} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </React.Fragment>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputBar}>
        <div style={styles.inputWrapper}>
          <textarea
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            style={styles.textInput}
            rows={1}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: newMessage.trim() ? 1 : 0.4,
            }}
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            <FiSend size={18} color="#0a0a0a" />
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && otherUser && (
        <div style={styles.modalOverlay} onClick={() => setShowProfile(false)}>
          <motion.div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <button style={styles.modalClose} onClick={() => setShowProfile(false)}>
              <FiX size={18} />
            </button>

            <div style={styles.largePhotoContainer}>
              {otherUser.photoURL ? (
                <img src={otherUser.photoURL} alt={otherUser.name} style={styles.largePhoto} />
              ) : (
                <div style={styles.largeAvatarPlaceholder}>
                  {(otherUser.name || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            <div style={styles.profileInfo}>
              <div style={styles.profileName}>
                {otherUser.name}{otherUser.age ? `, ${otherUser.age}` : ''}
              </div>

              {otherUser.bio && (
                <div style={styles.bioSection}>{otherUser.bio}</div>
              )}

              {otherUser.interests?.length > 0 && (
                <div style={styles.interestsList}>
                  {otherUser.interests.map((interest, i) => (
                    <span key={i} style={styles.interestTag}>{interest}</span>
                  ))}
                </div>
              )}

              {otherUser.upcomingTrips?.length > 0 && (
                <div style={styles.tripsSection}>
                  <div style={styles.sectionTitle}>Journeys</div>
                  {otherUser.upcomingTrips.map((trip, i) => (
                    <div key={i} style={styles.tripItem}>
                      <div style={styles.tripDest}>{trip.destination.split(',')[0]}</div>
                      <div style={styles.tripDates}>
                        {new Date(trip.startDate.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(trip.endDate.replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.contactButtons}>
                {otherUser.whatsapp && (
                  <button
                    style={styles.contactButton}
                    onClick={() => window.open(`https://wa.me/${otherUser.whatsapp.replace(/\D/g, '')}`, '_blank')}
                  >
                    <FiMessageCircle size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> WhatsApp
                  </button>
                )}
                {otherUser.instagram && (
                  <button
                    style={styles.contactButton}
                    onClick={() => window.open(`https://instagram.com/${otherUser.instagram.replace('@', '')}`, '_blank')}
                  >
                    <FiCamera size={14} style={{ marginRight: '4px', verticalAlign: '-2px' }} /> Instagram
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: colors.surface,
    borderBottom: `1px solid ${colors.border}`,
    position: 'sticky',
    top: 0,
    zIndex: 10,
    paddingTop: 'max(12px, env(safe-area-inset-top))',
  },
  headerClickable: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    flex: 1,
  },
  backBtn: {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  headerAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: colors.dark,
    color: colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: fonts.serif,
    flexShrink: 0,
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerName: {
    fontSize: '16px',
    fontWeight: '600',
    color: colors.text,
    margin: 0,
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  emptyChat: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
  },
  emptyChatText: {
    color: colors.textMuted,
    fontSize: '14px',
  },
  dateDivider: {
    textAlign: 'center',
    margin: '16px 0 8px',
  },
  dateDividerText: {
    fontSize: '11px',
    color: colors.textMuted,
    background: colors.warmGray,
    padding: '4px 12px',
    borderRadius: '12px',
    letterSpacing: '0.3px',
  },
  messageBubbleRow: {
    display: 'flex',
    marginBottom: '2px',
  },
  bubble: {
    maxWidth: '75%',
    padding: '10px 14px',
    borderRadius: '18px',
  },
  bubbleMine: {
    background: colors.terracotta,
    borderBottomRightRadius: '4px',
  },
  bubbleTheirs: {
    background: colors.surface,
    borderBottomLeftRadius: '4px',
    border: `1px solid ${colors.border}`,
  },
  bubbleText: {
    fontSize: '15px',
    lineHeight: '1.4',
    margin: 0,
    wordBreak: 'break-word',
  },
  bubbleFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  bubbleTime: {
    fontSize: '11px',
  },
  msgDeleteBtn: {
    background: 'none',
    border: 'none',
    padding: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  inputBar: {
    padding: '8px 12px',
    background: colors.surface,
    borderTop: `1px solid ${colors.border}`,
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    position: 'sticky',
    bottom: 0,
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    background: colors.bg,
    borderRadius: '24px',
    padding: '6px 6px 6px 16px',
    border: `1px solid ${colors.border}`,
  },
  textInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '15px',
    color: colors.text,
    resize: 'none',
    maxHeight: '100px',
    lineHeight: '1.4',
    padding: '6px 0',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: colors.terracotta,
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modalContent: {
    background: colors.surface,
    borderRadius: radius.lg,
    padding: '32px 24px 24px',
    maxWidth: '380px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
    textAlign: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: '14px',
    right: '14px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: colors.warmGray,
    border: 'none',
    color: colors.textSecondary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  largePhotoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  largePhoto: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: `3px solid ${colors.warmGray}`,
  },
  largeAvatarPlaceholder: {
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    background: colors.dark,
    color: colors.gold,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '600',
    fontFamily: fonts.serif,
  },
  profileInfo: {
    textAlign: 'center',
  },
  profileName: {
    fontFamily: fonts.serif,
    fontSize: '20px',
    fontWeight: '500',
    color: colors.text,
    marginBottom: '4px',
  },
  bioSection: {
    fontSize: '14px',
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 1.6,
    margin: '8px 0 16px',
    padding: '0 8px',
  },
  interestsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  interestTag: {
    ...components.pill,
  },
  tripsSection: {
    textAlign: 'left',
    marginBottom: '16px',
  },
  sectionTitle: {
    ...type.label,
    marginBottom: '10px',
  },
  tripItem: {
    padding: '10px 12px',
    background: colors.bg,
    borderRadius: radius.sm,
    marginBottom: '6px',
  },
  tripDest: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text,
  },
  tripDates: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  contactButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  contactButton: {
    flex: 1,
    padding: '12px 16px',
    background: colors.warmGray,
    color: colors.text,
    border: 'none',
    borderRadius: radius.sm,
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default ChatRoom;
