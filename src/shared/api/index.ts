import ky, { HTTPError, type Options } from "ky";
import { API_URL } from "@/shared/config";
import type {
  APIError,
  APIWrapper,
  ActiveCourses,
  CourseContent,
  CoursesOverall,
  Deadline,
  Grade,
  MoodleUser,
  UserSettings,
} from "@/shared/types";
import { getBuildInfo, isDefined, isEmptyString } from "@/shared/utils";
import { useUserStore } from "@/shared/stores/user";

class API {
  kyInstance;

  constructor(baseURL: string) {
    this.kyInstance = ky.create({
      prefixUrl: baseURL,
      retry: { limit: 1 },
      hooks: {
        beforeRequest: [
          (request) => {
            const userStore = useUserStore();
            const token = userStore.token;

            if (isDefined(token) && !isEmptyString(token)) {
              request.headers.set("Auth-Token", token);
            }

            const buildInfo = getBuildInfo();

            if (buildInfo) {
              request.headers.set("X-Requested-With", buildInfo.version);
            }
          },
        ],
        afterResponse: [
          (_input, _options, response) => {
            console.log({ response });
          },

          async (input, options, response) => {
            console.log(response);
            if (response.status === 403) {
              // Get a fresh token
              // const token = await ky('https://example.com/token').text();
              // Retry with the token
              // options.headers.set('Authorization', `token ${token}`);
              // return ky(input, options);
            }
          },
        ],
      },
    });
  }

  private async request<T>(
    input: RequestInfo,
    options?: Options,
  ): Promise<[T, null] | [null, APIError]> {
    try {
      const response = await this.kyInstance(input, options).json<
        APIWrapper<T>
      >();

      return [response as T, null];
    } catch (err) {
      try {
        if (err instanceof HTTPError) {
          const response = await err.response.json();

          if ("error" in response) {
            return [
              null,
              {
                status: err.response.status,
                message: response.error,
              },
            ];
          }
        }
      } catch (_) {
        return [null, { status: 500, message: "Couldn't parse error" }];
      }

      return [null, { status: 500, message: "Something went wrong" }];
    }
  }

  async register(payload: {
    token: string;
    name_alias?: string;
    password?: string;
    email?: string;
  }) {
    return this.request<MoodleUser>("auth/register", {
      method: "POST",
      json: payload,
    });
  }

  async login(payload: { identifier: string; password: string }) {
    return this.request<
      UserSettings & {
        moodle_token: string;
      }
    >("auth/password", {
      method: "POST",
      json: payload,
    });
  }

  async authorize(token: string) {
    return this.request<
      UserSettings & {
        moodle_token: string;
      }
    >("auth/token", {
      method: "POST",
      json: { token },
    });
  }

  async getUserSettings() {
    return this.request<UserSettings>("user/settings", {
      method: "GET",
    });
  }

  async getDeadlines() {
    return this.request<Deadline[]>("user/deadlines", {
      method: "GET",
    });
  }

  async getActiveCourses() {
    return this.request<ActiveCourses>("user/courses", {
      method: "GET",
    });
  }

  async getCourseGrades(courseId: string) {
    return this.request<Grade[]>(`api/user/courses/${courseId}/grades`, {
      method: "GET",
    });
  }

  async getCourseContent(courseId: string) {
    return this.request<CourseContent[]>(
      `api/user/course/${courseId}/content`,
      {
        method: "GET",
      },
    );
  }

  async getCoursesOverall() {
    return this.request<CoursesOverall>("user/courses/overall", {
      method: "GET",
    });
  }
}

export const api = new API(`${API_URL}/v1`);
