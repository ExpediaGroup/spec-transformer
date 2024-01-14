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
exports.YamlReader = void 0;
const js_yaml_1 = require("js-yaml");
/**
 * A reader implementation for reading the specs in YAML format.
 */
class YamlReader {
    read(specs) {
        if (specs === undefined || specs === null || specs === '')
            return {};
        return (0, js_yaml_1.load)(specs);
    }
}
exports.YamlReader = YamlReader;
