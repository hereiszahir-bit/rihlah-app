import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

function DateRangePicker({ onSelect }) {
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
      key: 'selection'
    }
  ]);

  const handleSelect = (ranges) => {
    setRange([ranges.selection]);
    if (onSelect) {
      onSelect(ranges.selection);
    }
  };

  const setQuickDate = (days) => {
    const start = new Date();
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
    handleSelect({ selection: { startDate: start, endDate: end, key: 'selection' }});
  };

  return (
    <div style={styles.container}>
      <DateRange
        ranges={range}
        onChange={handleSelect}
        months={1}
        direction="vertical"
        showDateDisplay={false}
        minDate={new Date()}
        rangeColors={['#059669']}
      />
      
      <div style={styles.quickPicks}>
        <button style={styles.quickBtn} onClick={() => setQuickDate(7)}>
          1 week
        </button>
        <button style={styles.quickBtn} onClick={() => setQuickDate(14)}>
          2 weeks
        </button>
        <button style={styles.quickBtn} onClick={() => setQuickDate(30)}>
          1 month
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    background: '#fff',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  quickPicks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px',
    padding: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  quickBtn: {
    padding: '12px',
    background: '#f0fdf4',
    color: '#059669',
    border: '2px solid #059669',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default DateRangePicker;