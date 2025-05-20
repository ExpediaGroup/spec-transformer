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

import Transformer from './Transformer';
import { Key, Value } from '../model/Types';

import * as converter from 'openapi-to-postmanv2';
import { Input, Options } from 'openapi-to-postmanv2';

/**
 * A transformer implementation for transforming the specs in OpenAPI format to Postman format.
 */
export class PostmanTransformer implements Transformer {
  transform(specs: Record<Key, Value>): Record<Key, Value> {
    // @ts-ignore
    const input: Input = { type: 'json', data: specs };

    const options: Options = {
      folderStrategy: 'Tags',
      requestParametersResolution: 'Schema',
      exampleParametersResolution: 'Example',
      optimizeConversion: false,
      stackLimit: 50,
    };

    let result: Record<Key, Value> = {};
    converter.convert(input, options, (err: unknown, conversionResult: Record<Key, Value>) => {
      if (err || !conversionResult || !conversionResult.result) {
        console.warn('Error transforming to Postman collection', {
          error: err,
          reason: conversionResult?.reason ?? 'No conversion result',
        });
        return;
      }
      result = conversionResult.output[0].data;
    });

    return result;
  }
}
