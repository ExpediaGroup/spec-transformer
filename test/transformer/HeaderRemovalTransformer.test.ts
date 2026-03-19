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

describe('test HeaderRemovalTransformer with $ref in parameters arrays', () => {
  const refInArraySpecs = {
    openapi: '3.0.0',
    info: { title: 'Test API', version: '1.0.0' },
    paths: {
      '/test': {
        get: {
          parameters: [
            { $ref: '#/components/parameters/AcceptHeader' },
            { $ref: '#/components/parameters/TraceIdHeader' },
            { $ref: '#/components/parameters/QueryParam' },
            { in: 'header', name: 'x-custom', schema: { type: 'string' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ]
        }
      }
    },
    components: {
      parameters: {
        AcceptHeader: { in: 'header', name: 'accept', schema: { type: 'string' } },
        TraceIdHeader: { in: 'header', name: 'x-trace-id', schema: { type: 'string' } },
        QueryParam: { in: 'query', name: 'page', schema: { type: 'integer' } },
      },
      schemas: { SomeSchema: { type: 'object' } }
    }
  };

  it('should remove $ref to header in removal list from array', () => {
    const transformer = new HeaderRemovalTransformer(['accept']);
    const result = transformer.transform(refInArraySpecs);
    expect(result.paths['/test'].get.parameters).not.toContainEqual(
      { $ref: '#/components/parameters/AcceptHeader' }
    );
  });

  it('should keep $ref to header NOT in removal list', () => {
    const transformer = new HeaderRemovalTransformer(['accept']);
    const result = transformer.transform(refInArraySpecs);
    expect(result.paths['/test'].get.parameters).toContainEqual(
      { $ref: '#/components/parameters/TraceIdHeader' }
    );
  });

  it('should keep $ref to non-header (query) param', () => {
    const transformer = new HeaderRemovalTransformer(['accept', 'x-trace-id']);
    const result = transformer.transform(refInArraySpecs);
    expect(result.paths['/test'].get.parameters).toContainEqual(
      { $ref: '#/components/parameters/QueryParam' }
    );
  });

  it('should filter mixed array of inline and $ref parameters correctly', () => {
    const transformer = new HeaderRemovalTransformer(['accept', 'x-custom']);
    const result = transformer.transform(refInArraySpecs);
    expect(result.paths['/test'].get.parameters).toEqual([
      { $ref: '#/components/parameters/TraceIdHeader' },
      { $ref: '#/components/parameters/QueryParam' },
      { in: 'query', name: 'limit', schema: { type: 'integer' } },
    ]);
  });

  it('should match resolved $ref headers case-insensitively', () => {
    const specsWithCaps = {
      ...refInArraySpecs,
      components: {
        ...refInArraySpecs.components,
        parameters: {
          ...refInArraySpecs.components.parameters,
          TraceIdHeader: { in: 'header', name: 'X-Trace-Id', schema: { type: 'string' } },
        }
      }
    };
    const transformer = new HeaderRemovalTransformer(['x-trace-id']);
    const result = transformer.transform(specsWithCaps);
    expect(result.paths['/test'].get.parameters).not.toContainEqual(
      { $ref: '#/components/parameters/TraceIdHeader' }
    );
  });

  it('should remove matching headers from components/parameters', () => {
    const transformer = new HeaderRemovalTransformer(['accept', 'x-trace-id']);
    const result = transformer.transform(refInArraySpecs);
    expect(result.components.parameters).toEqual({
      QueryParam: { in: 'query', name: 'page', schema: { type: 'integer' } },
    });
  });

  it('should preserve non-header components and schemas', () => {
    const transformer = new HeaderRemovalTransformer(['accept', 'x-trace-id']);
    const result = transformer.transform(refInArraySpecs);
    expect(result.components.parameters.QueryParam).toBeDefined();
    expect(result.components.schemas).toEqual({ SomeSchema: { type: 'object' } });
  });

  it('should not crash when spec has no components/parameters', () => {
    const specsNoParams = {
      openapi: '3.0.0',
      info: { title: 'Test API', version: '1.0.0' },
      paths: {
        '/test': {
          get: {
            parameters: [
              { in: 'header', name: 'accept', schema: { type: 'string' } },
            ]
          }
        }
      }
    };
    const transformer = new HeaderRemovalTransformer(['accept']);
    const result = transformer.transform(specsNoParams);
    expect(result.paths['/test'].get.parameters).toEqual([]);
  });

  it('should produce empty array when all params are removed', () => {
    const specsAllHeaders = {
      ...refInArraySpecs,
      paths: {
        '/test': {
          get: {
            parameters: [
              { $ref: '#/components/parameters/AcceptHeader' },
              { in: 'header', name: 'x-trace-id', schema: { type: 'string' } },
            ]
          }
        }
      }
    };
    const transformer = new HeaderRemovalTransformer(['accept', 'x-trace-id']);
    const result = transformer.transform(specsAllHeaders);
    expect(result.paths['/test'].get.parameters).toEqual([]);
  });

  it('should keep unresolvable $ref entries as-is', () => {
    const specsWithBadRefs = {
      ...refInArraySpecs,
      paths: {
        '/test': {
          get: {
            parameters: [
              { $ref: '#/components/parameters/NonExistent' },
              { $ref: 'malformed-ref' },
              { in: 'header', name: 'accept', schema: { type: 'string' } },
            ]
          }
        }
      }
    };
    const transformer = new HeaderRemovalTransformer(['accept']);
    const result = transformer.transform(specsWithBadRefs);
    expect(result.paths['/test'].get.parameters).toEqual([
      { $ref: '#/components/parameters/NonExistent' },
      { $ref: 'malformed-ref' },
    ]);
  });
});
