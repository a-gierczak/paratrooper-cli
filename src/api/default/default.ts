/**
 * Generated by orval v7.0.1 🍺
 * Do not edit manually.
 * Paratrooper API
 * OpenAPI spec version: 1.0.0
 */
import type {
  CreateProjectParams,
  GetCodePushUpdate200,
  GetCodePushUpdateParams,
  GetExpoUpdateParams,
  GetUpdatesParams,
  GetUpdatesResponse,
  HealthCheck200,
  PrepareUpdateBody,
  PrepareUpdateResponse,
  Project,
  Update,
} from ".././model";
import { customFetch } from ".././fetch";

/**
 * @summary Health check
 */
export type healthCheckResponse = {
  data: HealthCheck200;
  status: number;
};

export const getHealthCheckUrl = () => {
  return `/api/v1/health`;
};

export const healthCheck = async (
  options?: RequestInit,
): Promise<healthCheckResponse> => {
  return customFetch<Promise<healthCheckResponse>>(getHealthCheckUrl(), {
    ...options,
    method: "GET",
  });
};

/**
 * @summary Get all updates
 */
export type getUpdatesResponse = {
  data: GetUpdatesResponse;
  status: number;
};

export const getGetUpdatesUrl = (
  projectID: string,
  params?: GetUpdatesParams,
) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null) {
      normalizedParams.append(key, "null");
    } else if (value !== undefined) {
      normalizedParams.append(key, value.toString());
    }
  });

  return normalizedParams.size
    ? `/api/v1/admin/${projectID}/updates?${normalizedParams.toString()}`
    : `/api/v1/admin/${projectID}/updates`;
};

export const getUpdates = async (
  projectID: string,
  params?: GetUpdatesParams,
  options?: RequestInit,
): Promise<getUpdatesResponse> => {
  return customFetch<Promise<getUpdatesResponse>>(
    getGetUpdatesUrl(projectID, params),
    {
      ...options,
      method: "GET",
    },
  );
};

/**
 * @summary Get update
 */
export type getUpdateResponse = {
  data: Update;
  status: number;
};

export const getGetUpdateUrl = (projectID: string, updateID: string) => {
  return `/api/v1/admin/${projectID}/update/${updateID}`;
};

export const getUpdate = async (
  projectID: string,
  updateID: string,
  options?: RequestInit,
): Promise<getUpdateResponse> => {
  return customFetch<Promise<getUpdateResponse>>(
    getGetUpdateUrl(projectID, updateID),
    {
      ...options,
      method: "GET",
    },
  );
};

/**
 * @summary Commit update
 */
export type commitUpdateResponse = {
  data: void;
  status: number;
};

export const getCommitUpdateUrl = (projectID: string, updateID: string) => {
  return `/api/v1/admin/${projectID}/update/${updateID}/commit`;
};

export const commitUpdate = async (
  projectID: string,
  updateID: string,
  options?: RequestInit,
): Promise<commitUpdateResponse> => {
  return customFetch<Promise<commitUpdateResponse>>(
    getCommitUpdateUrl(projectID, updateID),
    {
      ...options,
      method: "POST",
    },
  );
};

/**
 * @summary Rollback an update
 */
export type rollbackUpdateResponse = {
  data: void;
  status: number;
};

export const getRollbackUpdateUrl = (projectID: string, updateID: string) => {
  return `/api/v1/admin/${projectID}/update/${updateID}/rollback`;
};

export const rollbackUpdate = async (
  projectID: string,
  updateID: string,
  options?: RequestInit,
): Promise<rollbackUpdateResponse> => {
  return customFetch<Promise<rollbackUpdateResponse>>(
    getRollbackUpdateUrl(projectID, updateID),
    {
      ...options,
      method: "POST",
    },
  );
};

/**
 * @summary Create a project
 */
export type createProjectResponse = {
  data: Project;
  status: number;
};

export const getCreateProjectUrl = () => {
  return `/api/v1/admin/project`;
};

export const createProject = async (
  createProjectParams: CreateProjectParams,
  options?: RequestInit,
): Promise<createProjectResponse> => {
  return customFetch<Promise<createProjectResponse>>(getCreateProjectUrl(), {
    ...options,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(createProjectParams),
  });
};

/**
 * @summary Get project by id
 */
export type getProjectByIDResponse = {
  data: Project;
  status: number;
};

export const getGetProjectByIDUrl = (projectID: string) => {
  return `/api/v1/admin/project/${projectID}`;
};

export const getProjectByID = async (
  projectID: string,
  options?: RequestInit,
): Promise<getProjectByIDResponse> => {
  return customFetch<Promise<getProjectByIDResponse>>(
    getGetProjectByIDUrl(projectID),
    {
      ...options,
      method: "GET",
    },
  );
};

/**
 * @summary Prepare a new update
 */
export type prepareUpdateResponse = {
  data: PrepareUpdateResponse;
  status: number;
};

export const getPrepareUpdateUrl = (projectID: string) => {
  return `/api/v1/admin/${projectID}/update`;
};

export const prepareUpdate = async (
  projectID: string,
  prepareUpdateBody: PrepareUpdateBody,
  options?: RequestInit,
): Promise<prepareUpdateResponse> => {
  return customFetch<Promise<prepareUpdateResponse>>(
    getPrepareUpdateUrl(projectID),
    {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prepareUpdateBody),
    },
  );
};

/**
 * @summary Get Expo update
 */
export type getExpoUpdateResponse = {
  data: string;
  status: number;
};

export const getGetExpoUpdateUrl = (
  projectID: string,
  params?: GetExpoUpdateParams,
) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null) {
      normalizedParams.append(key, "null");
    } else if (value !== undefined) {
      normalizedParams.append(key, value.toString());
    }
  });

  return normalizedParams.size
    ? `/api/v1/public/${projectID}/expo?${normalizedParams.toString()}`
    : `/api/v1/public/${projectID}/expo`;
};

export const getExpoUpdate = async (
  projectID: string,
  params?: GetExpoUpdateParams,
  options?: RequestInit,
): Promise<getExpoUpdateResponse> => {
  return customFetch<Promise<getExpoUpdateResponse>>(
    getGetExpoUpdateUrl(projectID, params),
    {
      ...options,
      method: "GET",
    },
  );
};

/**
 * @summary Get CodePush update
 */
export type getCodePushUpdateResponse = {
  data: GetCodePushUpdate200;
  status: number;
};

export const getGetCodePushUpdateUrl = (params: GetCodePushUpdateParams) => {
  const normalizedParams = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === null) {
      normalizedParams.append(key, "null");
    } else if (value !== undefined) {
      normalizedParams.append(key, value.toString());
    }
  });

  return normalizedParams.size
    ? `/v0.1/public/codepush/update_check?${normalizedParams.toString()}`
    : `/v0.1/public/codepush/update_check`;
};

export const getCodePushUpdate = async (
  params: GetCodePushUpdateParams,
  options?: RequestInit,
): Promise<getCodePushUpdateResponse> => {
  return customFetch<Promise<getCodePushUpdateResponse>>(
    getGetCodePushUpdateUrl(params),
    {
      ...options,
      method: "GET",
    },
  );
};
