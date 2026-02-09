/**
 * Database Seeder - Populates the database with sample data
 * Run: npm run seed
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User.model');
const Category = require('../models/Category.model');
const Product = require('../models/Product.model');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB Connected for seeding');
};

const categories = [
  { name: 'Men', description: 'Shalwar Kameez for Men' },
  { name: 'Women', description: 'Shalwar Kameez for Women' },
  { name: 'Kids', description: 'Shalwar Kameez for Kids' },
  { name: 'Designer', description: 'Premium Designer Collection' },
  { name: 'Eid Collection', description: 'Special Eid Collection' },
  { name: 'Wedding Collection', description: 'Wedding & Formal Wear' },
  { name: 'Winter Collection', description: 'Warm Winter Fabrics' }
];

const sampleProducts = [
  {
    name: 'Classic White Cotton Shalwar Kameez',
    brand: 'Gul Ahmed',
    fabricType: 'Cotton',
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'White',
    price: 3500,
    stockQuantity: 50,
    description: 'Premium quality white cotton shalwar kameez, perfect for daily wear and office.',
    season: 'All Season',
    gender: 'Men',
    isFeatured: true,
    images: ['/uploads/products/white-cotton-men.jpg']
  },
  {
    name: 'Embroidered Lawn Suit',
    brand: 'Khaadi',
    fabricType: 'Lawn',
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'Blue',
    price: 5500,
    discountPrice: 4500,
    stockQuantity: 30,
    description: 'Beautiful embroidered lawn suit with intricate designs.',
    season: 'Summer',
    gender: 'Women',
    isFeatured: true,
    images: ['/uploads/products/lawn-blue-women.jpg']
  },
  {
    name: 'Kids Festive Shalwar Kameez',
    brand: 'Junaid Jamshed',
    fabricType: 'Silk',
    sizes: ['XS', 'S', 'M'],
    color: 'Gold',
    price: 4000,
    stockQuantity: 25,
    description: 'Elegant festive wear for kids, perfect for Eid and family gatherings.',
    season: 'Eid',
    gender: 'Kids',
    isFeatured: true,
    images: ['/uploads/products/kids-gold-silk.jpg']
  },
  {
    name: 'Premium Karandi Winter Suit',
    brand: 'Bonanza',
    fabricType: 'Karandi',
    sizes: ['M', 'L', 'XL', 'XXL'],
    color: 'Maroon',
    price: 6500,
    stockQuantity: 20,
    description: 'Warm and stylish karandi suit for winter season.',
    season: 'Winter',
    gender: 'Men',
    isFeatured: false,
    images: ['/uploads/products/karandi-maroon-men.jpg']
  },
  {
    name: 'Chiffon Party Wear',
    brand: 'Maria B',
    fabricType: 'Chiffon',
    sizes: ['S', 'M', 'L'],
    color: 'Pink',
    price: 12000,
    discountPrice: 9999,
    stockQuantity: 15,
    description: 'Elegant chiffon party wear with hand embroidery.',
    season: 'Wedding',
    gender: 'Women',
    isFeatured: true,
    images: ['/uploads/products/chiffon-pink-women.jpg']
  },
  {
    name: 'Printed Lawn Summer Collection',
    brand: 'Alkaram',
    fabricType: 'Lawn',
    sizes: ['S', 'M', 'L', 'XL'],
    color: 'Multi',
    price: 4200,
    stockQuantity: 40,
    description: 'Vibrant printed lawn for comfortable summer wear.',
    season: 'Summer',
    gender: 'Women',
    isFeatured: false,
    images: ['/uploads/products/lawn-printed-women.jpg']
  },
  {
    name: 'Khaddar Casual Suit',
    brand: 'Sapphire',
    fabricType: 'Khaddar',
    sizes: ['M', 'L', 'XL'],
    color: 'Grey',
    price: 4800,
    stockQuantity: 35,
    description: 'Comfortable khaddar suit for casual outings.',
    season: 'Winter',
    gender: 'Men',
    isFeatured: false,
    images: ['/uploads/products/khaddar-grey-men.jpg']
  },
  {
    name: 'Velvet Sherwani Collection',
    brand: 'HSY',
    fabricType: 'Velvet',
    sizes: ['M', 'L', 'XL'],
    color: 'Black',
    price: 25000,
    stockQuantity: 10,
    description: 'Luxurious velvet sherwani for weddings and formal events.',
    season: 'Wedding',
    gender: 'Men',
    isFeatured: true,
    images: ['/uploads/products/velvet-black-sherwani.jpg']
  }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      name: 'Admin User',
      email: 'admin@shalwarkameez.pk',
      password: hashedPassword,
      role: 'admin',
      phone: '03001234567'
    });

    // Create test user
    const userPassword = await bcrypt.hash('user123', 12);
    await User.create({
      name: 'Test User',
      email: 'user@test.pk',
      password: userPassword,
      role: 'user',
      phone: '03009876543',
      addresses: [{
        street: '123 Main Street, DHA',
        city: 'Lahore',
        province: 'Punjab',
        postalCode: '54000',
        isDefault: true
      }]
    });

    // Create categories
    console.log('📁 Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    // Assign categories to products
    const productsWithCategories = sampleProducts.map(product => {
      let categoryName = 'Men';
      if (product.gender === 'Women') categoryName = 'Women';
      if (product.gender === 'Kids') categoryName = 'Kids';
      if (product.season === 'Wedding') categoryName = 'Wedding Collection';
      if (product.season === 'Eid') categoryName = 'Eid Collection';
      if (product.season === 'Winter' && product.gender === 'Men') categoryName = 'Winter Collection';
      
      return {
        ...product,
        category: categoryMap[categoryName] || categoryMap['Men']
      };
    });

    // Create products
    console.log('📦 Creating products...');
    await Product.insertMany(productsWithCategories);

    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📧 Admin credentials:');
    console.log('   Email: admin@shalwarkameez.pk');
    console.log('   Password: admin123');
    console.log('');
    console.log('📧 Test user credentials:');
    console.log('   Email: user@test.pk');
    console.log('   Password: user123');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
