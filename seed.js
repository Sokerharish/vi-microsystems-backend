/* ============================================================
   Vi Microsystems Backend — Database Seed Script
   Populates the database with initial products from the frontend catalog
   ============================================================ */

const { prepare } = require('./db/setup');
const db = { prepare };

const products = [
  {
    product_id: 'esp32',
    name: 'MR Robo ESP32',
    description: 'micro-ROS on ESP32 with BTS7960 motor driver, MPU6050 IMU, dual ultrasonic sensors and LiFePO4 battery pack. Ready for real-time ROS2 robotics development.',
    price_inr: 9999,
    is_placeholder: 1,
    image_url: 'robo esp32.png',
    page_url: 'products/esp32.html',
    category: 'Robotics',
    specifications: 'ESP32, BTS7960, MPU6050, Dual Ultrasonic, LiFePO4 Battery',
    stock_quantity: 50
  },
  {
    product_id: 'unoq',
    name: 'MR Robo UNO Q',
    description: 'Qualcomm QRB2210 + STM32U585, dual LiDAR, USB camera and 30Ah battery. The most capable mid-range robot for full SLAM and autonomous navigation.',
    price_inr: 9999,
    is_placeholder: 1,
    image_url: 'robo uno.png',
    page_url: 'products/unoq.html',
    category: 'Robotics',
    specifications: 'Qualcomm QRB2210, STM32U585, Dual LiDAR, USB Camera, 30Ah Battery',
    stock_quantity: 30
  },
  {
    product_id: 'orin',
    name: 'MR Robo Jetson Orin',
    description: 'NVIDIA Ampere GPU, 8GB LPDDR5, 512GB NVMe. Run SLAM, autonomous navigation, and deep learning inference simultaneously at the edge.',
    price_inr: 9999,
    is_placeholder: 1,
    image_url: 'Screenshot 2026-05-21 114115.png',
    page_url: 'products/orin.html',
    category: 'Robotics',
    specifications: 'NVIDIA Ampere GPU, 8GB LPDDR5, 512GB NVMe',
    stock_quantity: 20
  },
  {
    product_id: 'cobot',
    name: 'ASYSTR 3C Cobot',
    description: '3 kg payload, ±0.02 mm repeatability, ROS2 MoveIt compatible. Safe human-robot collaboration without safety cages.',
    price_inr: 1457142,
    is_placeholder: 0,
    image_url: 'soker2.jpg',
    page_url: 'products/cobot.html',
    category: 'Industrial Automation',
    specifications: '3 kg payload, ±0.02 mm repeatability, ROS2 MoveIt compatible',
    stock_quantity: 10
  },
  {
    product_id: 'vilan',
    name: 'Vi LaN-05 Trainer',
    description: '28 experiments covering all topologies, TCP/IP stack, AES, RSA, Diffie-Hellman and more. Anna University ECE syllabus compatible.',
    price_inr: 88660,
    is_placeholder: 0,
    image_url: 'soker3.png',
    page_url: 'products/vilan.html',
    category: 'Networking',
    specifications: '28 experiments, TCP/IP stack, AES, RSA, Diffie-Hellman',
    stock_quantity: 100
  },
  {
    product_id: 'dsp379d',
    name: 'TMS320F28379D PWM Controller',
    description: '200 MHz dual C28x DSP, 16 HRPWMs, FOC/DTC/Sensorless control for PMSM and Induction motors. Complete power electronics lab platform.',
    price_inr: 25234,
    is_placeholder: 0,
    image_url: 'soker5.png',
    page_url: 'products/dsp379d.html',
    category: 'Power Electronics',
    specifications: '200 MHz dual C28x DSP, 16 HRPWMs, FOC/DTC/Sensorless control',
    stock_quantity: 75
  },
  {
    product_id: 'llmchatbot',
    name: 'Local LLM AI ChatBot Kit',
    description: 'Build your own local AI chatbot with this complete kit. Includes hardware and software for running LLMs locally.',
    price_inr: 9999,
    is_placeholder: 1,
    image_url: 'SOKER HARISH.jpeg',
    page_url: 'products/llmchatbot.html',
    category: 'AI/ML',
    specifications: 'Complete kit for local LLM deployment',
    stock_quantity: 40
  }
];

const blogPosts = [
  {
    title: 'Getting Started with MR Robo ESP32',
    slug: 'getting-started-mr-robo-esp32',
    excerpt: 'Learn how to set up and program your MR Robo ESP32 for ROS2 robotics development.',
    content: 'The MR Robo ESP32 is an excellent platform for learning robotics and ROS2. In this guide, we will walk you through the initial setup, calibration, and your first autonomous navigation project.',
    author: 'Vi Microsystems Team',
    category: 'Tutorials',
    is_published: 1
  },
  {
    title: 'Understanding SLAM with UNO Q',
    slug: 'understanding-slam-uno-q',
    excerpt: 'Deep dive into Simultaneous Localization and Mapping using the powerful MR Robo UNO Q platform.',
    content: 'SLAM is a fundamental technique in robotics. The MR Robo UNO Q with its dual LiDAR sensors provides the perfect hardware for implementing and understanding SLAM algorithms.',
    author: 'Vi Microsystems Team',
    category: 'Technical',
    is_published: 1
  },
  {
    title: 'Edge AI with Jetson Orin',
    slug: 'edge-ai-jetson-orin',
    excerpt: 'Explore the capabilities of running deep learning inference at the edge with NVIDIA Jetson Orin.',
    content: 'The MR Robo Jetson Orin brings 67 TOPS of AI performance to the edge. Learn how to deploy and optimize your neural networks for real-time inference.',
    author: 'Guest Author',
    category: 'AI/ML',
    is_published: 0
  }
];

console.log('Seeding database...');

// Seed products
products.forEach(product => {
  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO products (product_id, name, description, price_inr, is_placeholder, image_url, page_url, category, specifications, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insert.run(
      product.product_id,
      product.name,
      product.description,
      product.price_inr,
      product.is_placeholder,
      product.image_url,
      product.page_url,
      product.category,
      product.specifications,
      product.stock_quantity
    );
    console.log(`✓ Seeded product: ${product.name}`);
  } catch (err) {
    console.error(`✗ Failed to seed product ${product.name}:`, err.message);
  }
});

// Seed blog posts
blogPosts.forEach(post => {
  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO blog_posts (title, slug, excerpt, content, author, category, is_published, published_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);
    insert.run(
      post.title,
      post.slug,
      post.excerpt,
      post.content,
      post.author,
      post.category,
      post.is_published,
      post.is_published ? "datetime('now')" : null
    );
    console.log(`✓ Seeded blog post: ${post.title}`);
  } catch (err) {
    console.error(`✗ Failed to seed blog post ${post.title}:`, err.message);
  }
});

console.log('Database seeding complete!');
