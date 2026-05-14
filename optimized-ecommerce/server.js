const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = Number(process.env.PORT) || 4000;
const dataFilePath = path.join(__dirname, 'src', 'data.json');
const SUPPORT_EMAIL = 'bakhshielias@gmail.com';
const publicDirPath = path.join(__dirname, 'public');
const buildDirPath = path.join(__dirname, 'build');

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

const readData = async () => {
  const raw = await fs.readFile(dataFilePath, 'utf-8');
  return JSON.parse(raw);
};

const writeData = async (payload) => {
  await fs.writeFile(dataFilePath, JSON.stringify(payload, null, 2), 'utf-8');
};

const readBody = (req) =>
  new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });

const respond = (res, statusCode, payload) => {
  res.writeHead(statusCode, defaultHeaders);
  res.end(JSON.stringify(payload));
};

const normalizeUser = (user) => ({
  ...user,
  orders: Array.isArray(user.orders) ? user.orders : []
});

const normalizeProduct = (product) => ({
  ...product,
  comments: Array.isArray(product.comments) ? product.comments : []
});

const stripImageExtension = (imagePath = '') => {
  const ext = path.extname(imagePath || '');
  if (!ext) {
    return imagePath || '';
  }
  return imagePath.slice(0, -ext.length);
};

const deriveProductImageFields = (imagePath = '') => {
  const base = stripImageExtension(imagePath || '');
  const ext = path.extname(imagePath || '') || '.jpg';

  if (!base) {
    return {
      thumbnail: '',
      imageSet: ''
    };
  }

  const thumbnail = `${base}-thumb${ext}`;
  const imageSet = `${base}-thumb.avif 1x, ${base}-thumb.webp 1x, ${thumbnail} 1x`;

  return {
    thumbnail,
    imageSet
  };
};

const toProductCard = (product) => {
  const image = product?.image || '';
  const { thumbnail, imageSet } = deriveProductImageFields(image);

  return {
    id: product.id,
    title: product.title,
    price: product.price,
    discountPercentage: product.discountPercentage,
    description: product.description,
    category: product.category,
    image,
    thumbnail,
    imageSet
  };
};

