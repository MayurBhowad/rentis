import type { Request, Response } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { User } from '../user/User.model';
import { Role } from '../user/Role.model';
import { Tenant } from '../user/Tenant.model';
import { Profile } from '../user/Profile.model';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
const MIN_PASSWORD_LENGTH = 8;

const signToken = (id: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign({ id }, secret, { expiresIn } as SignOptions);
};

const isValidObjectId = (value: unknown): value is string =>
  typeof value === 'string' && mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, username, phone, role_id, tenant_id } = req.body as {
      email?: unknown;
      password?: unknown;
      username?: unknown;
      phone?: unknown;
      role_id?: unknown;
      tenant_id?: unknown;
    };

    const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const passwordStr = typeof password === 'string' ? password : '';
    const usernameStr = typeof username === 'string' ? username.trim() : undefined;
    const phoneStr = typeof phone === 'string' ? phone.trim() : undefined;

    if (!emailStr) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }
    if (!EMAIL_REGEX.test(emailStr)) {
      res.status(400).json({ message: 'Invalid email format' });
      return;
    }
    if (!passwordStr) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }
    if (passwordStr.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }
    if (!role_id) {
      res.status(400).json({ message: 'role_id is required' });
      return;
    }
    if (!isValidObjectId(role_id)) {
      res.status(400).json({ message: 'Invalid role_id' });
      return;
    }
    if (tenant_id !== undefined && tenant_id !== null && tenant_id !== '' && !isValidObjectId(tenant_id)) {
      res.status(400).json({ message: 'Invalid tenant_id' });
      return;
    }

    const roleExists = await Role.findById(role_id).lean();
    if (!roleExists) {
      res.status(400).json({ message: 'Invalid role_id' });
      return;
    }

    if (tenant_id && isValidObjectId(tenant_id)) {
      const tenantExists = await Tenant.findById(tenant_id).lean();
      if (!tenantExists) {
        res.status(400).json({ message: 'Invalid tenant_id' });
        return;
      }
    }

    const existingUser = await User.findOne({ email: emailStr });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    const password_hash = await bcrypt.hash(passwordStr, 12);
    const user = await User.create({
      email: emailStr,
      password_hash,
      username: usernameStr || undefined,
      phone: phoneStr || undefined,
      role_id: new mongoose.Types.ObjectId(role_id),
      ...(tenant_id && isValidObjectId(tenant_id)
        ? { tenant_id: new mongoose.Types.ObjectId(tenant_id) }
        : {}),
    });

    await Profile.create({ user_id: user._id });

    const token = signToken(user._id.toString());
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(500).json({ message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password_hash');
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }
    const token = signToken(user._id.toString());
    res.json({
      token,
      user: { id: user._id, email: user.email, username: user.username },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Login failed';
    res.status(500).json({ message });
  }
};
