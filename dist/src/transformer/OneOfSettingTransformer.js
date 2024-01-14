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
exports.OneOfSettingTransformer = void 0;
const Spec_1 = __importDefault(require("../model/Spec"));
/**
 * Adds oneOf to the spec, where a schema component with children is referenced.
 */
class OneOfSettingTransformer {
    transform(specs) {
        return new Spec_1.default(specs).withOneOf().records();
    }
}
exports.OneOfSettingTransformer = OneOfSettingTransformer;