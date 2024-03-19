export enum RouteName {
  Home = "home",
  Login = "login",
  SignUp = "sign-up",
  NotFound = "404",
}

export type APIError = {
  status: number;
  message: string;
};

export type APIErrorResponse = {
  error: APIError;
};

export type APIWrapper<T> = T | APIErrorResponse;

export type User = {
  moodle_id: number;
  barcode: string;
  name?: string;
  name_alias?: string;
  email?: string;
};

// TODO: Replace with real types
type NotifyMethod = "email" | "webhook";

export type UserSettings = {
  moodle_id: number;
  barcode: string;
  name: string;
  name_alias: string | null;
  has_password: boolean;
  email: string | null;
  email_verified_at: string | null;
  notify_method: NotifyMethod | null;
  webhook_secret: string | null;
};

export type ActiveCourse = {
  course_id: number;
  name: string;
  coursecategory: string;
  url: string;
  start_date: number;
  end_date: number;
};

export type ActiveCourses = ActiveCourse[];

export type Grade = {
  grade_id: number;
  moodle_id: number;
  cmid: number;
  course_id: number;
  name: string;
  percentage: number;
  laravel_through_key: number;
};

export type ExtendedCourse = ActiveCourse & {
  grades: Grade[];
};

export type CoursesOverall = User & {
  courses: ExtendedCourse[];
};
