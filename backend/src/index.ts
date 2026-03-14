import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

app.use(cors());
app.use(express.json());

// ───── Auth Middleware ─────────────────────────
function auth(req: any, res: any, next: any) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ error: 'No token' });
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ───── Health ──────────────────────────────────
app.get('/', (req, res) => res.json({ message: 'Inventrix API' }));
app.get('/api/status', (req, res) => res.json({ status: 'ok', service: 'Inventrix Express Backend' }));

// ───── Auth ────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name } });
    res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Stats ────────────────────────────────────
app.get('/api/stats', auth, async (req, res) => {
  try {
    const totalProducts = await prisma.product.count();
    const pendingReceipts = await prisma.receipt.count({ where: { status: 'DRAFT' } });
    const lowStockLevels = await prisma.stockLevel.findMany({ include: { product: true } });
    const lowStock = lowStockLevels.filter(sl => sl.product.reorderPoint > 0 && sl.quantity <= sl.product.reorderPoint).length;
    const outOfStock = await prisma.stockLevel.count({ where: { quantity: 0 } });
    res.json({ totalProducts, pendingReceipts, lowStock, outOfStock });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Products ─────────────────────────────────
app.get('/api/products', auth, async (req, res) => {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
  res.json(products);
});

app.post('/api/products', auth, async (req, res) => {
  try {
    const { name, sku, unitOfMeasure = 'units', reorderPoint = 0 } = req.body;
    if (!name || !sku) return res.status(400).json({ error: 'Name and SKU required' });
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) return res.status(400).json({ error: 'SKU already exists' });
    const product = await prisma.product.create({ data: { name, sku, unitOfMeasure, reorderPoint } });
    res.json(product);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/products/:id', auth, async (req, res) => {
  try {
    const { name, sku, unitOfMeasure, reorderPoint } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, sku, unitOfMeasure, reorderPoint }
    });
    res.json(product);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/products/:id', auth, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Warehouses ───────────────────────────────
app.get('/api/warehouses', auth, async (req, res) => {
  const wh = await prisma.warehouse.findMany({ orderBy: { name: 'asc' } });
  res.json(wh);
});

app.post('/api/warehouses', auth, async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const wh = await prisma.warehouse.create({ data: { name, location } });
    res.json(wh);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/warehouses/:id', auth, async (req, res) => {
  try {
    const { name, location } = req.body;
    const wh = await prisma.warehouse.update({ where: { id: req.params.id }, data: { name, location } });
    res.json(wh);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/warehouses/:id', auth, async (req, res) => {
  try {
    await prisma.warehouse.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Receipts ─────────────────────────────────
app.get('/api/receipts', auth, async (req, res) => {
  const receipts = await prisma.receipt.findMany({
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(receipts);
});

app.post('/api/receipts', auth, async (req, res) => {
  try {
    const { supplier, lines } = req.body;
    const receipt = await prisma.receipt.create({
      data: {
        supplier,
        lines: { create: lines?.map((l: any) => ({ productId: l.productId, quantity: l.quantity })) || [] }
      },
      include: { lines: true }
    });
    res.json(receipt);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.put('/api/receipts/:id/confirm', auth, async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: req.params.id }, include: { lines: true }
    });
    if (!receipt) return res.status(404).json({ error: 'Not found' });
    if (receipt.status !== 'DRAFT') return res.status(400).json({ error: 'Already processed' });

    const defaultWh = await prisma.warehouse.findFirst();
    if (!defaultWh) return res.status(400).json({ error: 'No warehouse exists. Create one first.' });

    for (const line of receipt.lines) {
      const existing = await prisma.stockLevel.findUnique({
        where: { productId_warehouseId: { productId: line.productId, warehouseId: defaultWh.id } }
      });
      if (existing) {
        await prisma.stockLevel.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + line.quantity }
        });
      } else {
        await prisma.stockLevel.create({
          data: { productId: line.productId, warehouseId: defaultWh.id, quantity: line.quantity }
        });
      }
      await prisma.stockLedger.create({
        data: { productId: line.productId, warehouseId: defaultWh.id, change: line.quantity, type: 'RECEIPT', refId: receipt.id }
      });
    }

    const updated = await prisma.receipt.update({ where: { id: receipt.id }, data: { status: 'DONE' } });
    res.json(updated);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Deliveries ───────────────────────────────
app.get('/api/deliveries', auth, async (req, res) => {
  const deliveries = await prisma.deliveryOrder.findMany({
    include: { lines: { include: { product: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(deliveries);
});

app.post('/api/deliveries', auth, async (req, res) => {
  try {
    const { customer, lines } = req.body;
    const delivery = await prisma.deliveryOrder.create({
      data: {
        customer,
        lines: { create: lines?.map((l: any) => ({ productId: l.productId, quantity: l.quantity })) || [] }
      },
      include: { lines: true }
    });
    res.json(delivery);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Transfers ────────────────────────────────
app.get('/api/transfers', auth, async (req, res) => {
  const transfers = await prisma.transfer.findMany({
    include: {
      fromWarehouse: true,
      toWarehouse: true,
      lines: { include: { product: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  res.json(transfers);
});

app.post('/api/transfers', auth, async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, lines } = req.body;
    if (!fromWarehouseId || !toWarehouseId) return res.status(400).json({ error: 'Both warehouses required' });
    const transfer = await prisma.transfer.create({
      data: {
        fromWarehouseId,
        toWarehouseId,
        lines: { create: lines?.map((l: any) => ({ productId: l.productId, quantity: l.quantity })) || [] }
      },
      include: { lines: true, fromWarehouse: true, toWarehouse: true }
    });
    res.json(transfer);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

// ───── Stock Levels ─────────────────────────────
app.get('/api/stock', auth, async (req, res) => {
  const stock = await prisma.stockLevel.findMany({
    include: { product: true, warehouse: true },
    orderBy: { updatedAt: 'desc' }
  });
  res.json(stock);
});

// ───── Stock Ledger ─────────────────────────────
app.get('/api/ledger', auth, async (req, res) => {
  const ledger = await prisma.stockLedger.findMany({
    include: { product: true, warehouse: true },
    orderBy: { timestamp: 'desc' },
    take: 100
  });
  res.json(ledger);
});

// ───── Adjustments ──────────────────────────────
app.get('/api/adjustments', auth, async (req, res) => {
  const adjustments = await prisma.adjustment.findMany({
    include: { product: true, warehouse: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(adjustments);
});

app.post('/api/adjustments', auth, async (req, res) => {
  try {
    const { productId, warehouseId, newQty, reason } = req.body;
    const existing = await prisma.stockLevel.findUnique({
      where: { productId_warehouseId: { productId, warehouseId } }
    });
    const oldQty = existing?.quantity ?? 0;
    await prisma.stockLevel.upsert({
      where: { productId_warehouseId: { productId, warehouseId } },
      update: { quantity: newQty },
      create: { productId, warehouseId, quantity: newQty }
    });
    const adj = await prisma.adjustment.create({ data: { productId, warehouseId, oldQty, newQty, reason } });
    await prisma.stockLedger.create({
      data: { productId, warehouseId, change: newQty - oldQty, type: 'ADJUSTMENT', refId: adj.id }
    });
    res.json(adj);
  } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
});

app.listen(PORT, () => {
  console.log(`✅ Express server running on http://localhost:${PORT}`);
});
