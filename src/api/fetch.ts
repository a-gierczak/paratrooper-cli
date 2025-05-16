import { getConfig } from '../lib/config';
import { removeTrailingSlash } from '../lib/util';
import { ValidationErrorResponse, ValidationFieldError } from './model';
import { debug as makeLogger } from 'debug';

const debug = makeLogger(`ota:api`);

const getBody = <T>(c: Response | Request): Promise<T> => {
  const contentType = c.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return c.json() as Promise<T>;
  }

  return c.text() as Promise<T>;
};

class InvalidInputError extends Error {
  errors: ValidationFieldError[];

  constructor(resp: ValidationErrorResponse) {
    super('Server request failed due to invalid input');
    this.errors = resp.errors;
  }
}

export const customFetch = async <T>(
  url: string,
  options: RequestInit
): Promise<T> => {
  const apiBaseUrl = removeTrailingSlash(getConfig().apiBaseUrl);
  const { projectID } = getConfig();
  const request = new Request(`${apiBaseUrl}${url}`, options);

  request.headers.set('Pt-Project-ID', projectID);

  debug('Calling %s %s', request.method, request.url);
  const response = await fetch(request);
  const data = await getBody<T>(response);

  if (!response.ok) {
    if (response.status === 400) {
      throw new InvalidInputError(data as unknown as ValidationErrorResponse);
    }

    throw new Error(
      `Request failed [${request.method}] ${request.url}. Response status: ${response.status}.\n\n${JSON.stringify(
        data,
        undefined,
        2
      )}`
    );
  }

  return { status: response.status, data } as T;
};
