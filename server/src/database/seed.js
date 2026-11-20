import pool from './db.js';
import bcrypt from 'bcryptjs';
import sharp from 'sharp';
import imageService from '../services/image.service.js';

export async function runSeeder() {
  const connection = await pool.getConnection();
  try {
    console.log('--- Starting Seed Data for ZGlowra ---');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Truncate tables for fresh seed
    const tables = [
      'users', 'addresses', 'categories', 'products', 'product_images',
      'cart_items', 'wishlists', 'vouchers', 'orders', 'order_items',
      'payments', 'order_status_logs', 'reviews', 'suppliers',
      'supplier_products', 'purchases', 'purchase_items', 'stock_movements',
      'banners', 'pages', 'testimonials', 'settings', 'notifications'
    ];
    for (const t of tables) {
      await connection.query(`TRUNCATE TABLE ${t};`);
    }

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Users
    const [adminResult] = await connection.query(`
      INSERT INTO users (name, email, phone, password, role)
      VALUES ('Administrator ZGlowra', 'admin@zglowra.com', '081234567800', ?, 'admin')
    `, [hashedPassword]);
    const adminId = adminResult.insertId;

    const [sup1Result] = await connection.query(`
      INSERT INTO users (name, email, phone, password, role)
      VALUES ('Budi Santoso', 'supplier1@zglowra.com', '081234567891', ?, 'supplier')
    `, [hashedPassword]);
    const sup1UserId = sup1Result.insertId;

    const [sup2Result] = await connection.query(`
      INSERT INTO users (name, email, phone, password, role)
      VALUES ('Siti Rahmawati', 'supplier2@zglowra.com', '081234567892', ?, 'supplier')
    `, [hashedPassword]);
    const sup2UserId = sup2Result.insertId;

    const [custResult] = await connection.query(`
      INSERT INTO users (name, email, phone, password, role)
      VALUES ('Zahra Putri', 'pelanggan@zglowra.com', '081298765432', ?, 'customer')
    `, [hashedPassword]);
    const customerId = custResult.insertId;

    // 2. Suppliers
    const [supplier1Row] = await connection.query(`
      INSERT INTO suppliers (user_id, company_name, contact_person, phone, address)
      VALUES (?, 'PT Natural Glow Solusindo', 'Budi Santoso', '081234567891', 'Kawasan Industri Pulogadung Kav. 14, Jakarta Timur')
    `, [sup1UserId]);
    const supplier1Id = supplier1Row.insertId;

    const [supplier2Row] = await connection.query(`
      INSERT INTO suppliers (user_id, company_name, contact_person, phone, address)
      VALUES (?, 'CV Herbal Botanika Utama', 'Siti Rahmawati', '081234567892', 'Jl. Sukajadi No. 128, Kota Bandung')
    `, [sup2UserId]);
    const supplier2Id = supplier2Row.insertId;

    // 3. Addresses
    await connection.query(`
      INSERT INTO addresses (user_id, label, penerima, telepon, provinsi, kota, kecamatan, kode_pos, alamat_lengkap, is_default)
      VALUES (?, 'Rumah', 'Zahra Putri', '081298765432', 'DKI Jakarta', 'Jakarta Selatan', 'Cilandak', '12430', 'Jl. Terogong Raya No. 45B, Cilandak Barat', 1),
             (?, 'Kantor', 'Zahra Putri', '081298765432', 'DKI Jakarta', 'Jakarta Pusat', 'Sudirman', '10220', 'Gedung Menara Mandiri Lt. 8, Jl. Jend. Sudirman Kav. 54', 0)
    `, [customerId, customerId]);

    // 4. Categories
    const categoriesData = [
      { name: 'Body Lotion', slug: 'body-lotion', desc: 'Lotion pelembap bertekstur ringan dengan kandungan pencerah alami' },
      { name: 'Body Scrub', slug: 'body-scrub', desc: 'Lulur eksfoliasi berbutir halus untuk mengangkat sel kulit mati' },
      { name: 'Body Wash', slug: 'body-wash', desc: 'Sabun pembersih tubuh dengan busa melimpah dan aroma mewah' },
      { name: 'Body Butter', slug: 'body-butter', desc: 'Krim pelembap ekstra kaya untuk nutrisi mendalam kulit kering' },
      { name: 'Body Mist', slug: 'body-mist', desc: 'Semprotan keharuman tubuh segar memikat yang tahan lama' },
      { name: 'Perawatan Tangan & Kaki', slug: 'perawatan-tangan-kaki', desc: 'Perlindungan khusus untuk kelembutan telapak tangan dan tumit' },
    ];

    const categoryIds = {};
    for (const cat of categoriesData) {
      const [res] = await connection.query(`
        INSERT INTO categories (name, slug, description)
        VALUES (?, ?, ?)
      `, [cat.name, cat.slug, cat.desc]);
      categoryIds[cat.slug] = res.insertId;
    }

    // 5. Products (24 products, 4 per category)
    const rawProducts = [
      // Body Lotion
      {
        cat: 'body-lotion',
        name: 'Zfree Glow Gluta-Kojic Brightening Body Lotion 250ml',
        sku: 'ZG-BL-001',
        desc: 'Body lotion dengan kombinasi Glutathione dan Asam Kojat untuk membantu mencerahkan kulit kusam, meratakan warna kulit belang, dan memberikan hidrasi maksimal sepanjang hari. Tekstur cepat meresap tanpa rasa lengket.',
        ingredients: 'Aqua, Niacinamide, Glutathione, Kojic Acid, Shea Butter, Titanium Dioxide, Fragrance, Phenoxyethanol.',
        how_to_use: 'Usapkan secara merata ke seluruh tubuh setiap pagi dan malam setelah mandi. Gunakan rutin untuk hasil maksimal.',
        price: 89000,
        discount: 79000,
        stock: 55,
        weight: 280,
        featured: 1,
      },
      {
        cat: 'body-lotion',
        name: 'Zfree Glow Niacinamide Velvet Silk Body Lotion 250ml',
        sku: 'ZG-BL-002',
        desc: 'Lotion mewah dengan kandungan Niacinamide 5% dan ekstrak mutiara untuk kilau kulit tampak bercahaya, lembut bagai sutra, dan terlindung dari paparan radikal bebas.',
        ingredients: 'Aqua, Niacinamide 5%, Pearl Extract, Alpha Arbutin, Glyceryl Stearate, Dimethicone, Tocopheryl Acetate.',
        how_to_use: 'Aplikasikan pada tangan dan kaki dengan pijatan melingkar lembut hingga meresap sempurna.',
        price: 95000,
        discount: null,
        stock: 42,
        weight: 280,
        featured: 0,
      },
      {
        cat: 'body-lotion',
        name: 'Zfree Glow UV Defense Tone-Up Body Lotion SPF 35 200ml',
        sku: 'ZG-BL-003',
        desc: 'Lotion tabir surya berdaya lindung SPF 35 PA+++ dengan efek mencerahkan seketika alami tanpa residu abu-abu. Tahan keringat dan nyaman untuk aktivitas luar ruangan.',
        ingredients: 'Aqua, Ethylhexyl Methoxycinnamate, Zinc Oxide, Niacinamide, Centella Asiatica Extract, Glycerin.',
        how_to_use: 'Oleskan 15 menit sebelum beraktivitas di bawah sinar matahari. Ulangi pemakaian bila diperlukan.',
        price: 110000,
        discount: 99000,
        stock: 68,
        weight: 240,
        featured: 1,
      },
      {
        cat: 'body-lotion',
        name: 'Zfree Glow Goat Milk Ultra-Nourish Body Lotion 300ml',
        sku: 'ZG-BL-004',
        desc: 'Formula klasik susu kambing murni diperkaya vitamin A dan C yang melembapkan kulit kering dan bersisik secara mendalam.',
        ingredients: 'Aqua, Goat Milk Extract, Sweet Almond Oil, Collagen, Glycerin, Stearic Acid, Fragrance.',
        how_to_use: 'Gunakan secara teratur setelah mandi saat kulit masih sedikit lembap untuk penyerapan optimal.',
        price: 85000,
        discount: null,
        stock: 35,
        weight: 340,
        featured: 0,
      },

      // Body Scrub
      {
        cat: 'body-scrub',
        name: 'Zfree Glow Coffee & Cocoa Smoothing Body Scrub 200gr',
        sku: 'ZG-BS-001',
        desc: 'Lulur eksfoliasi biji kopi Robusta pilihan dan mentega kakao alami yang mengangkat sel kulit mati, menyamarkan selulit, dan menghaluskan area kasar.',
        ingredients: 'Coffea Robusta Seed Powder, Cocoa Butter, Sucrose, Olive Oil, Cetearyl Alcohol, Vitamin E.',
        how_to_use: 'Balurkan pada kulit kering atau sedikit basah, gosok perlahan dengan gerakan memutar selama 5 menit, lalu bilas hingga bersih.',
        price: 75000,
        discount: 68000,
        stock: 48,
        weight: 230,
        featured: 1,
      },
      {
        cat: 'body-scrub',
        name: 'Zfree Glow Strawberry Milk Peeling Body Scrub 200gr',
        sku: 'ZG-BS-002',
        desc: 'Scrub beraroma stroberi segar dengan butiran gula halus dan lactic acid yang mengangkat daki seketika dan membuat kulit glowing cerah merona.',
        ingredients: 'Sucrose, Fragaria Vesca Fruit Extract, Lactic Acid, Goat Milk, Jojoba Oil, Fragrance.',
        how_to_use: 'Gunakan 2 hingga 3 kali seminggu sebelum mandi. Bilas dengan air hangat.',
        price: 78000,
        discount: null,
        stock: 50,
        weight: 230,
        featured: 0,
      },
      {
        cat: 'body-scrub',
        name: 'Zfree Glow Green Tea Detoxifying Body Scrub 200gr',
        sku: 'ZG-BS-003',
        desc: 'Kombinasi daun teh hijau Jepang dan sea salt mineral untuk membersihkan pori-pori dari polusi, menenangkan kulit berjerawat punggung, dan mengembalikan kesegaran.',
        ingredients: 'Camellia Sinensis Leaf Extract, Sea Salt, Tea Tree Leaf Oil, Kaolin Clay, Glycerin.',
        how_to_use: 'Ratakan ke seluruh badan terutama area punggung dan dada. Diamkan 2 menit lalu bilas bersih.',
        price: 82000,
        discount: null,
        stock: 29,
        weight: 230,
        featured: 0,
      },
      {
        cat: 'body-scrub',
        name: 'Zfree Glow Gold Radiance Brightening Lulur 250gr',
        sku: 'ZG-BS-004',
        desc: 'Lulur tradisional modern dengan partikel emas mikro dan rempah pencerah temulawak untuk kulit berseri menawan layaknya putri keraton.',
        ingredients: 'Oryza Sativa Powder, Curcuma Heyneana Root, Gold Mica, Niacinamide, Olive Oil, Fragrance.',
        how_to_use: 'Campurkan dengan sedikit air bila perlu, gosokkan ke badan hingga daki terangkat sempurna.',
        price: 95000,
        discount: 85000,
        stock: 33,
        weight: 280,
        featured: 1,
      },

      // Body Wash
      {
        cat: 'body-wash',
        name: 'Zfree Glow Rose Petal Hydrating Body Wash 400ml',
        sku: 'ZG-BW-001',
        desc: 'Sabun cair pembersih tubuh dengan kelopak bunga mawar asli dan hyaluronic acid yang menjaga elastisitas serta kelembapan kulit saat mandi.',
        ingredients: 'Aqua, Sodium Laureth Sulfate, Rosa Damascena Flower Water, Sodium Hyaluronate, Cocamidopropyl Betaine, Fragrance.',
        how_to_use: 'Tuangkan secukupnya pada shower puff, busakan ke seluruh tubuh, lalu bilas dengan air bersih.',
        price: 85000,
        discount: 75000,
        stock: 60,
        weight: 460,
        featured: 1,
      },
      {
        cat: 'body-wash',
        name: 'Zfree Glow Cherry Blossom Bright & Clean Body Wash 400ml',
        sku: 'ZG-BW-002',
        desc: 'Formula berbusa melimpah dengan sari bunga sakura Jepang dan Arbutin untuk kulit harum semerbak, bersih bercahaya, dan lembut sepanjang hari.',
        ingredients: 'Aqua, Prunus Serrulata Flower Extract, Alpha Arbutin, Niacinamide, Glycerin, Sodium Chloride.',
        how_to_use: 'Gunakan setiap kali mandi untuk sensasi kesegaran musim semi Jepang yang menenangkan.',
        price: 88000,
        discount: null,
        stock: 45,
        weight: 460,
        featured: 0,
      },
      {
        cat: 'body-wash',
        name: 'Zfree Glow Tea Tree Acne Care Body Wash 400ml',
        sku: 'ZG-BW-003',
        desc: 'Dirancang khusus untuk merawat kulit punggung berjerawat dengan kandungan Tea Tree Oil dan Salicylic Acid 1%. Lembut dan tidak membuat kulit kering ketarik.',
        ingredients: 'Aqua, Salicylic Acid, Melaleuca Alternifolia Leaf Oil, Centella Asiatica, Aloe Vera Extract.',
        how_to_use: 'Usapkan busa pada area berjerawat, diamkan 1 menit, lalu bilas hingga tuntas.',
        price: 92000,
        discount: null,
        stock: 38,
        weight: 460,
        featured: 0,
      },
      {
        cat: 'body-wash',
        name: 'Zfree Glow Vanilla Cream Comfort Shower Gel 400ml',
        sku: 'ZG-BW-004',
        desc: 'Shower gel beraroma vanila manis hangat dengan kandungan shea butter cair yang memberikan kenyamanan santai saat mandi malam.',
        ingredients: 'Aqua, Butyrospermum Parkii Butter, Vanilla Planifolia Fruit Extract, Cocamide DEA, Citric Acid.',
        how_to_use: 'Tuang pada telapak tangan atau spons mandi, nikmati aroma menenangkan dan bilas hingga bersih.',
        price: 82000,
        discount: null,
        stock: 52,
        weight: 460,
        featured: 0,
      },

      // Body Butter
      {
        cat: 'body-butter',
        name: 'Zfree Glow Shea & Almond Deep Repair Body Butter 200gr',
        sku: 'ZG-BB-001',
        desc: 'Mentega tubuh pelembap intensif dengan konsentrasi tinggi Shea Butter murni dan Minyak Almond untuk memulihkan kulit yang sangat kering, bersisik, atau pecah-pecah.',
        ingredients: 'Butyrospermum Parkii Butter, Prunus Amygdalus Dulcis Oil, Ceramide NP, Beeswax, Tocopherol.',
        how_to_use: 'Ambil secukupnya, hangatkan di telapak tangan lalu aplikasikan pada siku, lutut, dan bagian tubuh yang membutuhkan kelembapan ekstra.',
        price: 115000,
        discount: 99000,
        stock: 40,
        weight: 240,
        featured: 1,
      },
      {
        cat: 'body-butter',
        name: 'Zfree Glow Mango Tropics Silky Body Butter 200gr',
        sku: 'ZG-BB-002',
        desc: 'Aroma mangga tropis segar yang membangkitkan semangat dipadu dengan mentega biji mangga yang meleleh lembut di atas kulit tanpa rasa berminyak.',
        ingredients: 'Mangifera Indica Seed Butter, Sunflower Seed Oil, Vitamin E, Niacinamide, Cetearyl Glucoside.',
        how_to_use: 'Balurkan merata sehabis berenang atau beraktivitas di ruangan ber-AC.',
        price: 110000,
        discount: null,
        stock: 31,
        weight: 240,
        featured: 0,
      },
      {
        cat: 'body-butter',
        name: 'Zfree Glow Lavender Relaxing Night Body Butter 200gr',
        sku: 'ZG-BB-003',
        desc: 'Perawatan malam tubuh dengan minyak esensial lavender Prancis yang menenangkan pikiran menjelang tidur sambil meregenerasi kelembapan kulit saat terlelap.',
        ingredients: 'Lavandula Angustifolia Oil, Chamomile Extract, Shea Butter, Macadamia Seed Oil, Glycerin.',
        how_to_use: 'Gunakan 30 menit sebelum tidur pada tangan, kaki, dan bahu untuk aromaterapi relaksasi optimal.',
        price: 120000,
        discount: 108000,
        stock: 25,
        weight: 240,
        featured: 1,
      },
      {
        cat: 'body-butter',
        name: 'Zfree Glow Coconut Milk Velvety Body Butter 200gr',
        sku: 'ZG-BB-004',
        desc: 'Nutrisi minyak kelapa organik dan santan murni yang melembutkan tekstur kulit kasar menjadi selembut beledu.',
        ingredients: 'Cocos Nucifera Oil, Coconut Extract, Cocoa Seed Butter, Stearyl Alcohol, Parfum.',
        how_to_use: 'Oleskan tebal pada tumit dan telapak kaki sebelum tidur, kenakan kaus kaki untuk hasil maksimal.',
        price: 105000,
        discount: null,
        stock: 34,
        weight: 240,
        featured: 0,
      },

      // Body Mist
      {
        cat: 'body-mist',
        name: 'Zfree Glow Sweet Jasmine Royal Body Mist 150ml',
        sku: 'ZG-BM-001',
        desc: 'Semprotan tubuh wewangian melati keraton yang anggun dan feminin. Tahan hingga 6-8 jam dengan formula tanpa noda pada pakaian.',
        ingredients: 'Alcohol Denat, Aqua, Fragrance (Parfum), Jasminum Sambac Flower Extract, PEG-40 Hydrogenated Castor Oil.',
        how_to_use: 'Semprotkan pada titik nadi pergelangan tangan, leher, dan belakang telinga dari jarak 15 cm.',
        price: 65000,
        discount: 55000,
        stock: 75,
        weight: 180,
        featured: 1,
      },
      {
        cat: 'body-mist',
        name: 'Zfree Glow Peachy Blossom Refreshing Mist 150ml',
        sku: 'ZG-BM-002',
        desc: 'Keharuman buah persik manis dipadu kelopak bunga peony yang ceria, segar, dan cocok menemani aktivitas harian generasi muda.',
        ingredients: 'Alcohol Denat, Aqua, Peach Fruit Extract, Paeonia Albiflora Flower Extract, Glycerin.',
        how_to_use: 'Semprotkan kapan saja Anda membutuhkan kesegaran instan di tengah kesibukan.',
        price: 68000,
        discount: null,
        stock: 58,
        weight: 180,
        featured: 0,
      },
      {
        cat: 'body-mist',
        name: 'Zfree Glow Vanilla Amber Seductive Mist 150ml',
        sku: 'ZG-BM-003',
        desc: 'Paduan aroma vanila gourmand yang mewah dengan sentuhan amber hangat yang meninggalkan jejak wangi memikat dan berkelas.',
        ingredients: 'Alcohol Denat, Aqua, Vanilla Planifolia Extract, Ambergris Accord, Propylene Glycol.',
        how_to_use: 'Semprotkan pada pakaian dan badan sebelum menghadiri acara malam atau pesta.',
        price: 72000,
        discount: 62000,
        stock: 44,
        weight: 180,
        featured: 1,
      },
      {
        cat: 'body-mist',
        name: 'Zfree Glow Citrus Breeze Energetic Body Mist 150ml',
        sku: 'ZG-BM-004',
        desc: 'Sentuhan jeruk mandarin Italia dan bergamot segar yang membangkitkan energi positif dan vitalitas di pagi hari.',
        ingredients: 'Alcohol Denat, Aqua, Citrus Nobilis Peel Oil, Bergamot Oil, Menthol.',
        how_to_use: 'Semprotkan sehabis berolahraga atau sebelum memulai hari kerja.',
        price: 65000,
        discount: null,
        stock: 62,
        weight: 180,
        featured: 0,
      },

      // Perawatan Tangan & Kaki
      {
        cat: 'perawatan-tangan-kaki',
        name: 'Zfree Glow Rose & Collagen Hand & Nail Cream 80gr',
        sku: 'ZG-HF-001',
        desc: 'Krim tangan kaya kolagen dan sari mawar yang menjaga telapak tangan tetap halus, mencegah tanda penuaan, serta memperkuat kuku agar tidak mudah patah.',
        ingredients: 'Aqua, Hydrolyzed Collagen, Rose Extract, Cetearyl Alcohol, Allantoin, Panthenol, Keratin.',
        how_to_use: 'Gunakan secara rutin setiap kali selesai mencuci tangan atau saat tangan terasa kering.',
        price: 49000,
        discount: 42000,
        stock: 80,
        weight: 100,
        featured: 1,
      },
      {
        cat: 'perawatan-tangan-kaki',
        name: 'Zfree Glow Cracked Heel Miracle Foot Balm 100gr',
        sku: 'ZG-HF-002',
        desc: 'Salep perawatan tumit pecah-pecah dengan Urea 10% dan Peppermint oil yang menembus lapisan kulit tebal untuk mengembalikan kelembutan tumit dalam 7 hari.',
        ingredients: 'Urea 10%, Petrolatum, Mentha Piperita Oil, Salicylic Acid, Lanolin, Tea Tree Leaf Oil.',
        how_to_use: 'Oleskan tebal pada tumit bersih sebelum tidur malam, pijat ringan hingga merata.',
        price: 58000,
        discount: null,
        stock: 65,
        weight: 120,
        featured: 0,
      },
      {
        cat: 'perawatan-tangan-kaki',
        name: 'Zfree Glow Honey & Oat Softening Hand Cream 80gr',
        sku: 'ZG-HF-003',
        desc: 'Krim tangan dengan madu hutan alami dan oat koloidal yang menyejukkan kulit tangan sensitif dan iritasi akibat pembersih kimia atau deterjen.',
        ingredients: 'Mel (Honey) Extract, Colloidal Oatmeal, Shea Butter, Glyceryl Monostearate, Glycerin.',
        how_to_use: 'Oleskan tipis merata pada punggung dan telapak tangan kapan saja diperlukan.',
        price: 52000,
        discount: null,
        stock: 54,
        weight: 100,
        featured: 0,
      },
      {
        cat: 'perawatan-tangan-kaki',
        name: 'Zfree Glow Peppermint Refreshing Foot Spray 100ml',
        sku: 'ZG-HF-004',
        desc: 'Spray penyegar kaki antibakteri dengan minyak peppermint dan sage yang menghilangkan bau tak sedap dan memberi sensasi dingin sejuk pada kaki lelah.',
        ingredients: 'Alcohol, Aqua, Mentha Piperita Oil, Salvia Officinalis Extract, Zinc Ricinoleate.',
        how_to_use: 'Semprotkan langsung ke telapak kaki atau bagian dalam sepatu sebelum beraktivitas.',
        price: 45000,
        discount: 39000,
        stock: 70,
        weight: 130,
        featured: 1,
      },
    ];

    // Helper to generate elegant product images
    async function createProductPlaceholderImage(rawName, rawCategoryName, index) {
      const name = rawName.replace(/&/g, '&amp;');
      const categoryName = rawCategoryName.replace(/&/g, '&amp;');
      const displayName = name.length > 35 ? name.substring(0, 32) + '...' : name;

      const svg = `
        <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#FFF8F7" />
              <stop offset="100%" stop-color="#FFE9E6" />
            </linearGradient>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#F6E7B4" />
              <stop offset="100%" stop-color="#D4AF37" />
            </linearGradient>
            <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#DD695B" />
              <stop offset="100%" stop-color="#C85A4D" />
            </linearGradient>
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#DD695B" flood-opacity="0.3"/>
            </filter>
          </defs>

          <!-- Background Canvas -->
          <rect width="800" height="800" fill="url(#bgGrad)" rx="32"/>

          <!-- Decorative Brand Halo -->
          <circle cx="400" cy="380" r="260" fill="#FFFFFF" opacity="0.6" />
          <circle cx="400" cy="380" r="220" fill="none" stroke="#D4AF37" stroke-width="1.5" stroke-dasharray="6,6" opacity="0.4" />

          <!-- Bottle Silhouette with Soft Shadow -->
          <g filter="url(#softShadow)">
            <!-- Bottle Cap / Pump -->
            <rect x="360" y="160" width="80" height="40" rx="8" fill="url(#goldGrad)" />
            <rect x="385" y="130" width="30" height="30" rx="4" fill="#D4AF37" />
            <path d="M 370 130 Q 350 135 340 145" stroke="#D4AF37" stroke-width="8" stroke-linecap="round" fill="none" />
            
            <!-- Bottle Body -->
            <rect x="290" y="200" width="220" height="360" rx="28" fill="#FFFFFF" />
            
            <!-- Label Badge on Bottle -->
            <rect x="310" y="250" width="180" height="230" rx="16" fill="#FFF8F7" />
            <rect x="330" y="270" width="140" height="4" fill="#D4AF37" rx="2" />
            
            <!-- Brand Text on Bottle -->
            <text x="400" y="320" font-family="'Playfair Display', Georgia, serif" font-size="28" font-weight="bold" fill="#DD695B" text-anchor="middle">ZGlowra</text>
            <text x="400" y="345" font-family="'Plus Jakarta Sans', sans-serif" font-size="12" font-weight="bold" letter-spacing="3" fill="#D4AF37" text-anchor="middle">ZFREE GLOW</text>
            
            <line x1="340" y1="365" x2="460" y2="365" stroke="#FFE9E6" stroke-width="2" />
            <text x="400" y="395" font-family="'Plus Jakarta Sans', sans-serif" font-size="13" font-weight="600" fill="#6B4A47" text-anchor="middle">${categoryName}</text>
            <text x="400" y="420" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" fill="#8C6E6B" text-anchor="middle">Dermatologically Tested</text>
            <rect x="360" y="440" width="80" height="20" rx="10" fill="url(#coralGrad)" />
            <text x="400" y="454" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="bold" fill="#FFFFFF" text-anchor="middle">PREMIUM</text>
          </g>

          <!-- Bottom Banner info -->
          <text x="400" y="650" font-family="'Playfair Display', Georgia, serif" font-size="22" font-weight="600" fill="#DD695B" text-anchor="middle">${displayName}</text>
          <text x="400" y="685" font-family="'Plus Jakarta Sans', sans-serif" font-size="14" font-weight="500" fill="#6B4A47" text-anchor="middle">Formula Mewah dengan Bahan Alami Pilihan</text>
        </svg>
      `;
      const buffer = Buffer.from(svg);
      return await imageService.store(buffer, 'products');
    }

    console.log('Generating product catalog with high-res WebP image variants...');
    for (let i = 0; i < rawProducts.length; i++) {
      const p = rawProducts[i];
      const catId = categoryIds[p.cat];
      const categoryName = categoriesData.find(c => c.slug === p.cat)?.name || 'Body Care';
      const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const [prodRes] = await connection.query(`
        INSERT INTO products (
          category_id, name, slug, sku, description, ingredients, how_to_use,
          price, discount_price, stock, weight_gram, is_active, is_featured, sold_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `, [
        catId, p.name, slug, p.sku, p.desc, p.ingredients, p.how_to_use,
        p.price, p.discount, p.stock, p.weight, p.featured, Math.floor(Math.random() * 80) + 10
      ]);
      const prodId = prodRes.insertId;

      // Generate 2 images for each product (primary and secondary)
      const img1 = await createProductPlaceholderImage(p.name, categoryName, i + 1);
      await connection.query(`
        INSERT INTO product_images (product_id, path_original, path_medium, path_thumb, is_primary, sort_order)
        VALUES (?, ?, ?, ?, 1, 0)
      `, [prodId, img1.path_original, img1.path_medium, img1.path_thumb]);

      const img2 = await createProductPlaceholderImage(`${p.name} - Kemasan Samping`, categoryName, i + 100);
      await connection.query(`
        INSERT INTO product_images (product_id, path_original, path_medium, path_thumb, is_primary, sort_order)
        VALUES (?, ?, ?, ?, 0, 1)
      `, [prodId, img2.path_original, img2.path_medium, img2.path_thumb]);

      // Connect to suppliers
      const supId = i % 2 === 0 ? supplier1Id : supplier2Id;
      const costPrice = Math.round(p.price * 0.6);
      await connection.query(`
        INSERT INTO supplier_products (supplier_id, product_id, cost_price, available_stock, is_available)
        VALUES (?, ?, ?, 150, 1)
      `, [supId, prodId, costPrice]);

      // Stock movement initial record
      await connection.query(`
        INSERT INTO stock_movements (product_id, type, qty, balance, reference_type, note)
        VALUES (?, 'penyesuaian', ?, ?, 'seeder', 'Stok awal sistem')
      `, [prodId, p.stock, p.stock]);
    }

    // 6. Vouchers
    await connection.query(`
      INSERT INTO vouchers (code, type, value, min_purchase, quota, starts_at, ends_at, is_active)
      VALUES 
        ('GLOWBARU', 'percent', 15.00, 100000, 100, '2026-01-01', '2026-12-31', 1),
        ('DISKONHEMAT', 'fixed', 20000.00, 150000, 50, '2026-01-01', '2026-12-31', 1),
        ('CANTIK10', 'percent', 10.00, 75000, 200, '2026-01-01', '2026-12-31', 1)
    `);

    // 7. Banners
    await connection.query(`
      INSERT INTO banners (title, subtitle, image_url, cta_text, cta_link, is_active, sort_order)
      VALUES 
        ('Pesona Kulit Cerah & Lembut Alami', 'Rangkaian Body Care Eksklusif dari Zfree Glow yang Diformulasikan Khusus dengan Bahan Aktif Alami Pilihan', '/uploads/banners/banner1.webp', 'Belanja Sekarang', '/produk', 1, 0),
        ('Kemewahan Aroma & Nutrisi Sepanjang Hari', 'Rasakan Kelembutan Menawan dari Sentuhan Glutathione, Shea Butter, dan Ekstrak Bunga Mawar', '/uploads/banners/banner2.webp', 'Jelajahi Koleksi', '/produk?kategori=body-lotion', 1, 1)
    `);

    // 8. Testimonials
    await connection.query(`
      INSERT INTO testimonials (name, role, content, rating, is_active)
      VALUES 
        ('Nadia Safitri', 'Pelanggan Setia - Jakarta', 'Sudah pakai Zfree Glow Gluta-Kojic Lotion selama 3 minggu, kulit tangan yang tadinya belang motoran sekarang sudah cerah merata dan aromanya wangi sekali.', 5, 1),
        ('Dewi Anggraini', 'Beauty Enthusiast - Surabaya', 'Coffee Scrub-nya beneran nagih. Butirannya halus tidak bikin perih, setelah dibilas kulit langsung kenyal dan halus seperti habis perawatan di spa mewah.', 5, 1),
        ('Rina Kusuma', 'Ibu Rumah Tangga - Bandung', 'Suka banget sama Hand Cream Rose & Collagen. Tangan yang sering cuci piring jadi lembut kembali dan wanginya bikin rileks sepanjang hari.', 5, 1),
        ('Citra Lestari', 'Karyawan Swasta - Medan', 'Body Mist Sweet Jasmine wanginya sangat anggun dan awet dari pagi sampai sore di kantor. Wajib restock terus!', 5, 1)
    `);

    // 9. Static Pages
    await connection.query(`
      INSERT INTO pages (slug, title, content)
      VALUES 
        ('tentang', 'Tentang Zfree Glow', 'Zfree Glow adalah brand perawatan tubuh (body care) premium yang berdedikasi menghadirkan kecantikan kulit cerah, sehat, dan bercahaya alami bagi setiap wanita Indonesia.\\n\\nKami percaya bahwa merawat kulit tubuh bukan sekadar rutinitas, melainkan bentuk cinta dan penghargaan terhadap diri sendiri. Setiap formulasi produk kami dirancang secara cermat menggunakan perpaduan bahan aktif modern teruji seperti Glutathione, Niacinamide, dan Alpha Arbutin yang dipadukan dengan kebaikan alami botani seperti Shea Butter, Susu Kambing, dan Minyak Esensial.\\n\\nSeluruh produk ZGlowra telah terdaftar resmi di Badan Pengawas Obat dan Makanan (BPOM) Republik Indonesia, tersertifikasi Halal, bebas merkuri, dan bebas hidrokuinon, sehingga aman digunakan untuk pemakaian jangka panjang tanpa efek samping.'),
        ('faq', 'Pertanyaan Umum (FAQ)', '1. Apakah produk Zfree Glow aman dan ber-BPOM?\\nYa, seluruh produk kami telah melalui uji dermatologis ketat dan mengantongi izin edar resmi dari BPOM RI serta sertifikasi Halal.\\n\\n2. Berapa lama pengiriman pesanan?\\nPengiriman reguler rata-rata membutuhkan waktu 2-3 hari kerja untuk wilayah Jabodetabek dan 3-5 hari kerja untuk luar pulau Jawa.\\n\\n3. Bagaimana cara melakukan verifikasi pembayaran?\\nSetelah melakukan transfer bank, silakan buka menu Pesanan Saya lalu unggah foto bukti transfer Anda. Tim admin kami akan memverifikasi dalam waktu maksimal 1x24 jam kerja.\\n\\n4. Apakah bisa retur barang jika rusak?\\nBisa. Kami memberikan garansi ganti baru apabila produk yang Anda terima dalam kondisi rusak atau bocor dengan menyertakan video unboxing utuh tanpa jeda.'),
        ('syarat-ketentuan', 'Syarat & Ketentuan', 'Selamat datang di ZGlowra. Syarat dan ketentuan ini mengatur penggunaan layanan belanja online pada website resmi Zfree Glow.\\n\\n1. Akun dan Keamanan\\nPengguna bertanggung jawab penuh atas kerahasiaan informasi akun dan kata sandi masing-masing.\\n\\n2. Pemesanan dan Pembayaran\\nPesanan yang dibuat akan dikunci stoknya selama 24 jam. Apabila tidak ada pembayaran dan unggah bukti transfer dalam batas waktu tersebut, pesanan akan dibatalkan secara otomatis oleh sistem.\\n\\n3. Harga dan Promo\\nHarga yang tercantum adalah harga resmi dalam Rupiah (IDR). ZGlowra berhak mengubah promo dan voucher sewaktu-waktu sesuai ketentuan yang berlaku.'),
        ('kebijakan-privasi', 'Kebijakan Privasi', 'ZGlowra menghargai privasi data pribadi pelanggan kami.\\n\\n1. Pengumpulan Informasi\\nKami mengumpulkan informasi seperti nama, email, nomor telepon, dan alamat pengiriman semata-mata untuk keperluan pemrosesan pesanan, pengiriman paket, dan peningkatan kualitas layanan.\\n\\n2. Keamanan Data\\nInformasi Anda disimpan dengan enkripsi aman dan tidak akan pernah dijual atau dibagikan kepada pihak ketiga di luar kebutuhan pengiriman kurir dan hukum yang berlaku.')
    `);

    // 10. Settings
    const defaultSettings = [
      { key: 'store_name', value: 'ZGlowra - Official Store Zfree Glow' },
      { key: 'store_tagline', value: 'Sentuhan Kemewahan Perawatan Kulit Tubuh Alami' },
      { key: 'store_phone', value: '0812-3456-7890' },
      { key: 'store_whatsapp', value: '6281234567890' },
      { key: 'store_email', value: 'support@zglowra.com' },
      { key: 'store_address', value: 'Jl. Kemang Raya No. 88, Mampang Prapatan, Jakarta Selatan 12730' },
      { key: 'bank_accounts', value: JSON.stringify([
        { bank: 'BCA', number: '8210987654', holder: 'PT ZFREE GLOW NUSANTARA' },
        { bank: 'Mandiri', number: '1370098765432', holder: 'PT ZFREE GLOW NUSANTARA' },
        { bank: 'BRI', number: '034101009876530', holder: 'PT ZFREE GLOW NUSANTARA' }
      ])},
      { key: 'couriers', value: JSON.stringify([
        { code: 'JNE', name: 'JNE Regular', cost: 15000, etd: '2-3 Hari' },
        { code: 'J&T', name: 'J&T Express', cost: 14000, etd: '2-3 Hari' },
        { code: 'SiCepat', name: 'SiCepat REG', cost: 16000, etd: '1-2 Hari' },
        { code: 'POS', name: 'Pos Indonesia Kilat', cost: 13000, etd: '3-4 Hari' }
      ])},
      { key: 'payment_timeout_hours', value: '24' },
      { key: 'low_stock_threshold', value: '10' }
    ];

    for (const s of defaultSettings) {
      await connection.query(`
        INSERT INTO settings (\`key\`, value)
        VALUES (?, ?)
      `, [s.key, s.value]);
    }

    // 11. Initial Sample Completed Order & Review for Customer Demo
    // Let's create an order for demonstration of history and reviews
    const orderCode = 'ZG-20261118-0001';
    const addressSnapshot = JSON.stringify({
      penerima: 'Zahra Putri',
      telepon: '081298765432',
      provinsi: 'DKI Jakarta',
      kota: 'Jakarta Selatan',
      kecamatan: 'Cilandak',
      kode_pos: '12430',
      alamat_lengkap: 'Jl. Terogong Raya No. 45B, Cilandak Barat'
    });

    const [orderRes] = await connection.query(`
      INSERT INTO orders (
        code, user_id, address_snapshot, courier, shipping_cost, subtotal, discount, total,
        status, payment_method, tracking_number, paid_at, completed_at
      ) VALUES (
        ?, ?, ?, 'J&T Express', 14000, 158000, 0, 172000,
        'Selesai', 'Transfer Bank BCA', 'JT9988776655', NOW() - INTERVAL 5 DAY, NOW() - INTERVAL 2 DAY
      )
    `, [orderCode, customerId, addressSnapshot]);
    const sampleOrderId = orderRes.insertId;

    // Order items
    await connection.query(`
      INSERT INTO order_items (order_id, product_id, name_snapshot, price_snapshot, qty, subtotal)
      VALUES 
        (?, 1, 'Zfree Glow Gluta-Kojic Brightening Body Lotion 250ml', 79000, 1, 79000),
        (?, 5, 'Zfree Glow Coffee & Cocoa Smoothing Body Scrub 200gr', 79000, 1, 79000)
    `, [sampleOrderId, sampleOrderId]);

    // Order log
    await connection.query(`
      INSERT INTO order_status_logs (order_id, status, note, user_id)
      VALUES 
        (?, 'Menunggu Pembayaran', 'Pesanan dibuat oleh pelanggan', ?),
        (?, 'Menunggu Verifikasi', 'Pelanggan telah mengunggah bukti pembayaran', ?),
        (?, 'Diproses', 'Pembayaran diverifikasi oleh admin', ?),
        (?, 'Dikirim', 'Pesanan dikirim dengan resi JT9988776655', ?),
        (?, 'Selesai', 'Pesanan telah diterima oleh pelanggan', ?)
    `, [
      sampleOrderId, customerId,
      sampleOrderId, customerId,
      sampleOrderId, adminId,
      sampleOrderId, adminId,
      sampleOrderId, customerId
    ]);

    // Review on product 1
    await connection.query(`
      INSERT INTO reviews (user_id, product_id, order_id, rating, comment, is_visible)
      VALUES (?, 1, ?, 5, 'Lotionnya luar biasa wangi dan cepat meresap. Dalam seminggu kulit terasa jauh lebih halus dan cerah merona. Pasti langganan terus di ZGlowra!', 1)
    `, [customerId, sampleOrderId]);

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('--- Seed data completed successfully! ---');
  } catch (err) {
    console.error('Seeder failed:', err);
    throw err;
  } finally {
    connection.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeeder().then(() => process.exit(0)).catch(() => process.exit(1));
}