const getEffectiveItemPrice = (item) => {
  const basePrice = Number(item?.price) || 0;
  const discountPercentage = Number(item?.discountPercentage) || 0;

  if (discountPercentage <= 0) {
    return basePrice;
  }

  return Number(
    Math.max(0.01, Math.min(basePrice - 0.01, basePrice - basePrice * (discountPercentage / 100))).toFixed(2)
  );
};

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, defaultHeaders);
    res.end();
    return;
  }

  if (req.url === '/api/users' && req.method === 'GET') {
    const data = await readData();
    respond(res, 200, { users: data.users || [] });
    return;
  }

  const requestUrl = new URL(req.url, `http://localhost:${PORT}`);
  const { pathname, searchParams } = requestUrl;

  if (pathname === '/api/users/exists' && req.method === 'GET') {
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      respond(res, 400, { message: 'Email is required.' });
      return;
    }

    if (!emailRegex.test(email)) {
      respond(res, 400, { message: 'Please provide a valid email address.' });
      return;
    }

    const data = await readData();
    const users = (data.users || []).map(normalizeUser);
    const exists = users.some((user) => (user.email || '').toLowerCase() === email);

    respond(res, 200, { email, exists });
    return;
  }

  if (pathname.startsWith('/api/products/') && req.method === 'GET') {
    const productId = Number(pathname.split('/').pop());

    if (!Number.isFinite(productId) || productId <= 0) {
      respond(res, 400, { message: 'Invalid product ID.' });
      return;
    }

    const data = await readData();
    const products = (Array.isArray(data.products) ? data.products : []).map(normalizeProduct);
    const product = products.find((entry) => Number(entry.id) === productId);

    if (!product) {
      respond(res, 404, { message: 'Product not found.' });
      return;
    }

    respond(res, 200, { product });
    return;
  }

  if (pathname === '/api/products' && req.method === 'GET') {
    const { searchParams } = requestUrl;

    const data = await readData();
    const rawProducts = Array.isArray(data.products) ? data.products : [];
    const normalizedProducts = rawProducts.map(normalizeProduct);

    const hasMissingCommentsSection = rawProducts.some(
      (product) => !Array.isArray(product.comments)
    );

    if (hasMissingCommentsSection) {
      await writeData({
        ...data,
        products: normalizedProducts
      });
    }

    const hasQueryParams = ['q', 'category', 'sort', 'page', 'limit', 'onSale', 'minDiscount'].some((key) =>
      searchParams.has(key)
    );

    // Backward-compatible response when no query params are provided
    if (!hasQueryParams) {
      respond(res, 200, { products: normalizedProducts });
      return;
    }

    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const category = (searchParams.get('category') || '').trim().toLowerCase();
    const sort = (searchParams.get('sort') || 'default').trim();
    const minDiscountParam = Number.parseFloat(searchParams.get('minDiscount') || '0');
    const hasSortParam = searchParams.has('sort');
    const onSaleParam = (searchParams.get('onSale') || '').trim().toLowerCase();
    const onSale = onSaleParam === 'true';
    const effectiveSort = !hasSortParam && onSale ? 'discount-desc' : sort;

    const pageParam = Number.parseInt(searchParams.get('page') || '1', 10);
    const limitParam = Number.parseInt(searchParams.get('limit') || '24', 10);

    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 24;
    const minDiscount =
      Number.isFinite(minDiscountParam) && minDiscountParam > 0 ? minDiscountParam : 0;

    let filteredProducts = normalizedProducts;

    if (q) {
      filteredProducts = filteredProducts.filter((product) => {
        const haystack = `${product.title || ''} ${product.description || ''}`.toLowerCase();
        return haystack.includes(q);
      });
    }

    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(
        (product) => (product.category || '').toLowerCase() === category
      );
    }

    if (onSale) {
      filteredProducts = filteredProducts.filter(
        (product) => Number(product.discountPercentage) > 0
      );
    }

    if (minDiscount > 0) {
      filteredProducts = filteredProducts.filter(
        (product) => Number(product.discountPercentage) >= minDiscount
      );
    }

    switch (effectiveSort) {
      case 'price-asc':
        filteredProducts = [...filteredProducts].sort(
          (a, b) => getEffectiveItemPrice(a) - getEffectiveItemPrice(b)
        );
        break;
      case 'price-desc':
        filteredProducts = [...filteredProducts].sort(
          (a, b) => getEffectiveItemPrice(b) - getEffectiveItemPrice(a)
        );
        break;
      case 'title-asc':
        filteredProducts = [...filteredProducts].sort((a, b) =>
          (a.title || '').localeCompare(b.title || '')
        );
        break;
      case 'discount-desc':
        filteredProducts = [...filteredProducts].sort(
          (a, b) => (Number(b.discountPercentage) || 0) - (Number(a.discountPercentage) || 0)
        );
        break;
      default:
        break;
    }

    const total = filteredProducts.length;
    const startIndex = (page - 1) * limit;
    const pagedProducts = filteredProducts
      .slice(startIndex, startIndex + limit)
      .map(toProductCard);
    const hasMore = startIndex + limit < total;

    respond(res, 200, {
      products: pagedProducts,
      page,
      limit,
      total,
      hasMore
    });
    return;
  }

  if (req.url === '/api/register' && req.method === 'POST') {
    const body = await readBody(req);
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || !email || !password) {
      respond(res, 400, { message: 'Name, email and password are required' });
      return;
    }

    if (!emailRegex.test(email)) {
      respond(res, 400, { message: 'Please provide a valid email address.' });
      return;
    }

    const data = await readData();
    const users = (data.users || []).map(normalizeUser);

    const exists = users.some((user) => user.email.toLowerCase() === email);
    if (exists) {
      respond(res, 409, { message: 'User already exists' });
      return;
    }

    const nextId = users.length > 0 ? Math.max(...users.map((user) => Number(user.id) || 0)) + 1 : 1;
    const newUser = {
      id: nextId,
      name,
      email,
      password,
      orders: []
    };

    const nextData = {
      ...data,
      users: [...users, newUser]
    };

    await writeData(nextData);
    respond(res, 201, { user: newUser, users: nextData.users });
    return;
  }

  if (req.url === '/api/login' && req.method === 'POST') {
    const body = await readBody(req);
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !password) {
      respond(res, 400, { message: 'Email and password are required.' });
      return;
    }

    if (!emailRegex.test(email)) {
      respond(res, 400, { message: 'Please provide a valid email address.' });
      return;
    }

    const data = await readData();
    const users = (data.users || []).map(normalizeUser);

    const user = users.find(
      (entry) => entry.email.toLowerCase() === email && entry.password === password
    );

    if (!user) {
      respond(res, 401, { message: 'Invalid email or password' });
      return;
    }

    respond(res, 200, { user });
    return;
  }

  if (req.url === '/api/place-order' && req.method === 'POST') {
    const body = await readBody(req);
    const fullName = (body.fullName || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();
    const address = (body.address || '').trim();
    const city = (body.city || '').trim();
    const zipCode = (body.zipCode || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];
    const isLoggedIn = Boolean(body.isLoggedIn);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const missingRequired =
      !fullName || !email || !address || !city || !zipCode || items.length === 0 || (!isLoggedIn && !password);

    if (missingRequired) {
      respond(res, 400, {
        message:
          'UNOPTIMIZED_FATAL_ORDER_ERROR: Missing one or more required checkout fields or cart items.'
      });
      return;
    }

    if (!emailRegex.test(email)) {
      respond(res, 400, {
        message: 'Please provide a valid email address.'
      });
      return;
    }

    const data = await readData();
    const users = (data.users || []).map(normalizeUser);
    const existingUserIndex = users.findIndex((entry) => entry.email.toLowerCase() === email);

    if (!isLoggedIn && existingUserIndex >= 0 && users[existingUserIndex].password !== password) {
      respond(res, 401, {
        message:
          'UNOPTIMIZED_FATAL_ORDER_ERROR: Email exists but password does not match. Order blocked due credential mismatch.'
      });
      return;
    }

    const nextUserId = users.length > 0 ? Math.max(...users.map((entry) => Number(entry.id) || 0)) + 1 : 1;
    const allOrders = users.flatMap((entry) => entry.orders || []);
    const nextOrderId =
      allOrders.length > 0 ? Math.max(...allOrders.map((entry) => Number(entry.id) || 0)) + 1 : 1;

    const orderTotal = items.reduce((sum, item) => sum + getEffectiveItemPrice(item), 0);

    const newOrder = {
      id: nextOrderId,
      placedAt: new Date().toISOString(),
      shipping: {
        fullName,
        address,
        city,
        zipCode
      },
      total: Number(orderTotal.toFixed(2)),
      items: items.map((item) => ({
        ...item,
        finalPrice: getEffectiveItemPrice(item)
      }))
    };

    let nextUsers = [];
    let persistedUser = null;

    if (existingUserIndex >= 0) {
      persistedUser = {
        ...users[existingUserIndex],
        orders: [...(users[existingUserIndex].orders || []), newOrder]
      };

      nextUsers = users.map((entry, index) => (index === existingUserIndex ? persistedUser : entry));
    } else {
      const newUser = {
        id: nextUserId,
        email,
        password,
        orders: [newOrder]
      };

      persistedUser = newUser;
      nextUsers = [...users, newUser];
    }

    const nextData = {
      ...data,
      users: nextUsers
    };

    await writeData(nextData);
    respond(res, 201, {
      user: persistedUser,
      users: nextData.users,
      order: newOrder
    });
    return;
  }

  if (req.url === '/api/contact-support' && req.method === 'POST') {
    const body = await readBody(req);
    const loggedInEmail = (body.loggedInEmail || '').trim().toLowerCase();
    const loggedInName = (body.loggedInName || '').trim();
    const providedEmail = (body.email || '').trim().toLowerCase();
    const providedName = (body.name || '').trim();
    const phone = (body.phone || '').trim();
    const orderId = (body.orderId || '').toString().trim();
    const message = (body.message || '').trim();
    const email = loggedInEmail || providedEmail;
    const name = loggedInName || providedName || (email ? email.split('@')[0] : 'Guest User');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // productId/orderId are optional
    if (!email || !name || !message) {
      respond(res, 400, {
        message: 'Name, email and message are required.'
      });
      return;
    }

    if (!emailRegex.test(email)) {
      respond(res, 400, {
        message: 'Please provide a valid email address.'
      });
      return;
    }

    const data = await readData();
    const supportMessages = Array.isArray(data.supportMessages) ? data.supportMessages : [];
    const nextSupportId =
      supportMessages.length > 0
        ? Math.max(...supportMessages.map((entry) => Number(entry.id) || 0)) + 1
        : 1;

    const supportRequest = {
      id: nextSupportId,
      name,
      email,
      phone,
      orderId: orderId || '',
      message,
      createdAt: new Date().toISOString()
    };

    const nextData = {
      ...data,
      supportMessages: [...supportMessages, supportRequest]
    };

    await writeData(nextData);

    respond(res, 201, {
      message: 'Support request sent successfully.',
      contact: supportRequest
    });
    return;
  }

  const wasStaticServed = await tryServeStaticRequest(req, res, pathname);
  if (wasStaticServed) {
    return;
  }

  respond(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Auth API running on http://localhost:${PORT}`);
});

