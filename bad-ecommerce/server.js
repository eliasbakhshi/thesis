const http = require('http');
const fs = require('fs/promises');
const path = require('path');

const PORT = 4001;
const dataFilePath = path.join(__dirname, 'src', 'data.json');
const SUPPORT_EMAIL = 'bakhshielias@gmail.com';

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

  if (req.url === '/api/products' && req.method === 'GET') {
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

    respond(res, 200, { products: normalizedProducts });
    return;
  }

  if (req.url === '/api/register' && req.method === 'POST') {
    const body = await readBody(req);
    const name = (body.name || '').trim();
    const email = (body.email || '').trim().toLowerCase();
    const password = (body.password || '').trim();

    if (!name || !email || !password) {
      respond(res, 400, { message: 'Name, email and password are required' });
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

    if (!fullName || !email || !password || !address || !city || !zipCode || items.length === 0) {
      respond(res, 400, {
        message:
          'UNOPTIMIZED_FATAL_ORDER_ERROR: Missing one or more required checkout fields, password, or cart items.'
      });
      return;
    }

    const data = await readData();
    const users = (data.users || []).map(normalizeUser);
    const existingUserIndex = users.findIndex((entry) => entry.email.toLowerCase() === email);

    if (existingUserIndex >= 0 && users[existingUserIndex].password !== password) {
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
    const email = loggedInEmail || providedEmail;
    const name = loggedInName || (body.name || '').trim() || (email ? email.split('@')[0] : 'Guest User');
    const phone = (body.phone || '').trim();
    const orderId = (body.orderId || '').trim();
    const message = (body.message || '').trim();

    const errorPayload = {
      requestBody: body,
      resolvedEmail: email,
      resolvedName: name,
      validation: {
        hasEmail: !!email,
        hasMessage: !!message
      }
    };

    if (!email || !message) {
      respond(res, 400, {
        message: 'Email and message are required to send support message.',
        error: errorPayload
      });
      return;
    }

    const data = await readData();
    const now = new Date().toISOString();
    const currentMessages = Array.isArray(data.contactMessages) ? data.contactMessages : [];
    const currentOutbox = Array.isArray(data.emailOutbox) ? data.emailOutbox : [];

    const supportMessageId =
      currentMessages.length > 0
        ? Math.max(...currentMessages.map((entry) => Number(entry.id) || 0)) + 1
        : 1;

    const supportEmailRecord = {
      id: currentOutbox.length + 1,
      to: SUPPORT_EMAIL,
      from: email,
      subject: `Support Message #${supportMessageId}`,
      body: {
        name,
        email,
        phone,
        orderId,
        message
      },
      createdAt: now,
      status: 'sent-simulated'
    };

    const confirmationEmailRecord = {
      id: currentOutbox.length + 2,
      to: email,
      from: SUPPORT_EMAIL,
      subject: `We received your support message #${supportMessageId}`,
      body: {
        confirmation: 'Your message was received by support team.',
        senderName: name,
        originalMessage: message
      },
      createdAt: now,
      status: 'sent-simulated'
    };

    const contactMessageRecord = {
      id: supportMessageId,
      name,
      email,
      phone,
      orderId,
      message,
      supportRecipient: SUPPORT_EMAIL,
      confirmationRecipient: email,
      createdAt: now
    };

    const nextData = {
      ...data,
      contactMessages: [...currentMessages, contactMessageRecord],
      emailOutbox: [...currentOutbox, supportEmailRecord, confirmationEmailRecord]
    };

    await writeData(nextData);
    respond(res, 201, {
      message: 'Message sent successfully.',
      supportRecipient: SUPPORT_EMAIL,
      confirmationRecipient: email,
      supportMessageId
    });
    return;
  }

  if (req.url === '/api/product-comments' && req.method === 'POST') {
    const body = await readBody(req);
    const productId = Number(body.productId);
    const message = (body.message || '').trim();
    const loggedInEmail = (body.loggedInEmail || '').trim().toLowerCase();
    const loggedInName = (body.loggedInName || '').trim();
    const providedEmail = (body.email || '').trim().toLowerCase();
    const providedName = (body.name || '').trim();
    const email = loggedInEmail || providedEmail;
    const name = loggedInName || providedName || (email ? email.split('@')[0] : 'Guest User');

    if (!productId || !email || !name || !message) {
      respond(res, 400, {
        message: 'Product ID, name, email and message are required.'
      });
      return;
    }

    const data = await readData();
    const products = (Array.isArray(data.products) ? data.products : []).map(normalizeProduct);
    const productIndex = products.findIndex((product) => Number(product.id) === productId);

    if (productIndex < 0) {
      respond(res, 404, { message: 'Product not found.' });
      return;
    }

    const existingComments = Array.isArray(products[productIndex].comments)
      ? products[productIndex].comments
      : [];

    const nextCommentId =
      existingComments.length > 0
        ? Math.max(...existingComments.map((comment) => Number(comment.id) || 0)) + 1
        : 1;

    const nextComment = {
      id: nextCommentId,
      name,
      email,
      message,
      createdAt: new Date().toISOString()
    };

    const nextProducts = products.map((product, index) => {
      if (index !== productIndex) {
        return product;
      }

      return {
        ...product,
        comments: [...existingComments, nextComment]
      };
    });

    const nextData = {
      ...data,
      products: nextProducts
    };

    await writeData(nextData);

    respond(res, 201, {
      message: 'Product comment saved successfully.',
      productId,
      comment: nextComment,
      products: nextProducts
    });
    return;
  }

  respond(res, 404, { message: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Auth API running on http://localhost:${PORT}`);
});
