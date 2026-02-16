import React from 'react';

function FilterBar({ filters, onFilterChange }) {
  const ageRanges = [
    { value: 'all', label: 'All Ages' },
    { value: '18-25', label: '18-25' },
    { value: '26-35', label: '26-35' },
    { value: '36-45', label: '36-45' },
    { value: '46+', label: '46+' },
  ];

  const genders = [
    { value: 'all', label: 'All' },
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

const travelStyles = [
  { value: 'all', label: 'All' },
  { value: 'food', label: '🍽️ Foodie', icon: '🍽️' },
  { value: 'history', label: '🏛️ History', icon: '🏛️' },
  { value: 'photography', label: '📸 Photography', icon: '📸' },
  { value: 'adventure', label: '⛰️ Adventure', icon: '⛰️' },
  { value: 'art', label: '🎨 Art', icon: '🎨' },
  { value: 'shopping', label: '🛍️ Shopping', icon: '🛍️' },
  { value: 'nature', label: '🌿 Nature', icon: '🌿' },
  { value: 'relaxation', label: '🧘 Relaxation', icon: '🧘' },
];

  return (
    <div style={styles.container}>
      {/* Age Filter */}
      <div style={styles.filterGroup}>
        <label style={styles.label}>Age</label>
        <select
          style={styles.select}
          value={filters.age}
          onChange={(e) => onFilterChange('age', e.target.value)}
        >
          {ageRanges.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      {/* Gender Filter */}
      <div style={styles.filterGroup}>
        <label style={styles.label}>Gender</label>
        <select
          style={styles.select}
          value={filters.gender}
          onChange={(e) => onFilterChange('gender', e.target.value)}
        >
          {genders.map((gender) => (
            <option key={gender.value} value={gender.value}>
              {gender.label}
            </option>
          ))}
        </select>
      </div>

      {/* Travel Style Tags */}
      <div style={styles.tagsContainer}>
        <label style={styles.label}>Travel Style</label>
        <div style={styles.tags}>
          {travelStyles.map((style) => (
            <button
              key={style.value}
              style={{
                ...styles.tag,
                ...(filters.travelStyle === style.value ? styles.tagActive : {})
              }}
              onClick={() => onFilterChange('travelStyle', style.value)}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.age !== 'all' || filters.gender !== 'all' || filters.travelStyle !== 'all') && (
        <button style={styles.clearBtn} onClick={() => onFilterChange('clear', null)}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  filterGroup: {
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '6px',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '15px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    background: '#fff',
    color: '#1f2937',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  tagsContainer: {
    marginBottom: '12px',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  tag: {
    padding: '8px 14px',
    background: '#fff',
    border: '2px solid #e5e7eb',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tagActive: {
    background: '#059669',
    borderColor: '#059669',
    color: '#fff',
  },
  clearBtn: {
    width: '100%',
    padding: '10px',
    background: '#fff',
    border: '2px solid #059669',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#059669',
    cursor: 'pointer',
    marginTop: '4px',
  },
};

export default FilterBar;