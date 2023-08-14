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

import { OneOfSettingTransformer } from '../../index';

describe(' test OneOfSettingTransformer', () => {
  const openapi = { openapi: '3.0.0' };
  const info = {
    info: {
      title: 'Test',
      version: '1.0.0'
    }
  };
  const components = {
    components: {
      schemas: {
        PaymentMethod: {
          title: 'PaymentMethod',
          properties: {
            id: {
              type: 'string'
            }
          },
          discriminator: {
            propertyName: 'type',
            mapping: {
              CREDIT_CARD: 'CreditCard',
              PAYPAL: 'PayPal'
            }
          }
        },
        CreditCard: {
          title: 'CreditCard',
          discriminator: {
            propertyName: 'type',
            mapping: {
              VISA: 'Visa',
              MASTERCARD: 'Mastercard'
            }
          },
          allOf: [
            {
              $ref: '#/components/schemas/PaymentMethod'
            },
            {
              properties: {
                type: {
                  enum: ['CREDIT_CARD']
                }
              }
            }]
        },
        PayPal: {
          title: 'PayPal',
          allOf: [
            {
              $ref: '#/components/schemas/PaymentMethod'
            },
            {
              properties: {
                type: {
                  enum: ['PAYPAL']
                }
              }
            }
          ]
        },
        Visa: {
          title: 'Visa',
          allOf: [
            {
              $ref: '#/components/schemas/CreditCard'
            },
            {
              discriminator: {
                propertyName: 'type',
                mapping: {
                  DEBIT: 'Debit',
                  CREDIT: 'Credit'
                }
              },
              properties: {
                type: {
                  enum: ['VISA']
                }
              }
            }
          ]
        },
        Debit: {
          title: 'Debit',
          allOf: [
            {
              $ref: '#/components/schemas/Visa'
            },
            {
              properties: {
                type: {
                  enum: ['DEBIT']
                }
              }
            }]
        },
        Credit: {
          title: 'Credit',
          allOf: [
            {
              $ref: '#/components/schemas/Visa'
            },
            {
              properties: {
                type: {
                  enum: ['CREDIT']
                }
              }
            }
          ]
        },
        Mastercard: {
          title: 'Mastercard',
          allOf: [
            {
              $ref: '#/components/schemas/CreditCard'
            },
            {
              properties: {
                type: {
                  enum: ['MASTERCARD']
                }
              }
            }
          ]
        },
        SomeCreditCard: {
          title: 'SomeCreditCard',
          allOf: [
            {
              $ref: '#/components/schemas/CreditCard'
            },
            {
              properties: {
                name: {
                  type: 'string'
                }
              }
            }
          ]
        },
        Dummy: {
          title: 'Dummy',
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['DUMMY']
            }
          }
        }
      }
    }
  };


  it('should add oneOf to requestBody', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/PaymentMethod'
                  }
                }
              }
            }
          }
        },
        '/another/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/PaymentMethod'
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    const transformedSpecs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    oneOf: [
                      {
                        $ref: '#/components/schemas/PayPal'
                      },
                      {
                        $ref: '#/components/schemas/Mastercard'
                      },
                      {
                        $ref: '#/components/schemas/Debit'
                      },
                      {
                        $ref: '#/components/schemas/Credit'
                      }
                    ]
                  }
                }
              }
            }
          }
        },
        '/another/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      oneOf: [
                        {
                          $ref: '#/components/schemas/PayPal'
                        },
                        {
                          $ref: '#/components/schemas/Mastercard'
                        },
                        {
                          $ref: '#/components/schemas/Debit'
                        },
                        {
                          $ref: '#/components/schemas/Credit'
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(transformedSpecs);
  });

  it('should return requestBody with no ref as is', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['DUMMY']
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(specs);
  });

  it('should return requestBody with ref that has no children as is', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Dummy'
                  }
                }
              }
            }
          }
        },
        '/another/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Dummy'
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(specs);
  });

  it('should add OneOf to responses', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/PaymentMethod'
                    }
                  }
                }
              },
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Mastercard'
                    }
                  }
                }
              },
              '404': {
                description: 'Not Found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/PaymentMethod'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    const transformedSpecs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            responses: {
              200: {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      oneOf: [
                        {
                          $ref: '#/components/schemas/PayPal'
                        },
                        {
                          $ref: '#/components/schemas/Mastercard'
                        },
                        {
                          $ref: '#/components/schemas/Debit'
                        },
                        {
                          $ref: '#/components/schemas/Credit'
                        }
                      ]
                    }
                  }
                }
              },
              201: {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Mastercard'
                    }
                  }
                }
              },
              404: {
                description: 'Not Found',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        oneOf: [
                          {
                            $ref: '#/components/schemas/PayPal'
                          },
                          {
                            $ref: '#/components/schemas/Mastercard'
                          },
                          {
                            $ref: '#/components/schemas/Debit'
                          },
                          {
                            $ref: '#/components/schemas/Credit'
                          }
                        ]
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };


    expect(new OneOfSettingTransformer().transform(specs)).toEqual(transformedSpecs);
  });

  it('should return responses with no refs with no changes', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        type: {
                          type: 'string',
                          enum: ['DUMMY']
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(specs);
  });

  it('should return responses with refs that has no children with no changes', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            responses: {
              '200': {
                description: 'OK',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/Dummy'
                    }
                  }
                }
              },
              '201': {
                description: 'Created',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: {
                        $ref: '#/components/schemas/Dummy'
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      ...components
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(specs);
  });

  it('should add oneOf to schemas', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Dummy'
                  }
                }
              }
            }
          }
        }
      },
      components: {
        ...components.components,
        schemas: {
          ...components.components.schemas,
          Transaction: {
            title: 'Transaction',
            properties: {
              id: {
                type: 'string'
              },
              paymentMethod: {
                $ref: '#/components/schemas/PaymentMethod'
              },
              paymentMethods: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/PaymentMethod'
                }
              }
            }
          }
        }
      }
    };

    const transformedSpecs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Dummy'
                  }
                }
              }
            }
          }
        }
      },
      components: {
        ...components.components,
        schemas: {
          ...components.components.schemas,
          Transaction: {
            title: 'Transaction',
            properties: {
              id: {
                type: 'string'
              },
              paymentMethod: {
                'oneOf': [
                  {
                    '$ref': '#/components/schemas/PayPal'
                  },
                  {
                    '$ref': '#/components/schemas/Mastercard'
                  },
                  {
                    '$ref': '#/components/schemas/Debit'
                  },
                  {
                    '$ref': '#/components/schemas/Credit'
                  }
                ]
              },
              paymentMethods: {
                type: 'array',
                items: {
                  'oneOf': [
                    {
                      '$ref': '#/components/schemas/PayPal'
                    },
                    {
                      '$ref': '#/components/schemas/Mastercard'
                    },
                    {
                      '$ref': '#/components/schemas/Debit'
                    },
                    {
                      '$ref': '#/components/schemas/Credit'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(transformedSpecs);
  });

  it('should return schemas with no children with no changes', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Transaction'
                  }
                }
              }
            }
          }
        }
      },
      components: {
        ...components.components,
        schemas: {
          ...components.components.schemas,
          Transaction: {
            title: 'Transaction',
            properties: {
              id: {
                type: 'string'
              },
              paymentMethod: {
                $ref: '#/components/schemas/Dummy'
              },
              dummies: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Dummy'
                }
              }
            }
          }
        }
      }
    };

    const transformedSpecs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Transaction'
                  }
                }
              }
            }
          }
        }
      },
      components: {
        ...components.components,
        schemas: {
          ...components.components.schemas,
          Transaction: {
            title: 'Transaction',
            properties: {
              id: {
                type: 'string'
              },
              paymentMethod: {
                $ref: '#/components/schemas/Dummy'
              },
              dummies: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/Dummy'
                }
              }
            }
          }
        }
      }
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(transformedSpecs);
  });

  it('should not affect any other parts of the specs', () => {
    const specs = {
      ...openapi,
      ...info,
      paths: {
        '/test': {
          post: {
            operationId: 'test-post'
          }
        }
      },
      ...components
    };

    expect(new OneOfSettingTransformer().transform(specs)).toEqual(specs);
  });
});