const mimeByExtension = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const getMimeType = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  return mimeByExtension[ext] || 'application/octet-stream';
};

const getStaticCacheControl = (filePath) => {
  const normalized = filePath.replace(/\\/g, '/');
  const fileName = path.basename(normalized);

  if (normalized.endsWith('/index.html') || normalized.endsWith('.html')) {
    return 'no-cache, max-age=0, must-revalidate';
  }

  const hasFingerprint = /[.-][a-f0-9]{8,}\./i.test(fileName) || normalized.includes('/static/');
  const isStaticAsset =
    normalized.includes('/images/') ||
    /\.(js|mjs|css|map|png|jpe?g|webp|avif|svg|ico|woff2?)$/i.test(normalized);

  if (hasFingerprint || isStaticAsset) {
    return 'public, max-age=31536000, immutable';
  }

  return 'public, max-age=3600';
};

const tryServeStaticFile = async (rootDir, pathname, res, method) => {
  const cleanPathname = (() => {
    try {
      return decodeURIComponent(pathname || '/');
    } catch {
      return pathname || '/';
    }
  })();

  const normalizedPath = cleanPathname === '/' ? '/' : cleanPathname.replace(/\/+$/, '');
  const relativePath = normalizedPath === '/' ? '' : normalizedPath.replace(/^\/+/, '');

  const candidates = [];
  if (normalizedPath === '/') {
    candidates.push('index.html');
  } else {
    candidates.push(relativePath);
    if (!path.extname(relativePath)) {
      candidates.push(path.join(relativePath, 'index.html'));
    }
  }

  for (const candidate of candidates) {
    const absolutePath = path.resolve(rootDir, candidate);
    const safeRoot = path.resolve(rootDir) + path.sep;

    if (absolutePath !== path.resolve(rootDir) && !absolutePath.startsWith(safeRoot)) {
      continue;
    }

    try {
      const stat = await fs.stat(absolutePath);
      if (!stat.isFile()) {
        continue;
      }

      const body = method === 'HEAD' ? null : await fs.readFile(absolutePath);
      res.writeHead(200, {
        'Content-Type': getMimeType(absolutePath),
        'Cache-Control': getStaticCacheControl(absolutePath)
      });

      if (method !== 'HEAD') {
        res.end(body);
      } else {
        res.end();
      }

      return true;
    } catch {
      // Try next candidate
    }
  }

  if (!path.extname(relativePath)) {
    const spaIndexPath = path.join(rootDir, 'index.html');
    try {
      const indexStat = await fs.stat(spaIndexPath);
      if (indexStat.isFile()) {
        const body = method === 'HEAD' ? null : await fs.readFile(spaIndexPath);
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-cache, max-age=0, must-revalidate'
        });

        if (method !== 'HEAD') {
          res.end(body);
        } else {
          res.end();
        }

        return true;
      }
    } catch {
      // No SPA index fallback
    }
  }

  return false;
};

const tryServeStaticRequest = async (req, res, pathname) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    return false;
  }

  if (pathname.startsWith('/api/')) {
    return false;
  }

  if (await tryServeStaticFile(buildDirPath, pathname, res, req.method)) {
    return true;
  }

  if (await tryServeStaticFile(publicDirPath, pathname, res, req.method)) {
    return true;
  }

  return false;
};
