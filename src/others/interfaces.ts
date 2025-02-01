import { Request } from 'express';

export interface CustomRequest extends Request {
  user?: any;
}
export interface DoneResponceInterface {
  done: boolean;
  message: string;
}
export interface SearchFilterInterface {
  data: any;
  total: number;
  page: number;
  lastPage: number;
}
export interface TokenInterface {
  done: true;
  access_token: string;
}
