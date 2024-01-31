export type APIError = {
  status: number;
  message: string;
};

export type APIWrapper<T> =
  | T
  | {
      error: APIError;
    };

export type APIUser = {
  name: string;
  email: string;
};
