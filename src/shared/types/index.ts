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

export type Deadline = {
  event_id: number;
  timestart: number;
  instance: number;
  name: string;
  visible: number;
  course_id: number;
  course_name: string;
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

type CourseModule = {
  id: number;
  url: string;
  name: string;
  instance: number;
  contextid: number;
  description?: string;
  visible: number;
  uservisible: boolean;
  visibleoncoursepage: number;
  modicon: string;
  modname: string;
  modplural: string;
  indent: number;
  onclick: string;
  afterlink: any;
  customdata: string;
  noviewlink: boolean;
  completion: number;
  completiondata: {
    state: number;
    timecompleted: number;
    overrideby: any;
    valueused: boolean;
    hascompletion: boolean;
    isautomatic: boolean;
    istrackeduser: boolean;
    uservisible: boolean;
    details: any[];
  };
  dates: {
    label: string;
    timestamp: number;
  }[];
  availabilityinfo?: string;
  contents?: {
    type: string;
    filename: string;
    filepath: string;
    filesize: number;
    fileurl: string;
    timecreated: number;
    timemodified: number;
    sortorder: number;
    mimetype: string;
    isexternalfile: boolean;
    userid: number;
    author: string;
    license: string;
  }[];
  contentsinfo?: {
    filescount: number;
    filessize: number;
    lastmodified: number;
    mimetypes: string[];
    repositorytype: string;
  };
};

export type CourseContent = {
  id: number;
  name: string;
  visible: number;
  summary: string;
  summaryformat: number;
  section: number;
  hiddenbynumsections: number;
  uservisible: boolean;
  modules: CourseModule[];
};

export type CourseContents = CourseContent[];
