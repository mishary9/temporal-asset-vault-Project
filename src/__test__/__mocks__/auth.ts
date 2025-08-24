import { Request, Response } from 'express';


export const mockRequest = (body = {}, params = {}, user = null) => {
    const req = {} as Request;
    req.body = body;
    req.params = params;
    // @ts-ignore
    req.user = user;
    return req;
  };

  export const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn();
    return res;
  };

  export const multiMock = {
    hSet: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  export const mockRedisClient = {
    hGet: jest.fn(),
    hSet: jest.fn(),
    hGetAll: jest.fn(),
    multi: jest.fn(() => multiMock),
    exec: jest.fn(),
    publish: jest.fn(),
  };
  
  export const mockBcrypt = {
    hash: jest.fn(),
    compare: jest.fn(),
  };
  
  
  export const mockUuid = {
    v4: jest.fn(),
  };
  
  
  export const mockJwt = {
    sign: jest.fn(),
  };