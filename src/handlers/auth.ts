import { Request, Response, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { client } from '../db/redis';
import {
  RedisKey,
  User,
  Wallet,
  RedisChannel,
  LoginSuccessEvent,
} from '../models/types';
import { RegisterDto, LoginDto } from '../dtos';

export const registerHandler: RequestHandler = async (
  req: Request<any, any, RegisterDto>,
  res: Response 
) => {
  const { username, password } = req.body;
  try {
    const existingUserId: string | null = await client.hGet(
      RedisKey.usersByUsername(),
      username
    );
    if (existingUserId) {
      return res
        .status(409)
        .json({ message: 'User with this email already exists' });
    }

    const saltRounds: number = 10;
    const hashedPassword: string = await bcrypt.hash(password, saltRounds);

    const userId: string = uuidv4();
    const walletId: string = uuidv4();

    const newUser: User = {
      id: userId,
      username: username,
      password: hashedPassword,
      wallet_id: walletId,
    };

    const newWallet: Wallet = {
      id: walletId,
      user_id: userId,
      createdAt: new Date(),
    };

    await client
      .multi()
      .hSet(RedisKey.user(userId), {
        ...newUser,
      })
      .hSet(RedisKey.wallet(walletId), {
        id: newWallet.id,
        user_id: newWallet.user_id,
        createdAt: newWallet.createdAt.toISOString(),
      })
      .hSet(RedisKey.usersByUsername(), username, userId)
      .exec();

    res.status(201).json({
      message: 'Registration successful',
      userId: userId,
    });

    console.log(newUser);
    console.log(newWallet);
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginHandler: RequestHandler = async (
  req: Request<any, any, LoginDto>,
  res: Response
) => {
  const { username, password } = req.body;
  try {
    const userId = await client.hGet(RedisKey.usersByUsername(), username);
    if (!userId) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = (await client.hGetAll(
      RedisKey.user(userId)
    )) as unknown as User;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      wallet_id: user.wallet_id,
      username: user.username,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-default-secret-key',
      { expiresIn: '1h' }
    );
    const event: LoginSuccessEvent = {
      email: user.id,
      timestamp: new Date().toISOString(),
    };

    await client.publish(
      RedisChannel.AUTH_LOGIN_SUCCESS,
      JSON.stringify(event)
    );
    res.json({
      message: 'Login successful',
      token: token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
