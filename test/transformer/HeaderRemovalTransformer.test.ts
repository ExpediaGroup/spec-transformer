/**
 * Copyright (C) 2023 Expedia, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { COMMON_UNWANTED_HEADERS, HeaderRemovalTransformer } from '../../index';

describe('test HeaderRemovalTransformer', () => {
  const acceptHeader = {
    in: 'header',
    name: 'accept',
    schema: {
      type: 'string',
    },
  };
  const acceptEncodingHeader = {
    in: 'header',
    name: 'accept-encoding',
    schema: {
      type: 'string',
    },
  };
  const acceptEncodingCapitalizedHeader = {
    in: 'header',
    name: 'Accept-Encoding',
    schema: {
      type: 'string',
    },
  };
  const authorizationHeader = {
    in: 'header',
    name: 'authorization',
    schema: {
      type: 'string',
    },
  };
  const contentTypeHeader = {
    in: 'header',
    name: 'content-type',
    schema: {
      type: 'string',
    },
  };
  const userAgentHeader = {
    in: 'header',
    name: 'user-agent',
    schema: {
      type: 'string',
    },
  };
  const xCustomHeader = {
    in: 'header',
    name: 'x-custom-header',
    schema: {
      type: 'string',
    },
  };
  const acceptQueryParameter = {
    in: 'query',
    name: 'accept',
    schema: {
      type: 'string',
    },
  };

  const specs = {
    openapi: '3.0.0',
    info: {
      title: 'Example API',
      version: '1.0.0',
    },
    paths: {
      '/hello': {
        get: {
          tags: ['inPath-Get'],
          summary: 'Say hello from path /hello - GET',
          parameters: [
            acceptHeader,
            acceptEncodingHeader,
            acceptEncodingCapitalizedHeader,
            authorizationHeader,
            contentTypeHeader,
            userAgentHeader,
            xCustomHeader,
            acceptQueryParameter,
          ],
          responses: {
            '200': {
              description: 'A greeting message',
              content: {
                'text/plain': {
                  schema: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['inPath-Post'],
          summary: 'Say hello from path /hello - POST',
          parameters: {
            $ref: '#/components/parameters/AcceptHeaderParameter',
          },
        },
        put: {
          tags: ['inPath-Put'],
          summary: 'Say hello from path /hello - PUT',
          parameters: {
            $ref: '#/components/parameters/XCustomHeaderParameter',
          },
        },
      },
    },
    components: {
      parameters: {
        AcceptHeaderParameter: acceptHeader,
        XCustomHeaderParameter: xCustomHeader,
      },
      schemas: {
        MySchema: {
          type: 'object',
          properties: {
            property1: {
              type: 'string',
            },
          },
        },
      },
    },
  };

  it('should remove unwanted headers', () => {
    const transformer = new HeaderRemovalTransformer(['accept', 'content-type']);
    const transformedSpecs = transformer.transform(specs);

    expect(transformedSpecs.paths['/hello'].get.parameters).toEqual([
      acceptEncodingHeader,
      acceptEncodingCapitalizedHeader,
      authorizationHeader,
      userAgentHeader,
      xCustomHeader,
      acceptQueryParameter,
    ]);
  });

  it('should remove unwanted headers with common unwanted headers constant', () => {
    const transformer = new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS);
    expect(transformer.transform(specs).paths['/hello'].get.parameters).toEqual([xCustomHeader, acceptQueryParameter]);
  });

  it('should not remove any headers when no unwanted headers are provided', () => {
    const transformer = new HeaderRemovalTransformer([]);
    expect(transformer.transform(specs).paths['/hello'].get.parameters).toEqual([
      acceptHeader,
      acceptEncodingHeader,
      acceptEncodingCapitalizedHeader,
      authorizationHeader,
      contentTypeHeader,
      userAgentHeader,
      xCustomHeader,
      acceptQueryParameter,
    ]);
  });

  it('should remove unwanted headers from components parameters', () => {
    const transformer = new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS);

    expect(transformer.transform(specs).paths['/hello'].post.parameters).toEqual({});
    expect(transformer.transform(specs).paths['/hello'].put.parameters).toEqual({
      $ref: '#/components/parameters/XCustomHeaderParameter',
    });
  });
});
