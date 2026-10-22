const router = require('express').Router();
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');
const roles = require('../middleware/roles');
const upload = require('../middleware/upload');

const prisma = new PrismaClient();

// GET /api/products — public, with optional ?category=WOMEN&search=dress
router.get('/', async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const where = {
    isAvailable: true,
    ...(category && { category }),
    ...(search && { title: { contains: search, mode: 'insensitive' } }),
  };
  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { vendor: { select: { shopName: true, location: true } } },
        skip: (page - 1) * limit,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { vendor: { select: { shopName: true, location: true, user: { select: { phone: true } } } } },
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products — vendor only (supports file upload or URL)
router.post('/', auth, roles('VENDOR'), upload.single('photo'), async (req, res) => {
  try {
    const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } });
    if (!vendor) return res.status(404).json({ message: 'Vendor profile not found' });

    const photos = req.file
      ? [req.file.path]
      : req.body.photos
        ? (Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos])
        : [];

    const product = await prisma.product.create({
      data: {
        title: req.body.title,
        description: req.body.description || '',
        price: Number(req.body.price),
        category: req.body.category,
        size: req.body.size,
        condition: req.body.condition,
        photos,
        vendorId: vendor.id,
      },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/products/:id — vendor only
router.put('/:id', auth, roles('VENDOR'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/products/:id — vendor or admin
router.delete('/:id', auth, roles('VENDOR', 'ADMIN'), async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
