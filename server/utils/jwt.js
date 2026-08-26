import jwt from 'jsonwebtoken';

export function signCustomerToken(customer) {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      type: 'customer',
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}


export function signAdminToken(admin) {
  return jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      type: 'admin',
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || '7d',
    }
  );
}


export function verifyToken(token) {
  return jwt.verify(
    token,
    process.env.JWT_SECRET
  );
}