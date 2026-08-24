import React from 'react';
import { Link } from 'react-router-dom';
import { colors, fonts, radius } from '../design';
import BLOG_POSTS from '../data/blog';

function Blog() {
  const featured = BLOG_POSTS[0];
  const rest = BLOG_POSTS.slice(1);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <Link to="/" style={styles.wordmark}>RIHLAH</Link>
        <nav style={styles.nav}>
          <Link to="/about" style={styles.navLink}>About</Link>
          <Link to="/destinations" style={styles.navLink}>Destinations</Link>
        </nav>
      </header>

      <div style={styles.container}>
        {/* Page title */}
        <div style={styles.titleSection}>
          <h1 style={styles.pageTitle}>Journal</h1>
          <p style={styles.pageSubtitle}>Stories, guides, and perspectives from the community.</p>
        </div>

        {/* Featured post */}
        {featured && (
          <Link to={`/blog/${featured.slug}`} style={styles.featuredCard}>
            <div style={styles.featuredCategory}>{featured.category}</div>
            <h2 style={styles.featuredTitle}>{featured.title}</h2>
            <p style={styles.featuredSubtitle}>{featured.subtitle}</p>
            <div style={styles.featuredMeta}>
              <span>{featured.author}</span>
              <span style={styles.metaDot} />
              <span>{formatDate(featured.date)}</span>
              <span style={styles.metaDot} />
              <span>{featured.readTime}</span>
            </div>
          </Link>
        )}

        {/* Post list */}
        <div style={styles.list}>
          {rest.map((post) => (
            <Link key={post.slug} to={`/blog/${post.slug}`} style={styles.postCard}>
              <div style={styles.postContent}>
                <div style={styles.postCategory}>{post.category}</div>
                <h3 style={styles.postTitle}>{post.title}</h3>
                <p style={styles.postSubtitle}>{post.subtitle}</p>
                <div style={styles.postMeta}>
                  <span>{post.author}</span>
                  <span style={styles.metaDot} />
                  <span>{formatDate(post.date)}</span>
                  <span style={styles.metaDot} />
                  <span>{post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerWordmark}>RIHLAH</div>
          <div style={styles.footerCopy}>Travel with your people.</div>
        </div>
      </footer>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
  },

  // Header
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px 32px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  wordmark: {
    fontFamily: fonts.serif,
    fontSize: '18px',
    fontWeight: '600',
    letterSpacing: '3px',
    color: colors.text,
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '24px',
  },
  navLink: {
    fontSize: '14px',
    color: colors.textSecondary,
    textDecoration: 'none',
  },

  // Title
  container: {
    maxWidth: '720px',
    margin: '0 auto',
    padding: '0 24px 80px',
  },
  titleSection: {
    padding: '40px 0 48px',
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: '48px',
  },
  pageTitle: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(36px, 6vw, 52px)',
    fontWeight: '400',
    color: colors.text,
    margin: '0 0 12px',
    letterSpacing: '-1px',
  },
  pageSubtitle: {
    fontSize: '16px',
    color: colors.textSecondary,
    margin: 0,
    lineHeight: 1.6,
  },

  // Featured
  featuredCard: {
    display: 'block',
    textDecoration: 'none',
    paddingBottom: '48px',
    marginBottom: '40px',
    borderBottom: `1px solid ${colors.border}`,
  },
  featuredCategory: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.terracotta,
    marginBottom: '16px',
  },
  featuredTitle: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(28px, 4vw, 38px)',
    fontWeight: '400',
    color: colors.text,
    margin: '0 0 12px',
    letterSpacing: '-0.5px',
    lineHeight: 1.15,
  },
  featuredSubtitle: {
    fontSize: '17px',
    color: colors.textSecondary,
    margin: '0 0 20px',
    lineHeight: 1.7,
  },
  featuredMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: colors.textTertiary,
  },

  // Post list
  list: {
    display: 'flex',
    flexDirection: 'column',
  },
  postCard: {
    display: 'block',
    textDecoration: 'none',
    padding: '32px 0',
    borderBottom: `1px solid ${colors.border}`,
  },
  postContent: {},
  postCategory: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.terracotta,
    marginBottom: '10px',
  },
  postTitle: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '400',
    color: colors.text,
    margin: '0 0 8px',
    letterSpacing: '-0.3px',
    lineHeight: 1.25,
  },
  postSubtitle: {
    fontSize: '15px',
    color: colors.textSecondary,
    margin: '0 0 14px',
    lineHeight: 1.6,
  },
  postMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: colors.textTertiary,
  },

  // Shared
  metaDot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: colors.textMuted,
  },

  // Footer
  footer: {
    borderTop: `1px solid ${colors.border}`,
    padding: '48px 24px',
  },
  footerInner: {
    maxWidth: '720px',
    margin: '0 auto',
    textAlign: 'center',
  },
  footerWordmark: {
    fontFamily: fonts.serif,
    fontSize: '16px',
    fontWeight: '600',
    letterSpacing: '3px',
    color: colors.textTertiary,
    marginBottom: '8px',
  },
  footerCopy: {
    fontSize: '13px',
    color: colors.textMuted,
    fontStyle: 'italic',
  },
};

export default Blog;
