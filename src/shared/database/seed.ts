import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../../modules/auth/auth.model.js";
import { Product } from "../../modules/product/product.model.js";
import { Inventory } from "../../modules/inventory/inventory.model.js";
import { Order } from "../../modules/order/order.model.js";
import { Cart } from "../../modules/cart/cart.model.js";
import { connectDb } from "./connectDb.js";
import { connectRedis, disconnectRedis, redisClient } from "../config/redis.js";

const SEED_PRODUCTS = [
  {
    name: "Apex Mechanical Keyboard",
    slug: "apex-mechanical-keyboard",
    description: "Anodized CNC aluminum body with hot-swappable tactile switches and sound-dampening silicone gasket mount.",
    price: 159.0,
    category: "Electronics",
    stock: 45,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Aura Pro Wireless Headphones",
    slug: "aura-pro-wireless-headphones",
    description: "Precision spatial audio with adaptive hybrid active noise cancellation and 40-hour battery life.",
    price: 289.0,
    category: "Electronics",
    stock: 28,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Lumina 4K Ultra-Thin Monitor",
    slug: "lumina-4k-ultra-thin-monitor",
    description: "27-inch 4K IPS panel with 99% DCI-P3 color gamut, 90W USB-C power delivery, and ultra-slim bezel.",
    price: 649.0,
    category: "Electronics",
    stock: 12,
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Minimalist MagSafe Charging Dock",
    slug: "minimalist-magsafe-charging-dock",
    description: "Machined from solid brass and coated in matte ceramic for seamless, fast wireless charging.",
    price: 69.0,
    category: "Electronics",
    stock: 80,
    images: [
      "https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Merino Wool Everyday Hoodie",
    slug: "merino-wool-everyday-hoodie",
    description: "Ultra-fine New Zealand merino wool offering natural thermal regulation, odor resistance, and unmatched comfort.",
    price: 139.0,
    category: "Apparel",
    stock: 35,
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Tailored Linen Overshirt",
    slug: "tailored-linen-overshirt",
    description: "Relaxed silhouette woven from 100% Normandy flax linen with real horn buttons.",
    price: 95.0,
    category: "Apparel",
    stock: 4, // Low stock on purpose
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "StormShield All-Weather Shell",
    slug: "stormshield-all-weather-shell",
    description: "3-layer taped seam waterproof breathable jacket engineered for metropolitan commutes and mountain trails.",
    price: 219.0,
    category: "Apparel",
    stock: 22,
    images: [
      "https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Matte Titanium Automatic Watch",
    slug: "matte-titanium-automatic-watch",
    description: "Grade 5 titanium case housing a high-beat Japanese automatic movement with sapphire crystal and 100m water resistance.",
    price: 395.0,
    category: "Accessories",
    stock: 18,
    images: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Full-Grain Leather Cardholder",
    slug: "full-grain-leather-cardholder",
    description: "Vegetable-tanned Tuscan leather with hand-burnished edges and RFID-blocking core.",
    price: 45.0,
    category: "Accessories",
    stock: 65,
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Cordura Ballistic Commuter Backpack",
    slug: "cordura-ballistic-commuter-backpack",
    description: "Waterproof YKK zippers, dedicated padded 16-inch laptop compartment, and ergonomic magnetic chest clasp.",
    price: 175.0,
    category: "Accessories",
    stock: 30,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Ergonomic Mesh Executive Chair",
    slug: "ergonomic-mesh-executive-chair",
    description: "Dynamic lumbar support with multi-axis 4D armrests, breathable tension mesh, and aluminum alloy base.",
    price: 469.0,
    category: "Home & Living",
    stock: 15,
    images: [
      "https://images.unsplash.com/photo-1580481077111-e63d41f3e0c0?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Ceramic Minimalist Pour-Over Mug",
    slug: "ceramic-minimalist-pour-over-mug",
    description: "Hand-thrown stoneware mug finished in tactile matte speckled glaze. Microwave and dishwasher safe.",
    price: 32.0,
    category: "Home & Living",
    stock: 50,
    images: [
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "CloudStrider Zero Gravity Sneakers",
    slug: "cloudstrider-zero-gravity-sneakers",
    description: "Engineered knit upper with responsive supercritical foam midsole for all-day comfort and athletic agility.",
    price: 145.0,
    category: "Footwear",
    stock: 25,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
  {
    name: "Artisan Leather Chelsea Boots",
    slug: "artisan-leather-chelsea-boots",
    description: "Goodyear welted oiled bovine leather with durable Vibram lug outsoles and custom elastic side gussets.",
    price: 235.0,
    category: "Footwear",
    stock: 0, // Out of stock on purpose
    images: [
      "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&auto=format&fit=crop&q=80",
    ],
    isActive: true,
  },
];

async function seed() {
  console.log("🌱 Starting Lumina E-Commerce database seed...");

  await connectDb();

  try {
    await connectRedis();
    console.log("✅ Redis connected");
    // Flush redis cache
    await redisClient.flushAll();
    console.log("🧹 Redis cache flushed");
  } catch (e) {
    console.warn("⚠️ Redis cache cleanup skipped:", (e as any)?.message);
  }

  console.log("🗑️ Cleaning up existing database records...");
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Order.deleteMany({}),
    Cart.deleteMany({}),
  ]);

  console.log("👤 Creating seed users (Admin & Customer)...");
  const salt = await bcrypt.genSalt(10);

  const adminPasswordHash = await bcrypt.hash("Admin@123456", salt);
  const adminUser = await User.create({
    fullname: "Admin Lumina",
    email: "admin@lumina.dev",
    passwordHash: adminPasswordHash,
    role: "ADMIN",
    phone: "+1 800-555-0100",
    isEmailVerified: true,
  });

  const customerPasswordHash = await bcrypt.hash("Customer@123456", salt);
  const customerUser = await User.create({
    fullname: "Alex Johnson",
    email: "customer@lumina.dev",
    passwordHash: customerPasswordHash,
    role: "CUSTOMER",
    phone: "+1 555-0199",
    isEmailVerified: true,
  });

  console.log(`✅ Users created:
    - Admin:    admin@lumina.dev    / Admin@123456
    - Customer: customer@lumina.dev / Customer@123456`);

  console.log("📦 Seeding catalog products and synchronized inventories...");
  const createdProducts = [];
  for (const item of SEED_PRODUCTS) {
    const product = await Product.create(item);
    createdProducts.push(product);

    // Create synchronized inventory record
    await Inventory.create({
      productId: product._id,
      stock: product.stock,
      reservedStock: 0,
      lowStockThreshold: 5,
    });
  }
  console.log(`✅ Created ${createdProducts.length} products & inventories.`);

  console.log("🛒 Seeding default cart items for customer...");
  await Cart.create({
    userId: customerUser._id,
    items: [
      { productId: createdProducts[0]!._id, quantity: 1 },
      { productId: createdProducts[1]!._id, quantity: 2 },
    ],
  });

  console.log("📊 Generating historical orders for Executive Analytics...");
  const now = new Date();

  // Helper to subtract days
  const subDays = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  };

  const sampleOrders = [
    // Today
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[0]!._id,
          name: createdProducts[0]!.name,
          price: createdProducts[0]!.price,
          quantity: 2,
        },
        {
          productId: createdProducts[3]!._id,
          name: createdProducts[3]!.name,
          price: createdProducts[3]!.price,
          quantity: 1,
        },
      ],
      totalAmount: createdProducts[0]!.price * 2 + createdProducts[3]!.price,
      shippingAddress: "742 Evergreen Terrace, Springfield, OR 97477",
      status: "completed",
      createdAt: now,
    },
    // Yesterday
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[1]!._id,
          name: createdProducts[1]!.name,
          price: createdProducts[1]!.price,
          quantity: 1,
        },
      ],
      totalAmount: createdProducts[1]!.price,
      shippingAddress: "221B Baker Street, Marylebone, London NW1 6XE",
      status: "paid",
      createdAt: subDays(1),
    },
    // 3 days ago
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[2]!._id,
          name: createdProducts[2]!.name,
          price: createdProducts[2]!.price,
          quantity: 1,
        },
        {
          productId: createdProducts[7]!._id,
          name: createdProducts[7]!.name,
          price: createdProducts[7]!.price,
          quantity: 1,
        },
      ],
      totalAmount: createdProducts[2]!.price + createdProducts[7]!.price,
      shippingAddress: "1 Infinite Loop, Cupertino, CA 95014",
      status: "shipping",
      createdAt: subDays(3),
    },
    // 5 days ago
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[4]!._id,
          name: createdProducts[4]!.name,
          price: createdProducts[4]!.price,
          quantity: 2,
        },
      ],
      totalAmount: createdProducts[4]!.price * 2,
      shippingAddress: "10 Downing Street, London SW1A 2AA",
      status: "completed",
      createdAt: subDays(5),
    },
    // 8 days ago
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[6]!._id,
          name: createdProducts[6]!.name,
          price: createdProducts[6]!.price,
          quantity: 1,
        },
        {
          productId: createdProducts[8]!._id,
          name: createdProducts[8]!.name,
          price: createdProducts[8]!.price,
          quantity: 2,
        },
      ],
      totalAmount: createdProducts[6]!.price + createdProducts[8]!.price * 2,
      shippingAddress: "350 5th Ave, New York, NY 10118",
      status: "completed",
      createdAt: subDays(8),
    },
    // 12 days ago
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[10]!._id,
          name: createdProducts[10]!.name,
          price: createdProducts[10]!.price,
          quantity: 1,
        },
      ],
      totalAmount: createdProducts[10]!.price,
      shippingAddress: "405 Lexington Ave, New York, NY 10174",
      status: "completed",
      createdAt: subDays(12),
    },
    // 18 days ago
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[12]!._id,
          name: createdProducts[12]!.name,
          price: createdProducts[12]!.price,
          quantity: 2,
        },
      ],
      totalAmount: createdProducts[12]!.price * 2,
      shippingAddress: "100 Universal City Plaza, Universal City, CA 91608",
      status: "completed",
      createdAt: subDays(18),
    },
    // Pending order
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[9]!._id,
          name: createdProducts[9]!.name,
          price: createdProducts[9]!.price,
          quantity: 1,
        },
      ],
      totalAmount: createdProducts[9]!.price,
      shippingAddress: "77 Massachusetts Ave, Cambridge, MA 02139",
      status: "pending",
      createdAt: subDays(2),
    },
    // Cancelled order
    {
      userId: customerUser._id,
      items: [
        {
          productId: createdProducts[11]!._id,
          name: createdProducts[11]!.name,
          price: createdProducts[11]!.price,
          quantity: 1,
        },
      ],
      totalAmount: createdProducts[11]!.price,
      shippingAddress: "1060 W Addison St, Chicago, IL 60613",
      status: "cancelled",
      createdAt: subDays(6),
    },
  ];

  for (const o of sampleOrders) {
    await Order.create(o as any);
  }

  console.log(`✅ Seeded ${sampleOrders.length} historical orders.`);

  console.log("🎉 Database seeding completed successfully!");
  await mongoose.disconnect();
  try {
    await disconnectRedis();
  } catch {}
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed error:", err);
  process.exit(1);
});
