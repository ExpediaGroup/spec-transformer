"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.filter = exports.map = void 0;
/**
 * Maps the given record using the given transformer.
 *
 * @param record The record to map.
 * @param transformer The transformer to use.
 * @returns A new record with the transformed values.
 */
function map(record, transformer) {
    return Object.fromEntries(Object.entries(record).map(([k, v]) => transformer(k, v)));
}
exports.map = map;
/**
 * Filters the given record using the given predicate.
 *
 * @param record The record to filter.
 * @param predicate The predicate to use.
 * @returns A new record with the filtered values.
 */
function filter(record, predicate) {
    return Object.fromEntries(Object.entries(record).filter(([k, v]) => predicate(k, v)));
}
exports.filter = filter;
