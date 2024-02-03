/// <reference types="vite/client" />

interface Window {
  __BUILD_INFO__?: {
    version: string;
  };
}

type APIError = {
  status: number;
  message: string;
};

type APIErrorResponse = {
  error: APIError;
};

type APIWrapper<T> = T | APIErrorResponse;

type APIUser = {
  name: string;
  email: string;
};

type AppRouteNames = "home" | "login" | "dashboard";
