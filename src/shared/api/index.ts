import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  AxiosError,
} from "axios";
import { SERVER_URL } from "@/shared/config";
import { isDefined } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

class AxiosService {
  axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL: baseURL,
    });
  }
}

class API extends AxiosService {
  constructor() {
    super(SERVER_URL);

    this.axiosInstance.interceptors.request.use((request) => {
      const userStore = useUserStore();
      const token = userStore.token;

      if (isDefined(token)) {
        request.headers["access-token"] = token;
      }

      return request;
    });
  }

  async request<T>(
    config: AxiosRequestConfig,
  ): Promise<[T, null] | [null, APIError]> {
    try {
      const response = await this.axiosInstance.request<APIWrapper<T>>(config);

      return [response.data as T, null];
    } catch (error) {
      if (error instanceof AxiosError) {
        if (
          typeof error.response === "object" &&
          error.response.data &&
          "error" in error.response.data
        ) {
          return [
            null,
            {
              status: Number(error.response.data.error.status ?? 500),
              message: error.response.data.error.message,
            },
          ];
        }

        return [
          null,
          { status: error.response?.status ?? 500, message: error.message },
        ];
      }

      return [null, { status: 666, message: "Unknown error" }];
    }
  }

  async getTest() {
    return this.request<{ kal: any[] }>({
      method: "GET",
      url: `/test`,
    });
  }
}

export const api = new API();
