import React, { useState, useRef, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import app from '../firebase';
import { colors, fonts, radius } from '../design';
import { FiSend, FiX, FiMessageCircle } from 'react-icons/fi';

const functions = getFunctions(app);
const aiConcierge = httpsCallable(functions, 'aiConcierge');

function AIConcierge({ cityGuideData, prayerTimes, crewContext, userContext, destCity }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const hasCrew = crewContext?.count > 0;
  const quickPrompts = hasCrew ? [
    `Plan a day for our crew in ${destCity}`,
    'What should our group do together?',
    'Where should we eat as a group?',
    'Where do I pray?',
  ] : [
    `Plan my first day in ${destCity}`,
    'Where should I eat tonight?',
    'Where do I pray?',
    `What should I not miss in ${destCity}?`,
  ];

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const result = await aiConcierge({
        messages: newMessages,
        cityGuideData,
        prayerTimes,
        crewContext,
        userContext,
      });
      setMessages([...newMessages, { role: 'assistant', content: result.data.response }]);
    } catch (error) {
      console.error('AI Concierge error:', error.code, error.message, error.details);
      const errMsg = error.code === 'unauthenticated'
        ? 'Please sign in to use the concierge.'
        : 'Something went wrong. Try again in a moment.';
      setMessages([
        ...newMessages,
        { role: 'assistant', content: errMsg },
      ]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <button style={styles.fab} onClick={() => setOpen(true)}>
        <FiMessageCircle size={22} />
        <span style={styles.fabLabel}>Plan with AI</span>
      </button>
    );
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.headerTitle}>Rihlah Concierge</div>
            <div style={styles.headerSub}>{destCity} travel intelligence</div>
          </div>
          <button style={styles.closeBtn} onClick={() => setOpen(false)}>
            <FiX size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={styles.messagesWrap} ref={scrollRef}>
          {messages.length === 0 && (
            <div style={styles.welcome}>
              <div style={styles.welcomeTitle}>Your {destCity} concierge</div>
              <div style={styles.welcomeText}>
                I know the neighborhoods, the dining, the mosques, and the timing.
                Ask me anything about your trip.
              </div>
              <div style={styles.quickPrompts}>
                {quickPrompts.map((q, i) => (
                  <button
                    key={i}
                    style={styles.quickPrompt}
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={msg.role === 'user' ? styles.userMsg : styles.aiMsg}
            >
              <div style={msg.role === 'user' ? styles.userBubble : styles.aiBubble}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.aiMsg}>
              <div style={styles.aiBubble}>
                <span style={styles.typing}>Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={styles.inputWrap}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask about ${destCity}...`}
            style={styles.input}
            disabled={loading}
          />
          <button
            style={{ ...styles.sendBtn, opacity: input.trim() && !loading ? 1 : 0.3 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <FiSend size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  // FAB
  fab: {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '14px 20px',
    background: colors.dark,
    color: colors.cream,
    border: 'none',
    borderRadius: radius.full,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    zIndex: 100,
  },
  fabLabel: {
    fontSize: '14px',
    fontWeight: '600',
  },

  // Panel
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: colors.bg,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
  },
  panel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
    minHeight: 0,
    overflow: 'hidden',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: `1px solid ${colors.border}`,
    background: colors.surface,
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: fonts.serif,
    fontSize: '18px',
    fontWeight: '600',
    color: colors.text,
  },
  headerSub: {
    fontSize: '12px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  closeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: colors.lightGray,
    border: 'none',
    color: colors.text,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesWrap: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '20px',
    WebkitOverflowScrolling: 'touch',
  },

  // Welcome
  welcome: {
    textAlign: 'center',
    padding: '40px 16px 20px',
  },
  welcomeTitle: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '8px',
  },
  welcomeText: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginBottom: '24px',
    maxWidth: '320px',
    margin: '0 auto 24px',
  },
  quickPrompts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  quickPrompt: {
    padding: '14px 18px',
    background: colors.surface,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '500',
    color: colors.text,
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'left',
  },

  // Bubbles
  userMsg: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '12px',
  },
  aiMsg: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '12px',
  },
  userBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    background: colors.dark,
    color: colors.cream,
    borderRadius: '18px 18px 4px 18px',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  aiBubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    color: colors.text,
    borderRadius: '18px 18px 18px 4px',
    fontSize: '14px',
    lineHeight: 1.6,
  },
  typing: {
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  // Input
  inputWrap: {
    display: 'flex',
    gap: '8px',
    padding: '12px 16px',
    borderTop: `1px solid ${colors.border}`,
    background: colors.surface,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    background: colors.bg,
    border: `1.5px solid ${colors.border}`,
    borderRadius: radius.full,
    fontSize: '14px',
    fontWeight: '500',
    color: colors.text,
    fontFamily: fonts.sans,
    outline: 'none',
  },
  sendBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: colors.dark,
    color: colors.cream,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};

export default AIConcierge;
