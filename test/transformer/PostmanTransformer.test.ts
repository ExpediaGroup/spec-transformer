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
      tags: [
        {
          name: 'tag1',
          description: 'Tag 1'
        }
      ],
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

    const transformer = new PostmanTransformer();
    const postmanCollection = transformer.transform(specs);

    expect(postmanCollection.info.name).toEqual(specs.info.title);
    expect(postmanCollection.info.description.content).toContain(specs.info.description);
    expect(postmanCollection.info.description.content).toContain(specs.info.contact.name);
    expect(postmanCollection.info.description.content).toContain(specs.info.contact.email);
    expect(postmanCollection.item[0].item[0].request.name).toEqual(specs.paths['/hello'].get.summary);
    expect(postmanCollection.item[0].item[0].request.description.content).toEqual(
      specs.paths['/hello'].get.description
    );
  });

  it('should return an empty record for empty input', () => {
    const transformer = new PostmanTransformer();
    const postmanCollection = transformer.transform({});
    expect(postmanCollection).toEqual({});
  });

  it('should return an empty record for invalid input', () => {
    const transformer = new PostmanTransformer();
    const postmanCollection = transformer.transform({ test: 'test' });
    expect(postmanCollection).toEqual({});
  });
});
