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

import { PostmanTransformer } from '../../index';

describe('test PostmanTransformer', () => {
  const transformer = new PostmanTransformer();

  it('should generate a valid Postman collection', () => {
    const specs = {
      openapi: '3.0.0',
      info: {
        title: 'Example API',
        version: '1.0.0',
        description: 'This is a sample server Pet store server.',
        contact: {
          name: 'API Support',
          email: 'support@example.com'
        }
      },
      tags: [{
        name: 'tag1',
        description: 'Tag 1'
      }],
      paths: {
        '/hello': {
          get: {
            tags: ['tag1'],
            description: 'Returns a greeting message',
            summary: 'Say hello',
            operationId: 'hello',
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

    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection.info.name).toEqual(specs.info.title);
    expect(postmanCollection.info.description.content).toContain(specs.info.description);
    expect(postmanCollection.info.description.content).toContain(specs.info.contact.name);
    expect(postmanCollection.info.description.content).toContain(specs.info.contact.email);
    expect(postmanCollection.item[0].item[0].request.name).toEqual(specs.paths['/hello'].get.summary);
    expect(postmanCollection.item[0].item[0].request.description.content).toEqual(specs.paths['/hello'].get.description);
  });

  it('should return an empty record for empty input', () => {
    const postmanCollection = transformer.transform({});
    expect(postmanCollection).toEqual({});
  });

  it('should return an empty record for invalid input and no semantic version number of the OAS specification', () => {
    const postmanCollection = transformer.transform({ test: 'test' });
    expect(postmanCollection).toEqual({});
  });

  it('should return an empty record for a spec with basic metadata', () => {
    const postmanCollection = transformer.transform({
      openapi: '3.1.0',
      info: { title: 'Example API', version: '1.0.0' }
    });
    expect(postmanCollection).toEqual({});
  });

  it('should return a valid postman collection for a spec with basic metadata and no paths', () => {
    const postmanCollection = transformer.transform({
      openapi: '3.1.0',
      info: { title: 'Example API', version: '1.0.0' },
      paths: {}
    });
    expect(postmanCollection.info.name).toEqual('Example API');
  });

  it('should group requests into folders by tags', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Tag Test API', version: '1.0.0' },
      tags: [
        { name: 'users', description: 'User operations' },
        { name: 'orders', description: 'Order operations' }
      ],
      paths: {
        '/users': {
          get: {
            tags: ['users'],
            summary: 'List users',
            operationId: 'listUsers',
            responses: { '200': { description: 'OK' } }
          }
        },
        '/orders': {
          get: {
            tags: ['orders'],
            summary: 'List orders',
            operationId: 'listOrders',
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const folderNames = postmanCollection.item.map((folder: Record<string, unknown>) => folder.name);
    expect(folderNames).toContain('users');
    expect(folderNames).toContain('orders');
  });

  it('should handle multiple HTTP methods on the same path', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Multi Method API', version: '1.0.0' },
      tags: [{ name: 'resources' }],
      paths: {
        '/resources': {
          get: {
            tags: ['resources'],
            summary: 'Get resources',
            operationId: 'getResources',
            responses: { '200': { description: 'OK' } }
          },
          post: {
            tags: ['resources'],
            summary: 'Create resource',
            operationId: 'createResource',
            responses: { '201': { description: 'Created' } }
          },
          delete: {
            tags: ['resources'],
            summary: 'Delete resources',
            operationId: 'deleteResources',
            responses: { '204': { description: 'Deleted' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const resourcesFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'resources'
    );
    expect(resourcesFolder).toBeDefined();
    const requestNames = resourcesFolder.item.map((req: Record<string, unknown>) => (req as any).request.name);
    expect(requestNames).toContain('Get resources');
    expect(requestNames).toContain('Create resource');
    expect(requestNames).toContain('Delete resources');
  });

  it('should handle path parameters', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Path Param API', version: '1.0.0' },
      tags: [{ name: 'items' }],
      paths: {
        '/items/{itemId}': {
          get: {
            tags: ['items'],
            summary: 'Get item by ID',
            operationId: 'getItem',
            parameters: [
              {
                name: 'itemId',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const itemsFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'items'
    );
    const request = itemsFolder.item[0].request;
    const urlPath = request.url.path.join('/');
    expect(urlPath).toContain(':itemId');
  });

  it('should handle query parameters', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Query Param API', version: '1.0.0' },
      tags: [{ name: 'search' }],
      paths: {
        '/search': {
          get: {
            tags: ['search'],
            summary: 'Search items',
            operationId: 'searchItems',
            parameters: [
              {
                name: 'q',
                in: 'query',
                required: true,
                schema: { type: 'string' }
              },
              {
                name: 'limit',
                in: 'query',
                required: false,
                schema: { type: 'integer', default: 10 }
              }
            ],
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const searchFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'search'
    );
    const queryParams = searchFolder.item[0].request.url.query;
    const paramNames = queryParams.map((p: Record<string, unknown>) => p.key);
    expect(paramNames).toContain('q');
    expect(paramNames).toContain('limit');
  });

  it('should handle request body with JSON content', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Request Body API', version: '1.0.0' },
      tags: [{ name: 'users' }],
      paths: {
        '/users': {
          post: {
            tags: ['users'],
            summary: 'Create user',
            operationId: 'createUser',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string', format: 'email' }
                    },
                    required: ['name', 'email']
                  }
                }
              }
            },
            responses: { '201': { description: 'Created' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const usersFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'users'
    );
    const request = usersFolder.item[0].request;
    expect(request.method).toEqual('POST');
    expect(request.body).toBeDefined();
    expect(request.body.mode).toEqual('raw');
  });

  it('should handle OpenAPI 3.1.0 specs', () => {
    const specs = {
      openapi: '3.1.0',
      info: { title: 'OAS 3.1 API', version: '2.0.0' },
      tags: [{ name: 'health' }],
      paths: {
        '/health': {
          get: {
            tags: ['health'],
            summary: 'Health check',
            operationId: 'healthCheck',
            responses: {
              '200': {
                description: 'Healthy',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', const: 'ok' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection.info.name).toEqual('OAS 3.1 API');
    const healthFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'health'
    );
    expect(healthFolder).toBeDefined();
    expect(healthFolder.item[0].request.name).toEqual('Health check');
  });

  it('should handle specs with $ref schema references', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Ref API', version: '1.0.0' },
      tags: [{ name: 'products' }],
      paths: {
        '/products': {
          get: {
            tags: ['products'],
            summary: 'List products',
            operationId: 'listProducts',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Product' }
                    }
                  }
                }
              }
            }
          },
          post: {
            tags: ['products'],
            summary: 'Create product',
            operationId: 'createProduct',
            requestBody: {
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Product' }
                }
              }
            },
            responses: { '201': { description: 'Created' } }
          }
        }
      },
      components: {
        schemas: {
          Product: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              price: { type: 'number', format: 'double' }
            },
            required: ['id', 'name', 'price']
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const productsFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'products'
    );
    expect(productsFolder.item).toHaveLength(2);
  });

  it('should handle specs with security schemes', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Secured API', version: '1.0.0' },
      tags: [{ name: 'secure' }],
      paths: {
        '/secure': {
          get: {
            tags: ['secure'],
            summary: 'Secure endpoint',
            operationId: 'secureEndpoint',
            security: [{ bearerAuth: [] }],
            responses: { '200': { description: 'OK' } }
          }
        }
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection.info.name).toEqual('Secured API');
    const secureFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'secure'
    );
    expect(secureFolder).toBeDefined();
  });

  it('should handle specs with multiple tags per operation', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Multi Tag API', version: '1.0.0' },
      tags: [
        { name: 'admin' },
        { name: 'users' }
      ],
      paths: {
        '/admin/users': {
          get: {
            tags: ['admin', 'users'],
            summary: 'Admin list users',
            operationId: 'adminListUsers',
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    // When folderStrategy is Tags, operations with multiple tags appear in each tag folder
    const folderNames = postmanCollection.item.map((folder: Record<string, unknown>) => folder.name);
    expect(folderNames).toContain('admin');
  });

  it('should handle specs with no tags (operations placed at root)', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'No Tags API', version: '1.0.0' },
      paths: {
        '/ping': {
          get: {
            summary: 'Ping',
            operationId: 'ping',
            responses: { '200': { description: 'pong' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection.info.name).toEqual('No Tags API');
    expect(postmanCollection.item.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle specs with server URLs', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Server URL API', version: '1.0.0' },
      servers: [
        { url: 'https://api.example.com/v1' },
        { url: 'https://staging.example.com/v1' }
      ],
      tags: [{ name: 'default' }],
      paths: {
        '/data': {
          get: {
            tags: ['default'],
            summary: 'Get data',
            operationId: 'getData',
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection.info.name).toEqual('Server URL API');
    expect(postmanCollection.variable).toBeDefined();
  });

  it('should handle specs with header parameters', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Header API', version: '1.0.0' },
      tags: [{ name: 'api' }],
      paths: {
        '/data': {
          get: {
            tags: ['api'],
            summary: 'Get data',
            operationId: 'getData',
            parameters: [
              {
                name: 'X-Request-ID',
                in: 'header',
                required: true,
                schema: { type: 'string', format: 'uuid' }
              }
            ],
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const folder = postmanCollection.item.find(
      (f: Record<string, unknown>) => f.name === 'api'
    );
    const headers = folder.item[0].request.header;
    const headerNames = headers.map((h: Record<string, unknown>) => h.key);
    expect(headerNames).toContain('X-Request-ID');
  });

  it('should handle deeply nested schema references', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Nested Ref API', version: '1.0.0' },
      tags: [{ name: 'orders' }],
      paths: {
        '/orders': {
          get: {
            tags: ['orders'],
            summary: 'List orders',
            operationId: 'listOrders',
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Order' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Order: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              customer: { $ref: '#/components/schemas/Customer' },
              items: {
                type: 'array',
                items: { $ref: '#/components/schemas/OrderItem' }
              }
            }
          },
          Customer: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              address: { $ref: '#/components/schemas/Address' }
            }
          },
          Address: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              zip: { type: 'string' }
            }
          },
          OrderItem: {
            type: 'object',
            properties: {
              productId: { type: 'integer' },
              quantity: { type: 'integer' },
              price: { type: 'number' }
            }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const ordersFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'orders'
    );
    expect(ordersFolder).toBeDefined();
    expect(ordersFolder.item[0].request.name).toEqual('List orders');
  });

  it('should handle specs with example values in parameters', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Example Values API', version: '1.0.0' },
      tags: [{ name: 'users' }],
      paths: {
        '/users/{userId}': {
          get: {
            tags: ['users'],
            summary: 'Get user',
            operationId: 'getUser',
            parameters: [
              {
                name: 'userId',
                in: 'path',
                required: true,
                schema: { type: 'string' },
                example: 'user-123'
              }
            ],
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'user-123' },
                        name: { type: 'string', example: 'John Doe' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    const usersFolder = postmanCollection.item.find(
      (folder: Record<string, unknown>) => folder.name === 'users'
    );
    expect(usersFolder).toBeDefined();
    // With parametersResolution: 'Example', examples should be used for parameter generation
    const pathVars = usersFolder.item[0].request.url.variable;
    const userIdVar = pathVars.find((v: Record<string, unknown>) => v.key === 'userId');
    expect(userIdVar).toBeDefined();
  });

  it('should produce a collection with proper structure (info, item, variable)', () => {
    const specs = {
      openapi: '3.0.0',
      info: { title: 'Structure Test API', version: '3.0.0', description: 'Testing structure' },
      servers: [{ url: 'https://api.example.com' }],
      paths: {
        '/test': {
          get: {
            summary: 'Test endpoint',
            responses: { '200': { description: 'OK' } }
          }
        }
      }
    };

    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection).toHaveProperty('info');
    expect(postmanCollection).toHaveProperty('item');
    expect(postmanCollection.info).toHaveProperty('name', 'Structure Test API');
    expect(postmanCollection.info).toHaveProperty('schema');
    expect(postmanCollection.info.schema).toContain('schema.getpostman.com');
  });
});
