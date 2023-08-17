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
import Spec from '../model/Spec';

export const COMMON_UNWANTED_HEADERS: string[] = [
  'accept',
  'accept-encoding',
  'user-agent',
  'authorization',
  'content-type'
];

/**
 * Removes unwanted headers from the spec.
 */
export class HeaderRemovalTransformer implements Transformer {
  unwantedHeaders: string[];

  constructor(unwantedHeaders: string[]) {
    this.unwantedHeaders = unwantedHeaders.map((header) => header.toLowerCase());
  }

  transform(specs: Record<Key, Value>): Record<Key, Value> {
    return new Spec(specs).filterHeaders(this.unwantedHeaders).records();
  }
}
