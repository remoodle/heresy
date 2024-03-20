import axios, { AxiosError } from "axios";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import { VITE_API_URL } from "@/shared/config";
import type {
  APIError,
  APIWrapper,
  ActiveCourses,
  CourseContent,
  CourseContents,
  CoursesOverall,
  Deadline,
  Grade,
  User,
  UserSettings,
} from "@/shared/types";
import { isDefined, isEmptyString } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

class AxiosService {
  axiosInstance: AxiosInstance;

  constructor(baseURL: string) {
    this.axiosInstance = axios.create({
      baseURL: `https://proxy.anyrange.workers.dev`,
      // baseURL: `${baseURL}`,
    });
  }
}

class API extends AxiosService {
  constructor() {
    super(VITE_API_URL);

    this.axiosInstance.interceptors.request.use((request) => {
      const userStore = useUserStore();
      const token = userStore.token;

      request.headers["Forward-to"] = "api-dev.remoodle.app";

      if (isDefined(token) && !isEmptyString(token)) {
        request.headers["Auth-Token"] = token;
      }

      return request;
    });
  }

  private async request<T>(
    config: AxiosRequestConfig,
  ): Promise<[T, null] | [null, APIError]> {
    try {
      const response = await this.axiosInstance.request<APIWrapper<T>>(config);

      return [response.data as T, null];
    } catch (error) {
      if (
        error instanceof AxiosError &&
        typeof error.response === "object" &&
        error.response.data &&
        "error" in error.response.data
      ) {
        return [
          null,
          {
            status: Number(error.response.status),
            message: error.response.data.error.message,
          },
        ];
      }

      return [null, { status: 500, message: "Unknown error" }];
    }
  }

  async register(payload: {
    // email: string;
    name_alias: string;
    password: string;
    token: string;
  }) {
    return this.request<User>({
      method: "POST",
      url: "/api/auth/register",
      data: payload,
    });
  }

  async login(payload: { identifier: string; password: string }) {
    return this.request<
      UserSettings & {
        moodle_token: string;
      }
    >({
      method: "POST",
      url: "/api/auth/password",
      data: payload,
    });
  }

  async getUserSettings() {
    return this.request<UserSettings>({
      method: "GET",
      url: "/api/user/settings",
    });
  }

  async getDeadlines() {
    return this.request<Deadline[]>({
      method: "GET",
      url: "/api/user/deadlines",
    });
  }

  async getActiveCourses() {
    return this.request<ActiveCourses>({
      method: "GET",
      url: "/api/user/course",
    });
  }

  async getCourseGrades(course: string) {
    return this.request<Grade[]>({
      method: "GET",
      url: `/api/user/course/${course}/grades`,
    });
  }

  async getCourseContent(course: string) {
    return this.request<CourseContent[]>({
      method: "GET",
      url: `/api/user/course/${course}/contents`,
    });
  }

  async getCoursesOverall() {
    return this.request<CoursesOverall>({
      method: "GET",
      url: "/api/user/course/overall",
    });
  }
}

export const api = new API();
