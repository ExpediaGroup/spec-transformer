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

import Spec from '../../src/model/Spec';

describe('test Spec - Basic Tests', () => {
  describe('test records()', () => {
    it('should return the internal specs in a typical case', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        }
      };
      expect(new Spec(specs).records()).toEqual(specs);
    });

    it('should return the internal specs when no specs provided', () => {
      expect(new Spec({}).records()).toEqual({});
    });
  });

  describe('test withTags()', () => {
    it('should replace the tags with the given tags', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        },
        tags: ['tag1', 'tag2']
      };
      expect(new Spec(specs).withTags(['tag3', 'tag4']).records()).toEqual({
        ...specs,
        tags: [{ name: 'tag3' }, { name: 'tag4' }]
      });
    });

    it('should add the given tags if no tags defined', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        }
      };
      expect(new Spec(specs).withTags(['tag3', 'tag4']).records()).toEqual({
        ...specs,
        tags: [{ name: 'tag3' }, { name: 'tag4' }]
      });
    });
  });

  describe('test withOperationTags()', () => {
    it('should return the same input if no paths defined', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        }
      };
      expect(new Spec(specs).withOperationTags(['tag1']).records()).toEqual(specs);
    });

    it('should return the same input if no operation tags defined', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        },
        paths: {
          '/hello': {
            get: {
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
      expect(new Spec(specs).withOperationTags(['tag1']).records()).toEqual(specs);
    });
  });

  describe('test withOperationIdsAsTags', () => {
    it('should return the same input if no paths defined', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        }
      };
      expect(new Spec(specs).withOperationIdsAsTags().records()).toEqual(specs);
    });

    it('should return the same input if no operation tags defined', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        },
        paths: {
          '/hello': {
            get: {
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
      expect(new Spec(specs).withOperationIdsAsTags().records()).toEqual(specs);
    });

  })

  describe('test filterHeaders()', () => {
    it('should return the same input if no headers to remove are provided', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        },
        paths: {
          '/hello': {
            get: {
              summary: 'Say hello',
              parameters: [
                {
                  name: 'header1',
                  in: 'header'
                },
                {
                  name: 'header2',
                  in: 'header'
                },
                {
                  name: 'param1',
                  in: 'query'
                }
              ]
            }
          },
          '/hi': {
            get: {
              parameters: {
                $ref: '#/components/parameters/param1'
              }
            }
          }
        },
        components: {
          parameters: {
            param1: {
              name: 'param1',
              in: 'query'
            }
          }
        }
      };
      expect(new Spec(specs).filterHeaders([]).records()).toEqual(specs);
    });

    it('should return the same input if no paths defined', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        }
      };
      expect(new Spec(specs).filterHeaders(['header1']).records()).toEqual(specs);
    });

    it('should remove the given headers from the specs', () => {
      const specs = {
        openapi: '3.0.0',
        info: {
          title: 'Example API',
          version: '1.0.0'
        },
        paths: {
          '/hello': {
            get: {
              summary: 'Say hello',
              parameters: [
                {
                  name: 'header1',
                  in: 'header'
                },
                {
                  name: 'header2',
                  in: 'header'
                },
                {
                  name: 'param1',
                  in: 'query'
                }
              ]
            }
          },
          '/hi': {
            get: {
              parameters: {
                $ref: '#/components/parameters/Header1Parameter'
              }
            },
            post: {
              summary: 'Say hi',
              parameters: {
                $ref: '#/components/parameters/Header2Parameter'
              }
            },
            put: {
              parameters: {
                $ref: '#/components/parameters/QueryParameter'
              }
            },
            delete: {
              parameters: {
                $ref: '#/components/parameters/EmptyParameter'
              }
            },
            patch: {
              parameters: []
            },
            trace: {}
          }
        },
        components: {
          parameters: {
            Header1Parameter: {
              name: 'header1',
              in: 'header'
            },
            Header2Parameter: {
              name: 'header2',
              in: 'header'
            },
            QueryParameter: {
              name: 'param1',
              in: 'query'
            },
            EmptyParameter: {}
          },
          schemas: {
            MySchema: {
              type: 'object',
              properties: {
                property1: {
                  type: 'string'
                }
              }
            }
          }
        }
      };
      expect(new Spec(specs).filterHeaders(['header1']).records()).toEqual({
        ...specs,
        paths: {
          '/hello': {
            get: {
              summary: 'Say hello',
              parameters: [
                {
                  name: 'header2',
                  in: 'header'
                },
                {
                  name: 'param1',
                  in: 'query'
                }
              ]
            }
          },
          '/hi': {
            get: {
              parameters: {}
            },
            post: {
              summary: 'Say hi',
              parameters: {
                $ref: '#/components/parameters/Header2Parameter'
              }
            },
            put: {
              parameters: {
                $ref: '#/components/parameters/QueryParameter'
              }
            },
            delete: {
              parameters: {
                $ref: '#/components/parameters/EmptyParameter'
              }
            },
            patch: {
              parameters: []
            },
            trace: {}
          }
        }
      });
    });
  });

  describe('test withOneOf()', () => {
    it('should return the same input if no specs are provided', () => {
      expect(new Spec({}).withOneOf().records()).toEqual({});
    });

    it('should return the same input if no paths are provided', () => {
      const specs = {
        openapi: '3.0.0',
        components: {
          schemas: {
            MySchema: {
              type: 'object',
              properties: {
                property1: {
                  type: 'string'
                }
              }
            }
          }
        }
      };

      expect(new Spec(specs).withOneOf().records()).toEqual(specs);
    });

    it('should return the same input if no components are provided', () => {
      const specs = {
        openapi: '3.0.0',
        paths: {
          '/hello': {
            get: {
              summary: 'Say hello'
            }
          }
        }
      };

      expect(new Spec(specs).withOneOf().records()).toEqual(specs);
    });

    it('should return the same input if no schemas are provided', () => {
      const specs = {
        openapi: '3.0.0',
        paths: {
          '/hello': {
            get: {
              summary: 'Say hello'
            }
          }
        },
        components: {}
      };

      expect(new Spec(specs).withOneOf().records()).toEqual(specs);
    });
  });
});
