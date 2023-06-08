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

import { EndpointTransformer } from '../../index';

describe('test EndpointTransformer', () => {
  const specs = {
    openapi: '3.0.0',
    paths: {
      '/operation1': {
        get: {
          tags: ['operation1'],
          summary: 'Get operation1'
        }
      },
      '/operation2': {
        post: {
          tags: ['operation2'],
          summary: 'Post operation2'
        }
      }
    }
  };

  const expectedSpecs = {
    ...specs,
    paths: {
      '/productX/operation1': {
        get: {
          tags: ['operation1'],
          summary: 'Get operation1'
        }
      },
      '/productX/operation2': {
        post: {
          tags: ['operation2'],
          summary: 'Post operation2'
        }
      }
    }
  };

  it('should prepend the endpoints with the product key with a prefix slash', () => {
    expect(new EndpointTransformer('/productX').transform(specs)).toEqual(expectedSpecs);
  });

  it('should prepend the endpoints with the product key without a prefix slash', () => {
    expect(new EndpointTransformer('/productX').transform(specs)).toEqual(expectedSpecs);
  });

  it('should extract the prefix from the server url if no product key is provided', () => {
    const specsWithServerUrl = {
      ...specs,
      servers: [
        {
          url: 'https://api.example.com/productX'
        }
      ]
    };

    const expectedSpecsWithServerUrl = {
      ...expectedSpecs,
      servers: [
        {
          url: 'https://api.example.com/productX'
        }
      ]
    }

    expect(new EndpointTransformer().transform(specsWithServerUrl)).toEqual(expectedSpecsWithServerUrl);
  });
});
