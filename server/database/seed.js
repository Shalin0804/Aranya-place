import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { nightsBetween, generateBookingRef } from '../utils/booking.js';

const ROOM_TYPES = [
  {
    name: 'Deluxe Garden Room', slug: 'deluxe-garden-room',
    tagline: 'Ground-floor rooms opening onto the courtyard gardens',
    description: 'Warm teak floors, a private sit-out, and views over the mango courtyard. The Deluxe Garden Room is where most first-time guests begin their stay at Aranya — quiet, unfussy, and close to the spa wing.',
    base_price: 6500, max_guests: 2, bed_type: 'King bed', size_sqft: 320, sort_order: 1, roomCount: 8,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Garden view', 'Rain shower', 'Minibar', 'Tea & coffee maker'],
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200',
      'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200',
    ],
  },
  {
    name: 'Premium Courtyard Room', slug: 'premium-courtyard-room',
    tagline: 'Upper-floor rooms with a wraparound teak balcony',
    description: 'A step up in space and light, the Premium Courtyard Room adds a wraparound balcony, a soaking tub, and a reading nook. Best suited to travelers who want a little more room to spread out.',
    base_price: 9200, max_guests: 3, bed_type: 'King bed + daybed', size_sqft: 420, sort_order: 2, roomCount: 6,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private balcony', 'Soaking tub', 'Minibar', 'Nespresso machine', 'Bathrobe & slippers'],
    images: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
    ],
  },
  {
    name: 'Executive Heritage Room', slug: 'executive-heritage-room',
    tagline: 'Restored 1920s rooms in the original haveli wing',
    description: 'Set inside the original haveli, each Executive Heritage Room keeps its hand-painted ceiling and jaali screens while adding a fully modern bath. A favourite for anniversaries and quiet work retreats alike.',
    base_price: 11800, max_guests: 3, bed_type: 'King bed', size_sqft: 480, sort_order: 3, roomCount: 5,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Heritage architecture', 'Writing desk', 'Minibar', 'Nespresso machine', 'Turndown service'],
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=1200',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200',
    ],
  },
  {
    name: 'Family Orchard Suite', slug: 'family-orchard-suite',
    tagline: 'A two-room suite opening onto the orchard lawns',
    description: 'Two connected rooms and a shared sitting area make the Family Orchard Suite the easy choice for families and small groups travelling together, with direct lawn access for kids to run free.',
    base_price: 15500, max_guests: 5, bed_type: '2 King beds', size_sqft: 620, sort_order: 4, roomCount: 4,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Lawn access', 'Two bathrooms', 'Minibar', 'Kids welcome kit', 'Connecting rooms'],
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=1200',
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=1200',
      'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=1200',
    ],
  },
  {
    name: 'Aranya Suite', slug: 'aranya-suite',
    tagline: 'A corner suite with its own plunge pool',
    description: 'Our signature suite: a separate living room, a four-poster bed, and a private plunge pool screened by frangipani trees. The Aranya Suite is built for guests who want the resort to disappear around them.',
    base_price: 24000, max_guests: 4, bed_type: 'King four-poster bed', size_sqft: 850, sort_order: 5, roomCount: 3,
    amenities: ['Free Wi-Fi', 'Air conditioning', 'Private plunge pool', 'Living room', 'Butler on call', 'Premium minibar', 'Outdoor rain shower'],
    images: [
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=1200',
      'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200',
    ],
  },
  {
    name: 'Presidential Pool Villa', slug: 'presidential-pool-villa',
    tagline: 'A freestanding villa with a private garden and pool',
    description: 'The Presidential Pool Villa stands apart from the main house entirely — a freestanding villa with its own walled garden, a 12-metre pool, a private chef on request, and round-the-clock butler service.',
    base_price: 42000, max_guests: 6, bed_type: 'King bed + 2 singles', size_sqft: 1400, sort_order: 6, roomCount: 2,
    amenities: ['Free Wi-Fi', 'Private pool', 'Walled garden', 'Private chef on request', '24-hour butler', 'Separate dining pavilion', 'Airport transfer included'],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200',
      'https://images.unsplash.com/photo-1602343168117-bb8ffe3e2e9f?w=1200',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
    ],
  },
];

