const express = require('express');
const multer = require('multer');

const Notice = require('../models/Notice');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const { extractNoticeForLog, logNoticeChange } = require('../utils/noticeAuditLogger');

const router = express.Router();

const NOTICE_PRIORITIES = ['Low', 'Medium', 'High'];

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const normalizeExpiryDate = (input) => {
  if (!input) return null;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(23, 59, 59, 999);
  return date;
};

const validateNoticePayload = ({ title, content, priority }) => {
  if (!title || !title.trim()) return 'Title is required';
  if (!content || !content.trim()) return 'Content is required';
  if (priority && !NOTICE_PRIORITIES.includes(priority)) return 'Priority must be Low, Medium, or High';
  return null;
};

const getRequesterRole = async (req) => {
  const tokenRole = req.user?.role ? String(req.user.role) : null;
  const userId = req.user?.id ? String(req.user.id) : null;
  if (!userId) return tokenRole;

  try {
    const user = await User.findById(userId).select("role");
    return user?.role || tokenRole;
  } catch {
    return tokenRole;
  }
};

const canPostNotice = async (userId) => {
  const user = await User.findById(userId).select('role canPostNotices');
  if (!user) return false;

  if (['admin', 'teacher', 'faculty', 'coordinator'].includes(user.role)) return true;
  return user.role === 'student' && Boolean(user.canPostNotices);
};

const buildFilters = (query) => {
  const { q, priority, category, activeOnly = 'true' } = query;
  const filters = {};
  const andClauses = [];

  if (q && q.trim()) {
    andClauses.push({
      $or: [
        { title: { $regex: q.trim(), $options: 'i' } },
        { content: { $regex: q.trim(), $options: 'i' } },
        { category: { $regex: q.trim(), $options: 'i' } }
      ]
    });
  }

  if (priority && priority !== 'All' && NOTICE_PRIORITIES.includes(priority)) {
    filters.priority = priority;
  }

  if (category && category !== 'All') {
    filters.category = category.trim();
  }

  if (activeOnly !== 'false') {
    andClauses.push({
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: null },
        { expiryDate: { $gte: new Date() } }
      ]
    });
  }

  if (andClauses.length > 0) {
    filters.$and = andClauses;
  }

  return filters;
};

const getSortConfig = (sortBy = 'newest') => {
  switch (sortBy) {
    case 'oldest':
      return { createdAt: 1 };
    case 'priority':
      return { priority: -1, createdAt: -1 };
    case 'expiry':
      return { expiryDate: 1, createdAt: -1 };
    case 'newest':
    default:
      return { createdAt: -1 };
  }
};

const normalizeIncomingNotice = (req) => {
  const title = (req.body.title || '').toString();
  const content = (req.body.content || req.body.description || '').toString();
  const category = (req.body.category || '').toString();
  const priority = (req.body.priority || 'Low').toString();
  const isPinned = req.body.isPinned === true || req.body.isPinned === 'true';
  const expiryDate = normalizeExpiryDate(req.body.expiryDate);
  const image = req.file ? req.file.filename : (req.body.image || '');

  return {
    title,
    content,
    category,
    priority,
    isPinned,
    expiryDate,
    image
  };
};

// Create notice (modern)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const hasPermission = await canPostNotice(req.user.id);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admin/faculty/teacher/coordinator (or approved student coordinators) can post notices' });
    }

    const incoming = normalizeIncomingNotice(req);
    const validationError = validateNoticePayload(incoming);
    if (validationError) return res.status(400).json({ message: validationError });

    const notice = await Notice.create({
      title: incoming.title.trim(),
      content: incoming.content.trim(),
      description: incoming.content.trim(),
      category: incoming.category ? incoming.category.trim() : '',
      priority: incoming.priority || 'Low',
      isPinned: Boolean(incoming.isPinned),
      expiryDate: incoming.expiryDate,
      image: incoming.image || '',
      createdBy: req.user.id,
      postedBy: req.user.id
    });

    const populated = await Notice.findById(notice._id).populate('createdBy', 'name role');
    await logNoticeChange({ action: 'create', req, noticeAfter: populated, UserModel: User });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create notice (legacy alias + multipart)
