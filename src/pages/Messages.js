import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import TabBar from '../components/TabBar';

function Messages() {
  const [conversations] = useState([
    {
      id: 1,
      name: 'Sarah Ahmed',
      lastMessage: "Let's meet at the Blue Mosque!",
      time: '2m ago',
      unread: 2,
      avatar: 'S'
    },
    {
      id: 2,
      name: 'Omar Hassan',
      lastMessage: 'Thanks for the recommendation!',
      time: '1h ago',
      unread: 0,
      avatar: 'O'
    },
    {
      id: 3,
      name: 'Layla Ibrahim',
      lastMessage: 'When are you arriving?',
      time: '3h ago',
      unread: 1,
      avatar: 'L'
    },
  ]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Messages</h1>
        </div>

        {/* Search */}
        <div style={styles.searchBox}>
          <FiSearch size={20} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search conversations..."
            style={styles.searchInput}
          />
        </div>

        {/* Conversations List */}
        <div style={styles.list}>
          {conversations.map((conv, index) => (
            <motion.div
              key={conv.id}
              style={styles.conversation}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div style={styles.avatar}>
                {conv.avatar}
                {conv.unread > 0 && (
                  <div style={styles.onlineDot} />
                )}
              </div>

              <div style={styles.convContent}>
                <div style={styles.convHeader}>
                  <h3 style={styles.convName}>{conv.name}</h3>
                  <span style={styles.convTime}>{conv.time}</span>
                </div>
                <div style={styles.convFooter}>
                  <p style={styles.lastMessage}>{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <div style={styles.unreadBadge}>{conv.unread}</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty State (show when no conversations) */}
        {conversations.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyIcon}>💬</div>
            <h3 style={styles.emptyTitle}>No messages yet</h3>
            <p style={styles.emptyText}>
              Start connecting with travelers in your area!
            </p>
          </div>
        )}
      </div>

      <TabBar />
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#fafafa',
    paddingBottom: '80px',
  },
  container: {
    padding: '20px 16px',
  },
  header: {
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: '#fff',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#1f2937',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  conversation: {
    display: 'flex',
    gap: '12px',
    background: '#fff',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    cursor: 'pointer',
  },
  avatar: {
    width: '52px',
    height: '52px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #059669, #10b981)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '700',
    flexShrink: 0,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: '12px',
    height: '12px',
    background: '#10b981',
    border: '2px solid #fff',
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
    color: '#1f2937',
    margin: 0,
  },
  convTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  convFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  unreadBadge: {
    background: '#059669',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '100px',
    minWidth: '20px',
    textAlign: 'center',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 24px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '15px',
    color: '#6b7280',
  },
};

export default Messages;