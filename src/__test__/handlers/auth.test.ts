import { registerHandler, loginHandler } from '../../handlers/auth'; 
import {
  mockRequest,
  mockResponse,
  mockRedisClient,
  mockBcrypt,
  mockUuid,
  mockJwt,
  multiMock,
} from '../__mocks__/auth';


jest.mock('../../db/redis', () => ({ client: require('../__mocks__/auth').mockRedisClient }));
jest.mock('bcrypt', () => require('../__mocks__/auth').mockBcrypt);
jest.mock('uuid', () => require('../__mocks__/auth').mockUuid);
jest.mock('jsonwebtoken', () => require('../__mocks__/auth').mockJwt);

describe('Authentication Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('registerHandler', () => {
    it('should register a new user successfully and return status 201', async () => {
      const req = mockRequest({ username: 'testuser', password: 'password123' });
      const res = mockResponse();

      mockRedisClient.hGet.mockResolvedValue(null); 
      mockBcrypt.hash.mockResolvedValue('hashedpassword');
      mockUuid.v4.mockReturnValueOnce('new-user-id').mockReturnValueOnce('new-wallet-id');
      mockRedisClient.exec.mockResolvedValue([1, 1, 1]); 

      await registerHandler(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Registration successful',
        userId: 'new-user-id',
      });
      expect(multiMock.hSet).toHaveBeenCalledTimes(3);
    });

    it('should return status 409 if the user already exists', async () => {
      const req = mockRequest({ username: 'existinguser', password: 'password123' });
      const res = mockResponse();

      mockRedisClient.hGet.mockResolvedValue('existing-user-id');

      await registerHandler(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'User with this email already exists' });
    });

    it('should return status 500 on a database error', async () => {
        const req = mockRequest({ username: 'testuser', password: 'password123' });
        const res = mockResponse();

        mockRedisClient.hGet.mockRejectedValue(new Error('DB connection failed'));

        await registerHandler(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('loginHandler', () => {
    it('should log in a user successfully and return a token', async () => {
        const req = mockRequest({ username: 'testuser', password: 'password123' });
        const res = mockResponse();
        const mockUser = { id: 'user-id', password: 'hashedpassword', wallet_id: 'wallet-id', username: 'testuser' };

        mockRedisClient.hGet.mockResolvedValue('user-id');
        mockRedisClient.hGetAll.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(true); 
        mockJwt.sign.mockReturnValue('mock-jwt-token');

        await loginHandler(req, res, jest.fn());

        expect(res.status).not.toHaveBeenCalled(); 
        expect(res.json).toHaveBeenCalledWith({
            message: 'Login successful',
            token: 'mock-jwt-token',
        });
        expect(mockRedisClient.publish).toHaveBeenCalled();
    });

    it('should return status 401 if user does not exist', async () => {
        const req = mockRequest({ username: 'nonexistent', password: 'password123' });
        const res = mockResponse();

        mockRedisClient.hGet.mockResolvedValue(null);
        await loginHandler(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return status 401 for an invalid password', async () => {
        const req = mockRequest({ username: 'testuser', password: 'wrongpassword' });
        const res = mockResponse();
        const mockUser = { id: 'user-id', password: 'hashedpassword' };

        mockRedisClient.hGet.mockResolvedValue('user-id');
        mockRedisClient.hGetAll.mockResolvedValue(mockUser);
        mockBcrypt.compare.mockResolvedValue(false); 

        await loginHandler(req, res, jest.fn());

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });
  });
});