const GUEST_NAMES = [
  'Ananya Rao', 'Vikram Sethi', 'Priya Nair', 'Arjun Mehta', 'Kavya Iyer', 'Rohan Kapoor',
  'Ishita Desai', 'Aditya Bhatt', 'Meera Pillai', 'Karan Malhotra', 'Sanya Chawla', 'Nikhil Joshi',
  'Divya Menon', 'Aryan Kulkarni', 'Tara Bose', 'Siddharth Rana', 'Neha Trivedi', 'Yash Agarwal',
  'Riya Shah', 'Kabir Singh',
];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  console.log('Seeding database...');
  const conn = await pool.getConnection();
  try {
    // The seed wipes every table. Refuse to touch a database that already
    // holds bookings unless explicitly forced.
    const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM bookings');
    if (n > 0 && !process.argv.includes('--force')) {
      throw new Error(`Refusing to seed: database has ${n} bookings and seeding deletes everything. Re-run with --force only on a disposable database.`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE payments');
    await conn.query('TRUNCATE TABLE bookings');
    await conn.query('TRUNCATE TABLE reviews');
    await conn.query('TRUNCATE TABLE offers');
    await conn.query('TRUNCATE TABLE rooms');
    await conn.query('TRUNCATE TABLE room_type_images');
    await conn.query('TRUNCATE TABLE room_type_amenities');
    await conn.query('TRUNCATE TABLE room_types');
    await conn.query('TRUNCATE TABLE gallery');
    await conn.query('TRUNCATE TABLE customers');
    await conn.query('TRUNCATE TABLE admins');
    await conn.query('TRUNCATE TABLE hotel_settings');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // --- Admin account (for logging into /admin) ---
    const adminPasswordHash = await bcrypt.hash('Admin@1234', 12);
    await conn.query(
      'INSERT INTO admins (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)',
      ['Super Admin', 'admin@aranyapalace.in', adminPasswordHash, 'Super Admin', 'Active']
    );

    // --- Hotel settings ---
    await conn.query(
      `INSERT INTO hotel_settings
        (id, hotel_name, address, phone, email, website, check_in_time, check_out_time,
         currency, tax_percentage, cancellation_policy, description, instagram_url, facebook_url)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Aranya Palace Resort & Spa',
        'Village Bavla Road, near Sanand, Ahmedabad, Gujarat 382220, India',
        '+91 79 4811 2200', 'stay@aranyapalace.in', 'https://www.aranyapalace.in',
        '2:00 PM', '11:00 AM', 'INR', 12.00,
        'Free cancellation up to 48 hours before check-in. Cancellations within 48 hours are charged one night\'s stay. No-shows are charged the full booking amount.',
        'A restored 1920s haveli set among fifteen acres of mango orchard on the edge of Ahmedabad, reimagined as a forty-room resort and spa.',
        'https://instagram.com/aranyapalace', 'https://facebook.com/aranyapalace',
      ]
    );

    // --- Room types, amenities, images, physical rooms ---
    const roomTypeIds = {};
    for (const rt of ROOM_TYPES) {
      const [result] = await conn.query(
        `INSERT INTO room_types (name, slug, tagline, description, base_price, max_guests, bed_type, size_sqft, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rt.name, rt.slug, rt.tagline, rt.description, rt.base_price, rt.max_guests, rt.bed_type, rt.size_sqft, rt.sort_order]
      );
      const roomTypeId = result.insertId;
      roomTypeIds[rt.slug] = roomTypeId;

      for (const amenity of rt.amenities) {
        await conn.query('INSERT INTO room_type_amenities (room_type_id, amenity) VALUES (?, ?)', [roomTypeId, amenity]);
      }
      for (let i = 0; i < rt.images.length; i++) {
        await conn.query(
          'INSERT INTO room_type_images (room_type_id, image_url, sort_order, is_featured) VALUES (?, ?, ?, ?)',
          [roomTypeId, rt.images[i], i, i === 0 ? 1 : 0]
        );
      }

      const typeCode = String(rt.sort_order).padStart(2, '0');
      for (let i = 1; i <= rt.roomCount; i++) {
        const floor = randomBetween(1, 3);
        const roomNumber = `${floor}${typeCode}${String(i).padStart(2, '0')}`;
        const status = Math.random() < 0.06 ? 'Maintenance' : 'Available';
        await conn.query(
          'INSERT INTO rooms (room_number, room_type_id, floor, status) VALUES (?, ?, ?, ?)',
          [roomNumber, roomTypeId, floor, status]
        );
      }
    }

    // --- Offers ---
    const today = new Date();
    await conn.query(
      `INSERT INTO offers (name, description, discount_type, discount_value, start_date, end_date, applicable_room_type_id, min_nights, max_usage, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      ['Early Bird — 15% Off', 'Book at least 21 days ahead and save 15% on any room.', 'percentage', 15,
        addDays(today, -10), addDays(today, 90), null, 2, null]
    );
    await conn.query(
      `INSERT INTO offers (name, description, discount_type, discount_value, start_date, end_date, applicable_room_type_id, min_nights, max_usage, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      ['Weekend Escape — ₹2,000 Off', 'Flat ₹2,000 off stays of 2 nights or more in the Aranya Suite.', 'fixed', 2000,
        addDays(today, -5), addDays(today, 60), roomTypeIds['aranya-suite'], 2, 50]
    );
    await conn.query(
      `INSERT INTO offers (name, description, discount_type, discount_value, start_date, end_date, applicable_room_type_id, min_nights, max_usage, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Active')`,
      ['Extended Stay — 20% Off', 'Stay 5 nights or longer and save 20%, any room type.', 'percentage', 20,
        addDays(today, -20), addDays(today, 120), null, 5, null]
    );

    // --- Demo customer account (for you to log in and test with) ---
    const demoPasswordHash = await bcrypt.hash('Guest@1234', 12);
    const [customerResult] = await conn.query(
      'INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      ['Demo Guest', 'demo@aranyapalace.in', '+91 98765 43210', demoPasswordHash]
    );
    const demoCustomerId = customerResult.insertId;

    for (let i = 0; i < 19; i++) {
      const hash = await bcrypt.hash('Password@123', 12);
      await conn.query(
        'INSERT INTO customers (name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
        [GUEST_NAMES[i], `${GUEST_NAMES[i].toLowerCase().replace(/\s+/g, '.')}@example.com`, `+91 9${randomBetween(100000000, 999999999)}`, hash]
      );
    }

    // --- Reviews ---
    const reviewComments = [
      { rating: 5, title: 'Exactly the quiet we needed', comment: 'The Executive Heritage Room was stunning — original ceiling, beautifully restored. Breakfast on the courtyard was the highlight of every morning.' },
      { rating: 5, title: 'Worth every rupee', comment: 'Booked the Aranya Suite for our anniversary. The plunge pool at sunset was unreal, and the staff remembered our names by day two.' },
      { rating: 4, title: 'Lovely stay, minor AC noise', comment: 'Beautiful property and excellent service. Our Premium Courtyard Room had a slightly noisy AC unit at night, otherwise flawless.' },
      { rating: 5, title: 'Perfect for the kids too', comment: 'The Family Orchard Suite gave us space to breathe and the kids loved running around the lawns. Will absolutely be back.' },
      { rating: 5, title: 'Best spa on the outskirts of Ahmedabad', comment: 'Came for a two-night reset and left completely recalibrated. The spa alone is worth the drive out.' },
      { rating: 4, title: 'Gorgeous grounds', comment: 'Deluxe Garden Room was cozy and well kept. Food at the restaurant was good though the menu could use more variety.' },
    ];
    for (let i = 0; i < reviewComments.length; i++) {
      const rc = reviewComments[i];
      const rtSlug = ROOM_TYPES[i % ROOM_TYPES.length].slug;
      await conn.query(
        `INSERT INTO reviews (customer_id, guest_name, rating, title, comment, room_type_id, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 'Approved', ?)`,
        [null, GUEST_NAMES[randomBetween(0, GUEST_NAMES.length - 1)], rc.rating, rc.title, rc.comment,
          roomTypeIds[rtSlug], addDays(today, -randomBetween(5, 180))]
      );
    }

    // --- Gallery ---
    const galleryImages = [
      { category: 'hotel', image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200', caption: 'The main courtyard at dusk' },
      { category: 'pool', image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200', caption: 'The orchard-facing pool' },
      { category: 'restaurant', image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200', caption: 'Dining under the mango trees' },
      { category: 'facility', image_url: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200', caption: 'The spa reception' },
      { category: 'hotel', image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200', caption: 'Sunset over the haveli wing' },
      { category: 'room', image_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200', caption: 'Inside the Aranya Suite' },
    ];
    for (let i = 0; i < galleryImages.length; i++) {
      const g = galleryImages[i];
      await conn.query(
        'INSERT INTO gallery (category, image_url, caption, sort_order, is_featured) VALUES (?, ?, ?, ?, ?)',
        [g.category, g.image_url, g.caption, i, i === 0 ? 1 : 0]
      );
    }

    // --- Demo bookings (spread across past, current, and future so every dashboard bucket has data) ---
    const roomTypeSlugs = ROOM_TYPES.map((rt) => rt.slug);
    let bookingCount = 0;
    for (let i = 0; i < 32; i++) {
      const slug = roomTypeSlugs[randomBetween(0, roomTypeSlugs.length - 1)];
      const roomTypeId = roomTypeIds[slug];
      const rt = ROOM_TYPES.find((r) => r.slug === slug);
      const dayOffset = randomBetween(-45, 60);
      const stayLength = randomBetween(1, 4);
      const checkIn = addDays(today, dayOffset);
      const checkOut = addDays(today, dayOffset + stayLength);
      const nights = nightsBetween(checkIn, checkOut);
      const numRooms = 1;
      const roomPrice = rt.base_price;
      const subtotal = roomPrice * nights * numRooms;
      const taxAmount = subtotal * 0.12;
      const totalAmount = subtotal + taxAmount;
      const guestName = i === 0 ? 'Demo Guest' : GUEST_NAMES[randomBetween(0, GUEST_NAMES.length - 1)];
      const customerId = i === 0 ? demoCustomerId : (Math.random() < 0.5 ? demoCustomerId + randomBetween(1, 19) : null);

      let status = 'Confirmed';
      if (dayOffset + stayLength < 0) status = Math.random() < 0.1 ? 'Cancelled' : 'Completed';
      else if (Math.random() < 0.05) status = 'Cancelled';

      let bookingRef = generateBookingRef();
      await conn.query(
        `INSERT INTO bookings
          (booking_ref, customer_id, guest_name, guest_email, guest_phone, room_type_id,
           check_in, check_out, nights, num_rooms, adults, children, room_price, subtotal,
           tax_amount, discount_amount, total_amount, status, payment_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          bookingRef, customerId, guestName, `${guestName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          `+91 9${randomBetween(100000000, 999999999)}`, roomTypeId, checkIn, checkOut, nights, numRooms,
          randomBetween(1, rt.max_guests), 0, roomPrice, subtotal, taxAmount, totalAmount, status,
          status === 'Completed' ? 'Paid' : status === 'Cancelled' ? 'Refunded' : 'Paid',
        ]
      );
      bookingCount++;
    }

    console.log(`Seeded ${ROOM_TYPES.length} room types, ${Object.keys(roomTypeIds).length ? ROOM_TYPES.reduce((s, r) => s + r.roomCount, 0) : 0} physical rooms, 20 customers, ${bookingCount} bookings, ${reviewComments.length} reviews.`);
    console.log('\nDemo guest login   -> email: demo@aranyapalace.in   password: Guest@1234');
    console.log('Admin panel login  -> email: admin@aranyapalace.in  password: Admin@1234');
  } finally {
    conn.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
