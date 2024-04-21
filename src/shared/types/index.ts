/// Routing

export enum RouteName {
  Home = "home",
  Dashboard = "dashboard",
  Login = "login",
  SignUp = "sign-up",
  Token = "token",
  NotFound = "404",
  Account = "account",
  AccountProfile = "profile",
  AccountNotifications = "notifications",
  Course = "course",
  Grades = "course-grades",
  Assignment = "assignment",
  Terms = "terms",
  Privacy = "privacy",
}

/// HTTP

export type APIError = {
  status: number;
  message: string;
};

export type APIErrorResponse = {
  error: APIError;
};

export type APIWrapper<T> = T | APIErrorResponse;

/// Application

export type User = {
  moodle_id: number;
  username: string;
  name: string;
  name_alias?: string;
  email?: string;
};

export type Provider = {
  name: string;
  api: string;
  description?: string;
  privacy?: string;
  moodle: {
    requiresTokenGeneration: boolean;
  };
  services?: {
    [key: string]: {
      name: string;
      description: string;
      url: string;
    };
  };
};

export type Providers = Record<string, Provider>;

/// API

export type MoodleUser = {
  moodle_id: number;
  username: string;
  name: string;
  name_alias: string | null;
  email: string | null;
};

// TODO: Replace with real types
type NotifyMethod = "email" | "webhook";

export type UserSettings = {
  moodle_id: number;
  username: string;
  name: string;
  name_alias: string | null;
  has_password: boolean;
  email: string | null;
  email_verified_at: string | null;
  notify_method: NotifyMethod | null;
  webhook_secret: string | null;
};

// TODO: Complete types
export type Deadline = {
  event_id: number;
  timestart: number;
  instance: number;
  name: string;
  visible: number;
  course_id: number;
  course_name: string;
  assignment: {
    assignment_id: number;
  };
};

export type ActiveCourse = {
  course_id: number;
  name: string;
  coursecategory: string;
  url: string;
  start_date: number;
  end_date: number;
};

export type ExtendedCourse = ActiveCourse & {
  grades: Grade[];
};

export type Grade = {
  grade_id: number;
  moodle_id: number;
  cmid: number;
  course_id: number;
  name: string;
  percentage: number;
  laravel_through_key: number;
};

export type Course = {
  course_id: number;
  name: string;
  coursecategory: string;
  url: string;
  start_date: number;
  end_date: number;
  content: CourseContent[];
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

export type AssignmentAttachment = {
  filename: string;
  filepath: string;
  filesize: number;
  fileurl: string;
  timemodified: number;
  mimetype: string;
  isexternalfile: boolean;
};

export type CourseModule = {
  id: number;
  url: string;
  name: string;
  instance: number;
  description?: string;
  contextid: number;
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
  contents?: (AssignmentAttachment & {
    // filename: string;
    // filepath: string;
    // filesize: number;
    // fileurl: string;
    // timemodified: number;
    // mimetype: string;
    // isexternalfile: boolean;
    type: string;
    timecreated: number;
    sortorder: number;
    userid: number;
    author: string;
    license: string;
  })[];
  contentsinfo?: {
    filescount: number;
    filessize: number;
    lastmodified: number;
    mimetypes: string[];
    repositorytype: string;
  };
};

export type Assignment = {
  assignment_id: number;
  course_id: number;
  name: string;
  nosubmissions: boolean;
  duedate: number;
  allowsubmissionsfromdate: number;
  grade: number;
  introattachments: AssignmentAttachment[];
};
