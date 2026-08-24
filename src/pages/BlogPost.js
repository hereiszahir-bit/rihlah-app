import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { colors, fonts, radius } from '../design';
import BLOG_POSTS from '../data/blog';

function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const post = BLOG_POSTS.find(p => p.slug === slug);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  if (!post) {
    return (
      <div style={styles.page}>
        <div style={styles.notFound}>
          <h1 style={styles.notFoundTitle}>Post not found</h1>
          <Link to="/blog" style={styles.backLink}>Back to Journal</Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Find adjacent posts for navigation
  const currentIndex = BLOG_POSTS.findIndex(p => p.slug === slug);
  const nextPost = currentIndex < BLOG_POSTS.length - 1 ? BLOG_POSTS[currentIndex + 1] : null;
  const prevPost = currentIndex > 0 ? BLOG_POSTS[currentIndex - 1] : null;

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <Link to="/" style={styles.wordmark}>RIHLAH</Link>
        <Link to="/blog" style={styles.journalLink}>Journal</Link>
      </header>

      <article style={styles.article}>
        {/* Article header */}
        <div style={styles.articleHeader}>
          <div style={styles.category}>{post.category}</div>
          <h1 style={styles.title}>{post.title}</h1>
          <p style={styles.subtitle}>{post.subtitle}</p>
          <div style={styles.meta}>
            <span>{post.author}</span>
            <span style={styles.metaDot} />
            <span>{formatDate(post.date)}</span>
            <span style={styles.metaDot} />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* Body */}
        <div style={styles.body}>
          {post.body.map((block, i) => {
            if (block.type === 'heading') {
              return <h2 key={i} style={styles.bodyHeading}>{block.content}</h2>;
            }
            if (block.type === 'pullquote') {
              return <blockquote key={i} style={styles.pullquote}>{block.content}</blockquote>;
            }
            if (block.type === 'short') {
              return <p key={i} style={styles.shortText}>{block.content}</p>;
            }
            if (block.type === 'break') {
              return <div key={i} style={styles.sectionBreak}><span style={styles.breakMark}>*</span></div>;
            }
            if (block.type === 'note') {
              return <div key={i} style={styles.note}>{block.content}</div>;
            }
            return <p key={i} style={styles.bodyText}>{block.content}</p>;
          })}
        </div>

        {/* Post navigation */}
        <div style={styles.postNav}>
          {prevPost ? (
            <Link to={`/blog/${prevPost.slug}`} style={styles.postNavLink}>
              <div style={styles.postNavLabel}>Previous</div>
              <div style={styles.postNavTitle}>{prevPost.title}</div>
            </Link>
          ) : <div />}
          {nextPost ? (
            <Link to={`/blog/${nextPost.slug}`} style={{ ...styles.postNavLink, textAlign: 'right' }}>
              <div style={styles.postNavLabel}>Next</div>
              <div style={styles.postNavTitle}>{nextPost.title}</div>
            </Link>
          ) : <div />}
        </div>
      </article>

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
  journalLink: {
    fontSize: '14px',
    color: colors.textSecondary,
    textDecoration: 'none',
  },

  // Article
  article: {
    maxWidth: '640px',
    margin: '0 auto',
    padding: '0 24px 80px',
  },

  // Article header
  articleHeader: {
    padding: '32px 0 0',
  },
  category: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.terracotta,
    marginBottom: '20px',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(30px, 5vw, 42px)',
    fontWeight: '400',
    color: colors.text,
    margin: '0 0 16px',
    letterSpacing: '-0.5px',
    lineHeight: 1.15,
  },
  subtitle: {
    fontSize: '18px',
    color: colors.textSecondary,
    margin: '0 0 24px',
    lineHeight: 1.7,
    fontStyle: 'italic',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: colors.textTertiary,
  },
  metaDot: {
    width: '3px',
    height: '3px',
    borderRadius: '50%',
    background: colors.textMuted,
  },

  // Divider
  divider: {
    height: '1px',
    background: colors.border,
    margin: '40px 0',
  },

  // Body
  body: {},
  bodyHeading: {
    fontFamily: fonts.serif,
    fontSize: '22px',
    fontWeight: '400',
    color: colors.text,
    margin: '48px 0 16px',
    letterSpacing: '-0.3px',
  },
  bodyText: {
    fontSize: '17px',
    lineHeight: 1.85,
    color: colors.textSecondary,
    margin: '0 0 24px',
  },
  pullquote: {
    fontFamily: fonts.serif,
    fontSize: 'clamp(22px, 3.5vw, 28px)',
    fontWeight: '400',
    color: colors.text,
    lineHeight: 1.45,
    margin: '48px 0',
    padding: '0 0 0 24px',
    borderLeft: `2px solid ${colors.terracotta}`,
    fontStyle: 'italic',
  },
  shortText: {
    fontSize: '17px',
    lineHeight: 1.85,
    color: colors.text,
    margin: '0 0 12px',
    fontWeight: '500',
  },
  sectionBreak: {
    textAlign: 'center',
    margin: '48px 0',
    color: colors.textMuted,
  },
  breakMark: {
    fontSize: '18px',
    letterSpacing: '12px',
  },
  note: {
    fontSize: '14px',
    lineHeight: 1.7,
    color: colors.textTertiary,
    padding: '16px 20px',
    background: colors.surface,
    borderRadius: radius.sm,
    margin: '0 0 24px',
    border: `1px solid ${colors.border}`,
  },

  // Post navigation
  postNav: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '24px',
    borderTop: `1px solid ${colors.border}`,
    marginTop: '56px',
    paddingTop: '32px',
  },
  postNavLink: {
    textDecoration: 'none',
    flex: 1,
  },
  postNavLabel: {
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    color: colors.textMuted,
    marginBottom: '8px',
  },
  postNavTitle: {
    fontFamily: fonts.serif,
    fontSize: '16px',
    fontWeight: '400',
    color: colors.text,
    lineHeight: 1.35,
  },

  // Not found
  notFound: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    textAlign: 'center',
    padding: '40px 24px',
  },
  notFoundTitle: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    fontWeight: '400',
    color: colors.text,
    marginBottom: '16px',
  },
  backLink: {
    fontSize: '14px',
    color: colors.terracotta,
    textDecoration: 'none',
  },

  // Footer
  footer: {
    borderTop: `1px solid ${colors.border}`,
    padding: '48px 24px',
  },
  footerInner: {
    maxWidth: '640px',
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

export default BlogPost;
