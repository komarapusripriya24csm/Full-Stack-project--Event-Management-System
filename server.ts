import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EventDocument {
  _id: string;
  title: string;
  description: string;
  category: string;
  format: 'In-Person' | 'Online' | 'Hybrid';
  date: string;
  time: string;
  endTime: string;
  location: string;
  virtualLink: string;
  organizerName: string;
  organizerEmail: string;
  capacity: number;
  attendeeCount: number;
  ticketType: 'Free' | 'Paid';
  price: number;
  status: 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';
  tags: string[];
  bannerUrl: string;
  createdAt: string;
  updatedAt: string;
}

interface AttendeeDocument {
  _id: string;
  eventId: string;
  eventTitle: string;
  name: string;
  email: string;
  phone: string;
  ticketQuantity: number;
  status: 'Confirmed' | 'Checked-in' | 'Cancelled';
  checkedInAt?: string;
  registeredAt: string;
}

const DEFAULT_EVENTS: EventDocument[] = [
  {
    _id: 'evt_0192837401',
    title: 'Global Tech & Cloud Summit 2026',
    description: 'Join industry pioneers, senior software engineers, and product visionaries exploring the future of distributed systems, high-scale architecture, and modern cloud technologies.',
    category: 'Conference',
    format: 'Hybrid',
    date: '2026-10-18',
    time: '09:00',
    endTime: '17:30',
    location: 'Metropolis Convention Center, Hall B, San Francisco, CA',
    virtualLink: 'https://stream.eventsphere.io/summit2026',
    organizerName: 'DevCon Global Collective',
    organizerEmail: 'organizers@devconglobal.io',
    capacity: 450,
    attendeeCount: 382,
    ticketType: 'Paid',
    price: 149,
    status: 'Upcoming',
    tags: ['Tech', 'Cloud', 'Architecture', 'Networking'],
    bannerUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'evt_0192837402',
    title: 'Full-Stack TypeScript & Node Masterclass',
    description: 'An intensive hands-on workshop building production-ready scalable microservices with Node.js, Express, MongoDB, and modern reactive frontends.',
    category: 'Workshop',
    format: 'Online',
    date: '2026-10-24',
    time: '14:00',
    endTime: '18:00',
    location: 'Interactive Virtual Laboratory',
    virtualLink: 'https://meet.eventsphere.io/workshop-node-mastery',
    organizerName: 'Engineering Guild',
    organizerEmail: 'classes@engineeringguild.org',
    capacity: 120,
    attendeeCount: 94,
    ticketType: 'Free',
    price: 0,
    status: 'Upcoming',
    tags: ['NodeJS', 'TypeScript', 'MongoDB', 'HandsOn'],
    bannerUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'evt_0192837403',
    title: 'Neon Horizon Electronic Music Experience',
    description: 'An audio-visual spectacle featuring world-class electronic music producers, ambient light installations, and immersive spatial soundscapes.',
    category: 'Concert',
    format: 'In-Person',
    date: '2026-11-05',
    time: '20:00',
    endTime: '02:00',
    location: 'Aurora Arena & Amphitheater, Austin, TX',
    virtualLink: '',
    organizerName: 'Pulse Beat Productions',
    organizerEmail: 'contact@pulsebeatprod.com',
    capacity: 800,
    attendeeCount: 740,
    ticketType: 'Paid',
    price: 65,
    status: 'Upcoming',
    tags: ['Music', 'LiveShow', 'Electronic', 'Nightlife'],
    bannerUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'evt_0192837404',
    title: 'Founders & Angel Investors Breakfast',
    description: 'Curated networking session connecting early-stage technology startup founders with prominent venture capitalists, angels, and operators.',
    category: 'Networking',
    format: 'In-Person',
    date: '2026-10-12',
    time: '08:30',
    endTime: '11:00',
    location: 'The Loft Sky Lounge, Seattle, WA',
    virtualLink: '',
    organizerName: 'Pacific Founders Network',
    organizerEmail: 'hello@pacificfounders.vc',
    capacity: 60,
    attendeeCount: 58,
    ticketType: 'Paid',
    price: 40,
    status: 'Upcoming',
    tags: ['Startups', 'VentureCapital', 'Networking', 'Founders'],
    bannerUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'evt_0192837405',
    title: 'Urban Marathon & Community 10K',
    description: 'Annual civic road race promoting active living, health equity, and athletic endurance across scenic waterfront routes.',
    category: 'Sports',
    format: 'In-Person',
    date: '2026-11-14',
    time: '07:00',
    endTime: '13:00',
    location: 'Harbor Promenade, Boston, MA',
    virtualLink: '',
    organizerName: 'Athletic Endeavors Org',
    organizerEmail: 'races@athleticendeavors.org',
    capacity: 1000,
    attendeeCount: 890,
    ticketType: 'Paid',
    price: 35,
    status: 'Upcoming',
    tags: ['Running', 'Marathon', 'Fitness', 'Community'],
    bannerUrl: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'evt_0192837406',
    title: 'UX & Product Design Systems Conference',
    description: 'Deep dive into accessible design systems, responsive micro-interactions, tokens, and multi-platform component architectures.',
    category: 'Design',
    format: 'Online',
    date: '2026-09-28',
    time: '10:00',
    endTime: '16:00',
    location: 'Design Studio Stream',
    virtualLink: 'https://stream.eventsphere.io/designsystems',
    organizerName: 'Interface Collective',
    organizerEmail: 'info@interfacecollective.net',
    capacity: 300,
    attendeeCount: 300,
    ticketType: 'Free',
    price: 0,
    status: 'Completed',
    tags: ['UI', 'UX', 'DesignSystems', 'Accessibility'],
    bannerUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const DEFAULT_ATTENDEES: AttendeeDocument[] = [
  {
    _id: 'att_88291001',
    eventId: 'evt_0192837401',
    eventTitle: 'Global Tech & Cloud Summit 2026',
    name: 'Sarah Jenkins',
    email: 'sarah.j@example.com',
    phone: '+1 555-0192',
    ticketQuantity: 1,
    status: 'Confirmed',
    registeredAt: '2026-09-15T10:14:00Z',
  },
  {
    _id: 'att_88291002',
    eventId: 'evt_0192837401',
    eventTitle: 'Global Tech & Cloud Summit 2026',
    name: 'Marcus Vance',
    email: 'marcus.v@example.com',
    phone: '+1 555-0193',
    ticketQuantity: 2,
    status: 'Checked-in',
    checkedInAt: '2026-10-01T08:50:00Z',
    registeredAt: '2026-09-18T14:22:00Z',
  },
  {
    _id: 'att_88291003',
    eventId: 'evt_0192837402',
    eventTitle: 'Full-Stack TypeScript & Node Masterclass',
    name: 'Elena Rostova',
    email: 'elena.r@example.com',
    phone: '+1 555-0194',
    ticketQuantity: 1,
    status: 'Confirmed',
    registeredAt: '2026-09-22T09:30:00Z',
  },
  {
    _id: 'att_88291004',
    eventId: 'evt_0192837404',
    eventTitle: 'Founders & Angel Investors Breakfast',
    name: 'David Chen',
    email: 'david.chen@example.com',
    phone: '+1 555-0195',
    ticketQuantity: 1,
    status: 'Checked-in',
    checkedInAt: '2026-10-02T08:15:00Z',
    registeredAt: '2026-09-29T11:05:00Z',
  }
];

class DatabaseService {
  private mongoClient: MongoClient | null = null;
  private isConnectedToMongo: boolean = false;
  private filePath: string;
  private localEvents: EventDocument[] = [];
  private localAttendees: AttendeeDocument[] = [];

  constructor() {
    const dataDir = path.resolve(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.resolve(dataDir, 'db.json');
    this.loadLocalData();
  }

  private loadLocalData() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        this.localEvents = parsed.events && parsed.events.length > 0 ? parsed.events : [...DEFAULT_EVENTS];
        this.localAttendees = parsed.attendees && parsed.attendees.length > 0 ? parsed.attendees : [...DEFAULT_ATTENDEES];
      } else {
        this.localEvents = [...DEFAULT_EVENTS];
        this.localAttendees = [...DEFAULT_ATTENDEES];
        this.saveLocalData();
      }
    } catch {
      this.localEvents = [...DEFAULT_EVENTS];
      this.localAttendees = [...DEFAULT_ATTENDEES];
    }
  }

  private saveLocalData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify({
        events: this.localEvents,
        attendees: this.localAttendees
      }, null, 2), 'utf-8');
    } catch (e) {
      console.error(e);
    }
  }

  public async initialize() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      try {
        const client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 2500 });
        await client.connect();
        this.mongoClient = client;
        this.isConnectedToMongo = true;
        const db = client.db();
        const eventsCount = await db.collection('events').countDocuments();
        if (eventsCount === 0) {
          await db.collection('events').insertMany(this.localEvents as any[]);
          await db.collection('attendees').insertMany(this.localAttendees as any[]);
        }
      } catch {
        this.isConnectedToMongo = false;
      }
    }
  }

  public getStatus() {
    return {
      connected: this.isConnectedToMongo,
      driver: this.isConnectedToMongo ? 'mongodb-remote' : 'mongodb-document-store',
      totalEvents: this.localEvents.length,
      totalAttendees: this.localAttendees.length
    };
  }

  public async getEvents(filter: { category?: string; status?: string; search?: string }): Promise<EventDocument[]> {
    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      const query: any = {};
      if (filter.category && filter.category !== 'All') {
        query.category = filter.category;
      }
      if (filter.status && filter.status !== 'All') {
        query.status = filter.status;
      }
      if (filter.search) {
        query.$or = [
          { title: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { location: { $regex: filter.search, $options: 'i' } },
          { organizerName: { $regex: filter.search, $options: 'i' } }
        ];
      }
      const rawEvents = await db.collection('events').find(query).sort({ date: 1 }).toArray();
      return rawEvents.map(e => ({ ...e, _id: e._id.toString() } as unknown as EventDocument));
    }

    let result = [...this.localEvents];
    if (filter.category && filter.category !== 'All') {
      result = result.filter(e => e.category.toLowerCase() === filter.category!.toLowerCase());
    }
    if (filter.status && filter.status !== 'All') {
      result = result.filter(e => e.status.toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter.search) {
      const s = filter.search.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(s) ||
        e.description.toLowerCase().includes(s) ||
        e.location.toLowerCase().includes(s) ||
        e.organizerName.toLowerCase().includes(s) ||
        e.tags.some(t => t.toLowerCase().includes(s))
      );
    }
    result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return result;
  }

  public async getEventById(id: string): Promise<EventDocument | null> {
    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      let query: any = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
      }
      const doc = await db.collection('events').findOne(query);
      return doc ? ({ ...doc, _id: doc._id.toString() } as unknown as EventDocument) : null;
    }
    const found = this.localEvents.find(e => e._id === id);
    return found || null;
  }

  public async createEvent(data: Omit<EventDocument, '_id' | 'createdAt' | 'updatedAt' | 'attendeeCount'>): Promise<EventDocument> {
    const newId = 'evt_' + crypto.randomBytes(6).toString('hex');
    const now = new Date().toISOString();
    const doc: EventDocument = {
      ...data,
      _id: newId,
      attendeeCount: 0,
      createdAt: now,
      updatedAt: now
    };

    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      await db.collection('events').insertOne({ ...doc } as any);
    }

    this.localEvents.unshift(doc);
    this.saveLocalData();
    return doc;
  }

  public async updateEvent(id: string, updates: Partial<EventDocument>): Promise<EventDocument | null> {
    const now = new Date().toISOString();
    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      let query: any = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
      }
      await db.collection('events').updateOne(query, { $set: { ...updates, updatedAt: now } });
    }

    const index = this.localEvents.findIndex(e => e._id === id);
    if (index === -1) return null;
    this.localEvents[index] = {
      ...this.localEvents[index],
      ...updates,
      updatedAt: now
    };
    this.saveLocalData();
    return this.localEvents[index];
  }

  public async deleteEvent(id: string): Promise<boolean> {
    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      let query: any = { _id: id };
      if (ObjectId.isValid(id)) {
        query = { $or: [{ _id: new ObjectId(id) }, { _id: id }] };
      }
      await db.collection('events').deleteOne(query);
      await db.collection('attendees').deleteMany({ eventId: id });
    }

    const initialLen = this.localEvents.length;
    this.localEvents = this.localEvents.filter(e => e._id !== id);
    this.localAttendees = this.localAttendees.filter(a => a.eventId !== id);
    this.saveLocalData();
    return this.localEvents.length < initialLen;
  }

  public async getAttendees(eventId?: string): Promise<AttendeeDocument[]> {
    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      const query = eventId ? { eventId } : {};
      const res = await db.collection('attendees').find(query).sort({ registeredAt: -1 }).toArray();
      return res.map(a => ({ ...a, _id: a._id.toString() } as unknown as AttendeeDocument));
    }
    if (eventId) {
      return this.localAttendees.filter(a => a.eventId === eventId);
    }
    return this.localAttendees;
  }

  public async registerAttendee(data: {
    eventId: string;
    name: string;
    email: string;
    phone: string;
    ticketQuantity: number;
  }): Promise<{ attendee: AttendeeDocument; event: EventDocument }> {
    const event = await this.getEventById(data.eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    const qty = data.ticketQuantity || 1;
    if (event.attendeeCount + qty > event.capacity) {
      throw new Error(`Insufficient tickets remaining. Only ${event.capacity - event.attendeeCount} left.`);
    }

    const newAttendeeId = 'att_' + crypto.randomBytes(6).toString('hex');
    const newAttendee: AttendeeDocument = {
      _id: newAttendeeId,
      eventId: event._id,
      eventTitle: event.title,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      ticketQuantity: qty,
      status: 'Confirmed',
      registeredAt: new Date().toISOString()
    };

    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      await db.collection('attendees').insertOne({ ...newAttendee } as any);
      let query: any = { _id: event._id };
      if (ObjectId.isValid(event._id)) {
        query = { $or: [{ _id: new ObjectId(event._id) }, { _id: event._id }] };
      }
      await db.collection('events').updateOne(query, {
        $inc: { attendeeCount: qty },
        $set: { updatedAt: new Date().toISOString() }
      });
    }

    this.localAttendees.unshift(newAttendee);
    const eventIdx = this.localEvents.findIndex(e => e._id === event._id);
    if (eventIdx !== -1) {
      this.localEvents[eventIdx].attendeeCount += qty;
      this.localEvents[eventIdx].updatedAt = new Date().toISOString();
    }
    this.saveLocalData();

    return {
      attendee: newAttendee,
      event: this.localEvents[eventIdx] || event
    };
  }

  public async toggleCheckIn(attendeeId: string): Promise<AttendeeDocument | null> {
    const attendee = this.localAttendees.find(a => a._id === attendeeId);
    if (!attendee) return null;

    const newStatus = attendee.status === 'Checked-in' ? 'Confirmed' : 'Checked-in';
    const checkedInAt = newStatus === 'Checked-in' ? new Date().toISOString() : undefined;

    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      let query: any = { _id: attendeeId };
      if (ObjectId.isValid(attendeeId)) {
        query = { $or: [{ _id: new ObjectId(attendeeId) }, { _id: attendeeId }] };
      }
      await db.collection('attendees').updateOne(query, {
        $set: { status: newStatus, checkedInAt }
      });
    }

    attendee.status = newStatus;
    attendee.checkedInAt = checkedInAt;
    this.saveLocalData();
    return attendee;
  }

  public async deleteAttendee(attendeeId: string): Promise<boolean> {
    const att = this.localAttendees.find(a => a._id === attendeeId);
    if (!att) return false;

    if (this.isConnectedToMongo && this.mongoClient) {
      const db = this.mongoClient.db();
      let query: any = { _id: attendeeId };
      if (ObjectId.isValid(attendeeId)) {
        query = { $or: [{ _id: new ObjectId(attendeeId) }, { _id: attendeeId }] };
      }
      await db.collection('attendees').deleteOne(query);

      let evQuery: any = { _id: att.eventId };
      if (ObjectId.isValid(att.eventId)) {
        evQuery = { $or: [{ _id: new ObjectId(att.eventId) }, { _id: att.eventId }] };
      }
      await db.collection('events').updateOne(evQuery, {
        $inc: { attendeeCount: -att.ticketQuantity }
      });
    }

    const eventIdx = this.localEvents.findIndex(e => e._id === att.eventId);
    if (eventIdx !== -1) {
      this.localEvents[eventIdx].attendeeCount = Math.max(0, this.localEvents[eventIdx].attendeeCount - att.ticketQuantity);
    }

    this.localAttendees = this.localAttendees.filter(a => a._id !== attendeeId);
    this.saveLocalData();
    return true;
  }

  public async getStats() {
    const events = this.localEvents;
    const attendees = this.localAttendees;
    const totalEvents = events.length;
    const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;
    const ongoingEvents = events.filter(e => e.status === 'Ongoing').length;
    const completedEvents = events.filter(e => e.status === 'Completed').length;
    const totalCapacity = events.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
    const totalRegistrations = events.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);
    const checkedInCount = attendees.filter(a => a.status === 'Checked-in').length;
    const revenue = events.reduce((acc, curr) => {
      if (curr.ticketType === 'Paid' && curr.price) {
        return acc + (curr.price * curr.attendeeCount);
      }
      return acc;
    }, 0);

    const categoryMap: Record<string, number> = {};
    for (const ev of events) {
      categoryMap[ev.category] = (categoryMap[ev.category] || 0) + 1;
    }

    return {
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      totalCapacity,
      totalRegistrations,
      checkedInCount,
      revenue,
      categoryMap,
      databaseType: this.isConnectedToMongo ? 'MongoDB Cluster' : 'MongoDB Document Engine'
    };
  }

  public resetSampleData() {
    this.localEvents = [...DEFAULT_EVENTS];
    this.localAttendees = [...DEFAULT_ATTENDEES];
    this.saveLocalData();
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  const dbService = new DatabaseService();
  await dbService.initialize();

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      ...dbService.getStatus()
    });
  });

  app.get('/api/stats', async (_req, res) => {
    try {
      const stats = await dbService.getStats();
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/events', async (req, res) => {
    try {
      const { category, status, search } = req.query;
      const events = await dbService.getEvents({
        category: category as string,
        status: status as string,
        search: search as string
      });
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await dbService.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(event);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/events', async (req, res) => {
    try {
      const {
        title,
        description,
        category,
        format,
        date,
        time,
        endTime,
        location,
        virtualLink,
        organizerName,
        organizerEmail,
        capacity,
        ticketType,
        price,
        status,
        tags,
        bannerUrl
      } = req.body;

      if (!title || !date || !time) {
        return res.status(400).json({ error: 'Title, date, and time are required' });
      }

      const created = await dbService.createEvent({
        title,
        description: description || '',
        category: category || 'Conference',
        format: format || 'In-Person',
        date,
        time,
        endTime: endTime || '',
        location: location || (format === 'Online' ? 'Online Event' : 'TBD'),
        virtualLink: virtualLink || '',
        organizerName: organizerName || 'Event Host',
        organizerEmail: organizerEmail || 'host@eventsphere.io',
        capacity: Number(capacity) || 100,
        ticketType: ticketType || 'Free',
        price: ticketType === 'Paid' ? Number(price) || 0 : 0,
        status: status || 'Upcoming',
        tags: Array.isArray(tags) ? tags : [],
        bannerUrl: bannerUrl || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80'
      });

      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/events/:id', async (req, res) => {
    try {
      const updated = await dbService.updateEvent(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/events/:id', async (req, res) => {
    try {
      const success = await dbService.deleteEvent(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ message: 'Event and associated attendees deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/events/:id/attendees', async (req, res) => {
    try {
      const attendees = await dbService.getAttendees(req.params.id);
      res.json(attendees);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/attendees', async (_req, res) => {
    try {
      const attendees = await dbService.getAttendees();
      res.json(attendees);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/events/:id/register', async (req, res) => {
    try {
      const { name, email, phone, ticketQuantity } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }
      const result = await dbService.registerAttendee({
        eventId: req.params.id,
        name,
        email,
        phone: phone || '',
        ticketQuantity: Number(ticketQuantity) || 1
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/attendees/:id/checkin', async (req, res) => {
    try {
      const updated = await dbService.toggleCheckIn(req.params.id);
      if (!updated) {
        return res.status(404).json({ error: 'Attendee not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/attendees/:id', async (req, res) => {
    try {
      const success = await dbService.deleteAttendee(req.params.id);
      if (!success) {
        return res.status(404).json({ error: 'Attendee not found' });
      }
      res.json({ message: 'Registration cancelled' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/seed', (_req, res) => {
    dbService.resetSampleData();
    res.json({ message: 'Database reset to sample events successfully' });
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
