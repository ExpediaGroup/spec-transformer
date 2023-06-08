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

import {
  COMMON_UNWANTED_HEADERS,
  HeaderRemovalTransformer,
  JsonWriter,
  PostmanTransformer,
  TagsSettingTransformer,
  TransformerChain,
  YamlReader,
  YamlWriter
} from '../../index';

describe('test TransformerChain', () => {
  const specs =
    'openapi: 3.0.0\n' +
    'info:\n' +
    '  title: Pet Store API\n' +
    '  version: 1.0.0\n' +
    '  description: Pet Store API\n' +
    'tags:\n' +
    '  - name: pets\n' +
    '    description: Operations related to pets\n' +
    'paths:\n' +
    '  /pets:\n' +
    '    get:\n' +
    '      summary: List all pets\n' +
    '      tags:\n' +
    '        - pets\n' +
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

  it('should transform a yaml specs', () => {
    const transformedSpecs =
      'openapi: 3.0.0\n' +
      'info:\n' +
      '  title: Pet Store API\n' +
      '  version: 1.0.0\n' +
      '  description: Pet Store API\n' +
      'tags:\n' +
      '  - name: animals\n' +
      'paths:\n' +
      '  /pets:\n' +
      '    get:\n' +
      '      summary: List all pets\n' +
      '      tags:\n' +
      '        - animals\n' +
      '      responses:\n' +
      '        "200":\n' +
      '          content:\n' +
      '            application/json:\n' +
      '              schema:\n' +
      '                type: array\n' +
      '                items:\n' +
      '                  type: object\n' +
      '                  properties:\n' +
      '                    id:\n' +
      '                      type: string\n' +
      '                    name:\n' +
      '                      type: string\n';

    expect(
      new TransformerChain([new TagsSettingTransformer('animals')]).transform(specs, new YamlReader(), new YamlWriter())
    ).toEqual(transformedSpecs);
  });

  it('should transform a yaml file based on multiple transformers, and return the result as yaml', () => {
    const specs =
      'openapi: 3.0.0\n' +
      'info:\n' +
      '  title: Pet Store API\n' +
      '  version: 1.0.0\n' +
      'tags:\n' +
      '  - name: pets\n' +
      '    description: Operations related to pets\n' +
      'paths:\n' +
      '  /pets:\n' +
      '    get:\n' +
      '      summary: List all pets\n' +
      '      tags:\n' +
      '        - pets\n' +
      '      parameters:\n' +
      '        - name: accept\n' +
      '          in: header\n' +
      '        - name: X-Request-ID\n' +
      '          in: header\n' +
      '        - name: content-type\n' +
      '          in: header\n' +
      '      responses:\n' +
      '        "200":\n' +
      '          content:\n' +
      '            application/json:\n' +
      '              schema:\n' +
      '                type: array\n' +
      '                items:\n' +
      '                  type: object\n' +
      '                  properties:\n' +
      '                    id:\n' +
      '                      type: string\n' +
      '                    name:\n' +
      '                      type: string\n';

    const transformedSpecs =
      'openapi: 3.0.0\n' +
      'info:\n' +
      '  title: Pet Store API\n' +
      '  version: 1.0.0\n' +
      'tags:\n' +
      '  - name: animals\n' +
      'paths:\n' +
      '  /pets:\n' +
      '    get:\n' +
      '      summary: List all pets\n' +
      '      tags:\n' +
      '        - animals\n' +
      '      parameters:\n' +
      '        - name: X-Request-ID\n' +
      '          in: header\n' +
      '      responses:\n' +
      '        "200":\n' +
      '          content:\n' +
      '            application/json:\n' +
      '              schema:\n' +
      '                type: array\n' +
      '                items:\n' +
      '                  type: object\n' +
      '                  properties:\n' +
      '                    id:\n' +
      '                      type: string\n' +
      '                    name:\n' +
      '                      type: string\n';

    expect(
      new TransformerChain([
        new TagsSettingTransformer('animals'),
        new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS)
      ]).transform(specs, new YamlReader(), new YamlWriter())
    ).toEqual(transformedSpecs);
  });

  it('should transform a record with multiple transformers', () => {
    const specs = {
      'openapi': '3.0.0',
      'info': {
        'title': 'Pet Store API',
        'version': '1.0.0'
      },
      'tags': [
        {
          'name': 'pets',
          'description': 'Operations related to pets'
        }
      ],
      'paths': {
        '/pets': {
          'get': {
            'summary': 'List all pets',
            'tags': [
              'pets'
            ],
            'parameters': [
              {
                'name': 'accept',
                'in': 'header'
              },
              {
                'name': 'X-Request-ID',
                'in': 'header'
              },
              {
                'name': 'content-type',
                'in': 'header'
              }
            ],
            'responses': {
              '200': {
                'content': {
                  'application/json': {
                    'schema': {
                      'type': 'array',
                      'items': {
                        'type': 'object',
                        'properties': {
                          'id': {
                            'type': 'string'
                          },
                          'name': {
                            'type': 'string'
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
    };

    const transformedSpecs = {
      'openapi': '3.0.0',
      'info': {
        'title': 'Pet Store API',
        'version': '1.0.0'
      },
      'tags': [
        { name: 'animals' }
      ],
      'paths': {
        '/pets': {
          'get': {
            'summary': 'List all pets',
            'tags': [
              'animals'
            ],
            'parameters': [
              {
                'name': 'X-Request-ID',
                'in': 'header'
              }
            ],
            'responses': {
              '200': {
                'content': {
                  'application/json': {
                    'schema': {
                      'type': 'array',
                      'items': {
                        'type': 'object',
                        'properties': {
                          'id': {
                            'type': 'string'
                          },
                          'name': {
                            'type': 'string'
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
    };

    expect(
      new TransformerChain([
        new TagsSettingTransformer('animals'),
        new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS)
      ]).transformRecord(specs)
    ).toEqual(transformedSpecs);
  });

  it('should transform a yaml specs to Postman Collection (in json)', () => {

    const transformedSpecs = new TransformerChain([
      new TagsSettingTransformer('animals'),
      new PostmanTransformer()
    ]).transform(specs, new YamlReader(), new JsonWriter());

    expect(transformedSpecs).toContain('"name": "Pet Store API"');
    expect(transformedSpecs).toContain('"content": "Pet Store API"');
    expect(transformedSpecs).toContain('"name": "animals"');
    expect(transformedSpecs).toContain('"name": "List all pets"');
  });
});
