import React, { useState } from 'react';
import { doc, setDoc, deleteDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useUser } from '../context/UserContext';
import { colors, fonts, radius } from '../design';

// Dummy users for screenshot-ready seed data
// All IDs prefixed with "dummy-" so they're easy to identify and delete
// Photos: carefully selected Unsplash portraits that read as young, stylish, aspirational
// Trip dates: centered around Sep 2026 for active/upcoming screenshot signals
const DUMMY_USERS = [
  {
    id: 'dummy-amira',
    name: 'Amira',
    age: 27,
    gender: 'Female',
    bio: 'Art director. I collect vintage rugs and strong opinions about coffee.',
    city: 'Toronto',
    photoURL: 'https://images.pexels.com/photos/8068120/pexels-photo-8068120.jpeg?auto=compress&cs=tinysrgb&w=600',
    interests: ['Art', 'Design', 'Coffee', 'Photography'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+14165551234',
    instagram: 'amira.travels',
    upcomingTrips: [
      {
        destination: 'Mexico City, Mexico',
        destinationId: 'mexico-city',
        startDate: '2026-09-01',
        endDate: '2026-09-10',
        interestedExperiences: [
          'Museo Nacional de Antropologia',
          'Xochimilco trajineras',
          'Teotihuacan',
        ],
      },
      {
        destination: 'Marrakech, Morocco',
        destinationId: 'marrakech',
        startDate: '2026-10-18',
        endDate: '2026-10-26',
        interestedExperiences: [
          'Ben Youssef Madrasa',
          'Jardin Majorelle',
        ],
      },
    ],
  },
  {
    id: 'dummy-idris',
    name: 'Idris',
    age: 30,
    gender: 'Male',
    bio: 'Architect. If the building is beautiful I will find it.',
    city: 'London',
    photoURL: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=85',
    interests: ['Architecture', 'Food', 'Running'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+447555123456',
    instagram: 'idris.builds',
    upcomingTrips: [
      {
        destination: 'Mexico City, Mexico',
        destinationId: 'mexico-city',
        startDate: '2026-09-03',
        endDate: '2026-09-12',
        interestedExperiences: [
          'Teotihuacan',
          'Palacio de Bellas Artes',
          'Lucha Libre at Arena Mexico',
        ],
      },
      {
        destination: 'Istanbul, Turkey',
        destinationId: 'istanbul',
        startDate: '2026-10-10',
        endDate: '2026-10-18',
        interestedExperiences: [
          'Bosphorus ferry at sunset',
          'Suleymaniye Mosque',
        ],
      },
    ],
  },
  {
    id: 'dummy-nadia',
    name: 'Nadia',
    age: 26,
    gender: 'Female',
    bio: 'Residency done. Now I rest. Kidding — now I travel.',
    city: 'Chicago',
    photoURL: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=85',
    interests: ['Hiking', 'History', 'Tea'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+13125559876',
    instagram: 'nadia.wanders',
    upcomingTrips: [
      {
        destination: 'Mexico City, Mexico',
        destinationId: 'mexico-city',
        startDate: '2026-09-02',
        endDate: '2026-09-09',
        interestedExperiences: [
          'Museo Nacional de Antropologia',
          'Teotihuacan',
        ],
      },
    ],
  },
  {
    id: 'dummy-tariq',
    name: 'Tariq',
    age: 29,
    gender: 'Male',
    bio: 'Strategy consultant who only consults himself on where to eat next.',
    city: 'Dubai',
    photoURL: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=600&q=85',
    interests: ['Food', 'Fashion', 'Markets'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+971555678901',
    instagram: 'tariq.eats',
    upcomingTrips: [
      {
        destination: 'Istanbul, Turkey',
        destinationId: 'istanbul',
        startDate: '2026-09-06',
        endDate: '2026-09-14',
        interestedExperiences: [
          'Bosphorus ferry at sunset',
          'Grand Bazaar',
          'Hamam at Kilic Ali Pasa',
        ],
      },
      {
        destination: 'Marrakech, Morocco',
        destinationId: 'marrakech',
        startDate: '2026-11-01',
        endDate: '2026-11-09',
        interestedExperiences: [
          'Atlas Mountains day trip',
          'Ben Youssef Madrasa',
        ],
      },
    ],
  },
  {
    id: 'dummy-yasmin',
    name: 'Yasmin',
    age: 28,
    gender: 'Female',
    bio: 'Documentary filmmaker. I go where the light is good and the food is better.',
    city: 'New York',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=85',
    interests: ['Film', 'Street food', 'Writing'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+12125554321',
    instagram: 'yasmin.frames',
    upcomingTrips: [
      {
        destination: 'Mexico City, Mexico',
        destinationId: 'mexico-city',
        startDate: '2026-09-05',
        endDate: '2026-09-14',
        interestedExperiences: [
          'Xochimilco trajineras',
          'Museo Nacional de Antropologia',
          'Lucha Libre at Arena Mexico',
        ],
      },
    ],
  },
  {
    id: 'dummy-khalid',
    name: 'Khalid',
    age: 32,
    gender: 'Male',
    bio: 'ER physician. I spend my days off as far from a hospital as possible.',
    city: 'Houston',
    photoURL: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=85',
    interests: ['Diving', 'Photography', 'History'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+17135557890',
    instagram: 'khalid.md',
    upcomingTrips: [
      {
        destination: 'Istanbul, Turkey',
        destinationId: 'istanbul',
        startDate: '2026-09-08',
        endDate: '2026-09-16',
        interestedExperiences: [
          'Suleymaniye Mosque',
          'Bosphorus ferry at sunset',
        ],
      },
      {
        destination: 'Sarajevo, Bosnia',
        destinationId: 'sarajevo',
        startDate: '2026-10-05',
        endDate: '2026-10-12',
        interestedExperiences: [],
      },
    ],
  },
  {
    id: 'dummy-salma',
    name: 'Salma',
    age: 25,
    gender: 'Female',
    bio: 'Product designer at a startup nobody has heard of yet. Obsessed with ceramics.',
    city: 'Berlin',
    photoURL: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=85',
    interests: ['Design', 'Ceramics', 'Coffee', 'Markets'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+491755551234',
    instagram: 'salma.makes',
    upcomingTrips: [
      {
        destination: 'Marrakech, Morocco',
        destinationId: 'marrakech',
        startDate: '2026-09-04',
        endDate: '2026-09-13',
        interestedExperiences: [
          'Ben Youssef Madrasa',
          'Jardin Majorelle',
          'Atlas Mountains day trip',
        ],
      },
    ],
  },
  {
    id: 'dummy-adam',
    name: 'Adam',
    age: 27,
    gender: 'Male',
    bio: 'Lawyer who reads more menus than briefs. Currently learning Arabic in cafes.',
    city: 'Montreal',
    photoURL: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=85',
    interests: ['Languages', 'Food', 'Coffee', 'Running'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+15145559012',
    instagram: 'adam.reads.menus',
    upcomingTrips: [
      {
        destination: 'Mexico City, Mexico',
        destinationId: 'mexico-city',
        startDate: '2026-09-01',
        endDate: '2026-09-08',
        interestedExperiences: [
          'Teotihuacan',
          'Palacio de Bellas Artes',
        ],
      },
      {
        destination: 'Istanbul, Turkey',
        destinationId: 'istanbul',
        startDate: '2026-10-15',
        endDate: '2026-10-24',
        interestedExperiences: [
          'Grand Bazaar',
          'Bosphorus ferry at sunset',
        ],
      },
    ],
  },
  {
    id: 'dummy-hana',
    name: 'Hana',
    age: 29,
    gender: 'Female',
    bio: 'Runs a fragrance brand. Travels to source. Prays in airports without shame.',
    city: 'Los Angeles',
    photoURL: 'https://images.pexels.com/photos/13205610/pexels-photo-13205610.jpeg?auto=compress&cs=tinysrgb&w=600',
    interests: ['Fragrance', 'Fashion', 'Art', 'Markets'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+13105556789',
    instagram: 'hana.scents',
    upcomingTrips: [
      {
        destination: 'Marrakech, Morocco',
        destinationId: 'marrakech',
        startDate: '2026-09-06',
        endDate: '2026-09-15',
        interestedExperiences: [
          'Atlas Mountains day trip',
          'Ben Youssef Madrasa',
        ],
      },
      {
        destination: 'Istanbul, Turkey',
        destinationId: 'istanbul',
        startDate: '2026-10-12',
        endDate: '2026-10-19',
        interestedExperiences: [
          'Grand Bazaar',
          'Suleymaniye Mosque',
        ],
      },
    ],
  },
  {
    id: 'dummy-zain',
    name: 'Zain',
    age: 31,
    gender: 'Male',
    bio: 'Sold my startup. Taking a year to see everything I missed while building it.',
    city: 'San Francisco',
    photoURL: 'https://images.unsplash.com/photo-1507081323647-4d250478b919?auto=format&fit=crop&w=600&q=85',
    interests: ['Tech', 'Photography', 'Hiking', 'Architecture'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+14155550123',
    instagram: 'zain.goes',
    upcomingTrips: [
      {
        destination: 'Mexico City, Mexico',
        destinationId: 'mexico-city',
        startDate: '2026-09-02',
        endDate: '2026-09-11',
        interestedExperiences: [
          'Teotihuacan',
          'Museo Nacional de Antropologia',
          'Xochimilco trajineras',
        ],
      },
      {
        destination: 'Sarajevo, Bosnia',
        destinationId: 'sarajevo',
        startDate: '2026-10-06',
        endDate: '2026-10-14',
        interestedExperiences: [],
      },
    ],
  },
  {
    id: 'dummy-leila',
    name: 'Leila',
    age: 24,
    gender: 'Female',
    bio: 'Just finished my masters. Before real life starts — Marrakech.',
    city: 'Paris',
    photoURL: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=600&q=85',
    interests: ['Literature', 'Coffee', 'Photography'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+33655512345',
    instagram: 'leila.lit',
    upcomingTrips: [
      {
        destination: 'Marrakech, Morocco',
        destinationId: 'marrakech',
        startDate: '2026-09-05',
        endDate: '2026-09-12',
        interestedExperiences: [
          'Ben Youssef Madrasa',
          'Jardin Majorelle',
        ],
      },
    ],
  },
  {
    id: 'dummy-omar',
    name: 'Omar',
    age: 28,
    gender: 'Male',
    bio: 'Teacher. Basketball. I pray Fajr and then I walk until I find breakfast.',
    city: 'Atlanta',
    photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=85',
    interests: ['Basketball', 'Food', 'History', 'Hiking'],
    identity: 'Muslim',
    onboardingComplete: true,
    profileVisibility: 'everyone',
    whatsapp: '+14045553456',
    instagram: 'omar.walks',
    upcomingTrips: [
      {
        destination: 'Istanbul, Turkey',
        destinationId: 'istanbul',
        startDate: '2026-09-07',
        endDate: '2026-09-15',
        interestedExperiences: [
          'Suleymaniye Mosque',
          'Bosphorus ferry at sunset',
          'Grand Bazaar',
        ],
      },
    ],
  },
];

function AdminSeedDummy() {
  const { currentUser, refreshAll } = useUser();
  const [log, setLog] = useState([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const seedDummies = async () => {
    if (!currentUser) return;
    setRunning(true);
    setLog([]);

    for (const user of DUMMY_USERS) {
      const { id, ...data } = user;
      try {
        await setDoc(doc(db, 'users', id), {
          ...data,
          createdAt: new Date().toISOString(),
          pastTrips: [],
          connections: [],
        });
        addLog(`Seeded ${user.name} (${id})`);
      } catch (err) {
        addLog(`Failed ${id}: ${err.message}`);
      }
    }

    addLog('--- Done. Refresh the app to see social signals. ---');
    await refreshAll();
    setRunning(false);
  };

  const deleteDummies = async () => {
    if (!currentUser) return;
    setRunning(true);
    setLog([]);

    for (const user of DUMMY_USERS) {
      try {
        await deleteDoc(doc(db, 'users', user.id));
        addLog(`Deleted ${user.name} (${user.id})`);
      } catch (err) {
        addLog(`Failed to delete ${user.id}: ${err.message}`);
      }
    }

    addLog('--- All dummy users deleted. ---');
    await refreshAll();
    setRunning(false);
  };

  return (
    <div style={pageStyles.page}>
      <h1 style={pageStyles.title}>Seed Dummy Data</h1>
      <p style={pageStyles.desc}>
        Creates {DUMMY_USERS.length} polished travelers with overlapping trips for screenshot-ready seed data.
        All IDs are prefixed with "dummy-" for easy cleanup.
      </p>

      <div style={pageStyles.btnRow}>
        <button style={pageStyles.seedBtn} onClick={seedDummies} disabled={running}>
          {running ? 'Working...' : 'Seed dummy users'}
        </button>
        <button style={pageStyles.deleteBtn} onClick={deleteDummies} disabled={running}>
          Delete all dummies
        </button>
      </div>

      <div style={pageStyles.log}>
        {log.map((msg, i) => (
          <div key={i} style={pageStyles.logLine}>{msg}</div>
        ))}
      </div>
    </div>
  );
}

const pageStyles = {
  page: {
    minHeight: '100vh',
    background: colors.bg,
    padding: '40px 24px',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: '24px',
    color: colors.text,
    margin: '0 0 8px',
  },
  desc: {
    fontSize: '14px',
    color: colors.textSecondary,
    lineHeight: 1.6,
    marginBottom: '24px',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
  },
  seedBtn: {
    padding: '12px 24px',
    background: colors.terracotta,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  deleteBtn: {
    padding: '12px 24px',
    background: colors.errorBg,
    color: colors.error,
    border: `1px solid ${colors.error}`,
    borderRadius: radius.md,
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  },
  log: {
    background: colors.surface,
    borderRadius: radius.md,
    padding: '16px',
    border: `1px solid ${colors.border}`,
  },
  logLine: {
    fontSize: '13px',
    color: colors.textSecondary,
    fontFamily: 'monospace',
    padding: '4px 0',
  },
};

export default AdminSeedDummy;
