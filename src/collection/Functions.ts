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

import { Key, Value } from '../model/Types';

/**
 * Maps the given record using the given transformer.
 *
 * @param record The record to map.
 * @param transformer The transformer to use.
 * @returns A new record with the transformed values.
 */
export function map(
  record: Record<Key, Value>,
  transformer: (k: Key, v: Value) => [k: Key, v: Value]
): Record<Key, Value> {
  return Object.fromEntries(Object.entries(record).map(([k, v]) => transformer(k, v)));
}

/**
 * Filters the given record using the given predicate.
 *
 * @param record The record to filter.
 * @param predicate The predicate to use.
 * @returns A new record with the filtered values.
 */
export function filter(record: Record<Key, Value>, predicate: (k: Key, v: Value) => boolean): Record<Key, Value> {
  return Object.fromEntries(Object.entries(record).filter(([k, v]) => predicate(k, v)));
}
