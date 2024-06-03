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

import { OperationIdsToTagsTransformer } from '../../index';

describe('test OperationIdsToTagsTransformer', () => {
  it('should transform single tag', () => {
    const transformer = new OperationIdsToTagsTransformer();
    const specs = {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0'
      },
      tags: ['tag1'],
      paths: {
        '/hello': {
          get: {
            tags: ['tag1'],
            operationId: 'getHello',
            summary: 'Say hello',
            responses: {
              '200': {
                description: 'A greeting message',
                content: {
                  'text/plain': {
                    schema: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    const transformedSpecs = transformer.transform(specs);
    expect(transformedSpecs.paths['/hello'].get.tags).toEqual(['getHello']);
  });

  it('should transform multiple tags', () => {
    const transformer = new OperationIdsToTagsTransformer();
    const specs = {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0'
      },
      tags: ['tag1', 'tag2', 'tag3'],
      paths: {
        '/hello': {
          get: {
            tags: ['tag1', 'tag2'],
            operationId: 'getHello',
            summary: 'Say hello',
            responses: {
              '200': {
                description: 'A greeting message',
                content: {
                  'text/plain': {
                    schema: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    const transformedSpecs = transformer.transform(specs);
    expect(transformedSpecs.paths['/hello'].get.tags).toEqual(['getHello']);
  });

  it('should return the same tags if an operation has no operationId', () => {
    const transformer = new OperationIdsToTagsTransformer();
    const specs = {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0'
      },
      paths: {
        '/hello': {
          get: {
            tags: ['tag1', 'tag2'],
            summary: 'Say hello',
            responses: {
              '200': {
                description: 'A greeting message',
                content: {
                  'text/plain': {
                    schema: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
    const transformedSpecs = transformer.transform(specs);
    expect(transformedSpecs.paths['/hello'].get.tags).toEqual(['tag1', 'tag2']);
  });

  it('should return the same specs if no paths defined', () => {
    const transformer = new OperationIdsToTagsTransformer();
    const specs = {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0'
      },
      tags: ['tag1', 'tag2', 'tag3']
    };
    const transformedSpecs = transformer.transform(specs);
    expect(transformedSpecs).toEqual(specs);
  });
});
