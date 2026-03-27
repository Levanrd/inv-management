import dotenv from 'dotenv'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Category from '../models/Category.js'
import Supplier from '../models/Supplier.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'

dotenv.config()

const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin1234'
const testUserPassword = process.env.SEED_TEST_PASSWORD || 'TestUser1234'

const defaultUsers = [
  {
    user_name: 'admin',
    first_name: 'System',
    last_name: 'Administrator',
    email: 'admin@example.com',
    password: adminPassword,
    role: 'admin',
  },
  {
    user_name: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    email: 'testuser@example.com',
    password: testUserPassword,
    role: 'user',
  },
]

const categorySeeds = [
  { category_name: 'Electronics', description: 'Devices, accessories, and office electronics.' },
  { category_name: 'Office Supplies', description: 'Day-to-day workplace consumables and tools.' },
  { category_name: 'Storage', description: 'Containers, shelving, and stock organization items.' },
]

const supplierSeeds = [
  {
    supplier_name: 'Northwind Office Supply',
    contact_info: {
      address: '120 Finance Street, Makati City',
      phone: '09171234567',
      email: 'sales@northwind-office.test',
    },
  },
  {
    supplier_name: 'Pacific Trade Depot',
    contact_info: {
      address: '55 Commerce Avenue, Pasig City',
      phone: '09179876543',
      email: 'orders@pacific-trade.test',
    },
  },
  {
    supplier_name: 'Summit Storage Solutions',
    contact_info: {
      address: '88 Warehouse Road, Quezon City',
      phone: '09175551234',
      email: 'hello@summit-storage.test',
    },
  },
]

const productSeeds = [
  {
    sku: 'EL-MON-24',
    product_name: '24-inch LED Monitor',
    description: 'Full HD monitor for office workstations.',
    price: 6999,
    stock_qty: 18,
    category: 'Electronics',
    supplier: 'Northwind Office Supply',
  },
  {
    sku: 'EL-KBD-MECH',
    product_name: 'Mechanical Keyboard',
    description: 'Durable keyboard with tactile switches.',
    price: 2499,
    stock_qty: 32,
    category: 'Electronics',
    supplier: 'Pacific Trade Depot',
  },
  {
    sku: 'OS-PAPER-A4',
    product_name: 'A4 Bond Paper Box',
    description: 'Five-ream office paper box.',
    price: 1240,
    stock_qty: 60,
    category: 'Office Supplies',
    supplier: 'Northwind Office Supply',
  },
  {
    sku: 'OS-PEN-BLK',
    product_name: 'Black Ballpen Pack',
    description: 'Pack of 12 black ballpens.',
    price: 180,
    stock_qty: 95,
    category: 'Office Supplies',
    supplier: 'Pacific Trade Depot',
  },
  {
    sku: 'ST-BIN-XL',
    product_name: 'Stackable Storage Bin',
    description: 'Large bin for inventory organization.',
    price: 540,
    stock_qty: 24,
    category: 'Storage',
    supplier: 'Summit Storage Solutions',
  },
  {
    sku: 'ST-RACK-4L',
    product_name: '4-Layer Metal Rack',
    description: 'Heavy-duty rack for stockroom use.',
    price: 4200,
    stock_qty: 9,
    category: 'Storage',
    supplier: 'Summit Storage Solutions',
  },
]

const orderSeeds = [
  {
    userEmail: 'admin@example.com',
    status: 'completed',
    items: [
      { sku: 'OS-PAPER-A4', quantity: 3 },
      { sku: 'OS-PEN-BLK', quantity: 5 },
    ],
  },
  {
    userEmail: 'testuser@example.com',
    status: 'pending',
    items: [
      { sku: 'EL-MON-24', quantity: 1 },
      { sku: 'EL-KBD-MECH', quantity: 1 },
      { sku: 'ST-BIN-XL', quantity: 2 },
    ],
  },
]

const ensureUsers = async () => {
  const users = []

  for (const seed of defaultUsers) {
    let user = await User.findOne({ email: seed.email })
    if (!user) {
      user = new User(seed)
      await user.save()
    }
    users.push(user)
  }

  return users
}

const buildOrderItem = (product, quantity) => ({
  product: product._id,
  quantity,
  price: Number(product.price),
  subtotal: Number((Number(product.price) * quantity).toFixed(2)),
  productSnapshot: {
    product_name: product.product_name,
    sku: product.sku || '',
  },
})

const seedSampleData = async () => {
  const mongoUri = process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error('MONGO_URI is required to seed sample data')
  }

  await mongoose.connect(mongoUri)

  try {
    console.log('Connected to MongoDB')
    console.log('Ensuring default users exist...')
    const users = await ensureUsers()
    const userMap = new Map(users.map((user) => [user.email, user]))

    console.log('Clearing existing sample collections...')
    await Order.deleteMany({})
    await Product.deleteMany({})
    await Category.deleteMany({})
    await Supplier.deleteMany({})

    console.log('Creating categories...')
    const categories = await Category.insertMany(categorySeeds)
    const categoryMap = new Map(categories.map((category) => [category.category_name, category]))

    console.log('Creating suppliers...')
    const suppliers = await Supplier.insertMany(supplierSeeds)
    const supplierMap = new Map(suppliers.map((supplier) => [supplier.supplier_name, supplier]))

    console.log('Creating products...')
    const products = await Product.insertMany(
      productSeeds.map((product) => ({
        sku: product.sku,
        product_name: product.product_name,
        description: product.description,
        price: product.price,
        stock_qty: product.stock_qty,
        category: categoryMap.get(product.category)._id,
        supplier: supplierMap.get(product.supplier)._id,
      }))
    )
    const productMap = new Map(products.map((product) => [product.sku, product]))

    console.log('Creating orders...')
    for (const seed of orderSeeds) {
      const user = userMap.get(seed.userEmail)

      if (!user) {
        throw new Error(`Missing user for seed order: ${seed.userEmail}`)
      }

      const orderItems = seed.items.map(({ sku, quantity }) => {
        const product = productMap.get(sku)

        if (!product) {
          throw new Error(`Missing product for seed order item: ${sku}`)
        }

        return buildOrderItem(product, quantity)
      })

      const totalAmount = Number(
        orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)
      )

      await Order.create({
        user: user._id,
        status: seed.status,
        total_amount: totalAmount,
        order_items: orderItems,
      })

      for (const item of seed.items) {
        await Product.findByIdAndUpdate(productMap.get(item.sku)._id, {
          $inc: { stock_qty: -item.quantity },
        })
      }
    }

    console.log('Sample data created successfully.')
    console.log(`Categories: ${categories.length}`)
    console.log(`Suppliers: ${suppliers.length}`)
    console.log(`Products: ${products.length}`)
    console.log(`Orders: ${orderSeeds.length}`)
    console.log('Users available:')
    console.log(`- admin: admin@example.com / ${adminPassword}`)
    console.log(`- user: testuser@example.com / ${testUserPassword}`)
  } finally {
    await mongoose.disconnect()
  }
}

seedSampleData().catch((error) => {
  console.error('Failed to seed sample data:', error)
  process.exit(1)
})
