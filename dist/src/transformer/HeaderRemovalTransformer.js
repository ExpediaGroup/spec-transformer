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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeaderRemovalTransformer = exports.COMMON_UNWANTED_HEADERS = void 0;
const Spec_1 = __importDefault(require("../model/Spec"));
exports.COMMON_UNWANTED_HEADERS = [
    'accept',
    'accept-encoding',
    'user-agent',
    'authorization',
    'content-type',
];
/**
 * Removes unwanted headers from the spec.
 */
class HeaderRemovalTransformer {
    constructor(unwantedHeaders) {
        this.unwantedHeaders = unwantedHeaders.map((header) => header.toLowerCase());
    }
    transform(specs) {
        return new Spec_1.default(specs).filterHeaders(this.unwantedHeaders).records();
    }
}
exports.HeaderRemovalTransformer = HeaderRemovalTransformer;