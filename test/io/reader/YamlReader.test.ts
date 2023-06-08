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

import { YamlReader } from '../../../index';

describe('test YamlReader', () => {
  it('should return the parsed specs as record', () => {
    const yamlSpecs =
      'openapi: 3.0.0\n' +
      'info:\n' +
      '  title: Pet Store API\n' +
      '  version: 1.0.0\n' +
      'paths:\n' +
      '  /pets:\n' +
      '    get:\n' +
      '      summary: List all pets\n' +
      '      responses:\n' +
      '        \'200\':\n' +
      '          content:\n' +
      '            application/json:    \n' +
      '              schema:\n' +
      '                type: array\n' +
      '                items:\n' +
      '                  type: object\n' +
      '                  properties:\n' +
      '                    id:\n' +
      '                      type: string\n' +
      '                    name:\n' +
      '                      type: string\n';

    expect(new YamlReader().read(yamlSpecs)).toEqual({
      openapi: '3.0.0',
      info: {
        title: 'Pet Store API',
        version: '1.0.0'
      },
      paths: {
        '/pets': {
          get: {
            summary: 'List all pets',
            responses: {
              '200': {
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'string'
                          },
                          name: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });
  });

  it('should return an empty record when input is empty', () => {
    expect(new YamlReader().read('')).toEqual({});
  });
});
