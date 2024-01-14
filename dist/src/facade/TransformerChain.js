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
exports.TransformerChain = void 0;
/**
 * A shortcut for transforming OpenAPI specs in text format, using a reader, a writer and a list of transformers.
 *
 * @param reader Reader to use for reading the specs.
 * @param writer Writer to use for writing the specs.
 * @param transformers Transformers to use for transforming the specs.
 */
class TransformerChain {
    constructor(transformers) {
        this.transformers = transformers;
    }
    /**
     * Transforms the specs using the reader, the writer and the list of transformers.
     *
     * @param specs The specs to transform.
     * @param reader The reader to use for reading the specs.
     * @param writer The writer to use for writing the specs.
     */
    transform(specs, reader, writer) {
        return writer.write(this.transformers.reduce((acc, transformer) => transformer.transform(acc), reader.read(specs)));
    }
    /**
     * Transforms the specs using the list of transformers.
     *
     * @param specs The specs to transform as a Record.
     */
    transformRecord(specs) {
        return this.transformers.reduce((acc, transformer) => transformer.transform(acc), specs);
    }
}
exports.TransformerChain = TransformerChain;