router.post('/create', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const hasPermission = await canPostNotice(req.user.id);
    if (!hasPermission) {
      return res.status(403).json({ message: 'Only admin/faculty/teacher/coordinator (or approved student coordinators) can post notices' });
    }

    const incoming = normalizeIncomingNotice(req);
    const validationError = validateNoticePayload(incoming);
    if (validationError) return res.status(400).json({ message: validationError });

    const notice = await Notice.create({
      title: incoming.title.trim(),
      content: incoming.content.trim(),
      description: incoming.content.trim(),
      category: incoming.category ? incoming.category.trim() : '',
      priority: incoming.priority || 'Low',
      isPinned: Boolean(incoming.isPinned),
      expiryDate: incoming.expiryDate,
      image: incoming.image || '',
      createdBy: req.user.id,
      postedBy: req.user.id
    });

    const populated = await Notice.findById(notice._id).populate('createdBy', 'name role');
    await logNoticeChange({ action: 'create', req, noticeAfter: populated, UserModel: User });
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List notices (modern paginated)
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const filters = buildFilters(req.query);
    const sort = getSortConfig(req.query.sortBy);

    const [notices, total] = await Promise.all([
      Notice.find(filters)
        .populate('createdBy', 'name role')
        .sort({ isPinned: -1 })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      Notice.countDocuments(filters)
    ]);

    res.json({
      data: notices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// List notices (legacy alias)
  router.get('/all', async (req, res) => {
    try {
      const filters = buildFilters(req.query);
      const sort = getSortConfig(req.query.sortBy);

      const notices = await Notice.find(filters)
      .populate('createdBy', 'name role')
      .populate('postedBy', 'name role')
      .sort({ isPinned: -1 })
      .sort(sort);

      res.json(notices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notice
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    const before = extractNoticeForLog(notice);

    const isOwner = notice.createdBy && notice.createdBy.toString() === req.user.id;
    const role = await getRequesterRole(req);
    const isAdmin = role === 'admin';
    const canManage =
      role === 'teacher' ||
      role === 'faculty' ||
      role === 'coordinator';
    if (!isOwner && !isAdmin && !canManage) {
      return res.status(403).json({ message: 'Only owner, faculty/teacher/coordinator, or admin can edit notices' });
    }

    const incoming = normalizeIncomingNotice(req);
    const validationError = validateNoticePayload(incoming);
    if (validationError) return res.status(400).json({ message: validationError });

    notice.title = incoming.title.trim();
    notice.content = incoming.content.trim();
    notice.category = incoming.category ? incoming.category.trim() : '';
    notice.priority = incoming.priority || 'Low';
    notice.isPinned = typeof req.body.isPinned === 'boolean' ? req.body.isPinned : Boolean(notice.isPinned);
    notice.expiryDate = incoming.expiryDate;
    if (incoming.image) notice.image = incoming.image;

    await notice.save();
    const populated = await Notice.findById(notice._id).populate('createdBy', 'name role');
    await logNoticeChange({ action: 'update', req, noticeBefore: before, noticeAfter: populated, UserModel: User });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pin/unpin notice
router.patch('/:id/pin', authMiddleware, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    const before = extractNoticeForLog(notice);

    const isOwner = notice.createdBy && notice.createdBy.toString() === req.user.id;
    const role = await getRequesterRole(req);
    const isAdmin = role === 'admin';
    const canManage =
      role === 'teacher' ||
      role === 'faculty' ||
      role === 'coordinator';
    if (!isOwner && !isAdmin && !canManage) {
      return res.status(403).json({ message: 'Only owner, faculty/teacher/coordinator, or admin can pin notices' });
    }

    notice.isPinned = Boolean(req.body.isPinned);
    await notice.save();

    const populated = await Notice.findById(notice._id).populate('createdBy', 'name role');
    await logNoticeChange({
      action: 'pin',
      req,
      noticeBefore: before,
      noticeAfter: populated,
      meta: { isPinned: Boolean(req.body.isPinned) },
      UserModel: User
    });
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notice
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: 'Notice not found' });
    const before = extractNoticeForLog(notice);

    const isOwner = notice.createdBy && notice.createdBy.toString() === req.user.id;
    const role = await getRequesterRole(req);
    const isAdmin = role === 'admin';
    const isTeacher =
      role === 'teacher' ||
      role === 'faculty' ||
      role === 'coordinator';

    if (!isOwner && !isAdmin && !isTeacher) {
      return res.status(403).json({ message: 'Only owner, faculty/teacher/coordinator, or admin can delete notices' });
    }

    await Notice.findByIdAndDelete(req.params.id);
    await logNoticeChange({ action: 'delete', req, noticeBefore: before, UserModel: User });
    res.json({ message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
