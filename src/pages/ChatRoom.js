import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiSend, FiTrash2, FiX, FiMessageCircle, FiCamera } from 'react-icons/fi';
import { useUser } from '../context/UserContext';
import { db, auth } from '../firebase';
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
          <FiArrowLeft size={22} color="#1f2937" />
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
                    color: isMine ? '#fff' : '#1f2937',
                  }}>{msg.text}</p>
                  <div style={styles.bubbleFooter}>
                    <span style={{
                      ...styles.bubbleTime,
                      color: isMine ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                    }}>{formatTime(msg.createdAt)}</span>
                    {isMine && selectedMsg === msg.id && (
                      <button
                        style={styles.msgDeleteBtn}
                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                      >
                        <FiTrash2 size={12} color={isMine ? 'rgba(255,255,255,0.8)' : '#ef4444'} />
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
            <FiSend size={18} color="#fff" />
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
              <FiX size={20} />
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
              {otherUser.gender && (
                <div style={styles.profileGender}>{otherUser.gender}</div>
              )}

              {otherUser.bio && (
                <div style={styles.bioSection}>"{otherUser.bio}"</div>
              )}

              {otherUser.upcomingTrips?.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>UPCOMING TRIPS:</div>
                  {otherUser.upcomingTrips.map((trip, i) => (
                    <div key={i} style={styles.tripInfo}>
                      {trip.destination}
                    </div>
                  ))}
                </>
              )}

              {otherUser.interests?.length > 0 && (
                <>
                  <div style={styles.sectionTitle}>INTERESTS:</div>
                  <div style={styles.interestsList}>
                    {otherUser.interests.map((interest, i) => (
                      <div key={i} style={styles.interestTag}>{interest}</div>
                    ))}
                  </div>
                </>
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
    background: '#f5f3f0',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#fff',
    borderBottom: '1px solid #e8e5e0',
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
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '700',
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
    color: '#1f2937',
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
    color: '#9ca3af',
    fontSize: '14px',
  },
  dateDivider: {
    textAlign: 'center',
    margin: '16px 0 8px',
  },
  dateDividerText: {
    fontSize: '12px',
    color: '#9ca3af',
    background: '#eae8e4',
    padding: '4px 12px',
    borderRadius: '12px',
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
    background: '#047857',
    borderBottomRightRadius: '4px',
  },
  bubbleTheirs: {
    background: '#fff',
    borderBottomLeftRadius: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
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
    background: '#fff',
    borderTop: '1px solid #e8e5e0',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    position: 'sticky',
    bottom: 0,
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '8px',
    background: '#f5f3f0',
    borderRadius: '24px',
    padding: '6px 6px 6px 16px',
  },
  textInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: '15px',
    color: '#1f2937',
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
    background: '#047857',
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
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    background: '#fff',
    borderRadius: '20px',
    padding: '24px',
    maxWidth: '90%',
    width: '400px',
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 8px 16px rgba(0,0,0,0.06), 0 20px 40px rgba(0,0,0,0.1)',
  },
  modalClose: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#a3a3a3',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    zIndex: 10,
  },
  largePhotoContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  largePhoto: {
    width: '250px',
    height: '250px',
    borderRadius: '16px',
    objectFit: 'cover',
  },
  largeAvatarPlaceholder: {
    width: '250px',
    height: '250px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #047857, #059669)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '80px',
    fontWeight: '700',
  },
  profileInfo: {
    textAlign: 'center',
  },
  profileName: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#1a1a1a',
    marginBottom: '4px',
  },
  profileGender: {
    fontSize: '14px',
    color: '#6b6b6b',
    marginBottom: '16px',
  },
  bioSection: {
    fontSize: '14px',
    color: '#4b5563',
    fontStyle: 'italic',
    lineHeight: 1.6,
    marginBottom: '20px',
    padding: '12px',
    background: '#faf9f7',
    borderRadius: '8px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '800',
    color: '#6b7280',
    letterSpacing: '0.5px',
    marginBottom: '8px',
    marginTop: '16px',
    textAlign: 'left',
  },
  tripInfo: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'left',
    marginBottom: '4px',
  },
  interestsList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'flex-start',
    marginBottom: '20px',
  },
  interestTag: {
    padding: '6px 12px',
    background: '#f0f9f4',
    color: '#047857',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
  },
  contactButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '16px',
  },
  contactButton: {
    flex: 1,
    padding: '14px 24px',
    background: '#f0f9f4',
    color: '#047857',
    border: 'none',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default ChatRoom;
