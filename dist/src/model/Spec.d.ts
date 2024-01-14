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
import { Key, Value } from './Types';
/**
 * A representation of API Specifications.
 */
export default class Spec {
    private readonly specs;
    constructor(specs: Record<Key, Value>);
    /**
     * Returns the specs as a record.
     */
    records(): Record<Key, Value>;
    withUpdatedEndpoints(prefix?: string): Spec;
    /**
     * Returns the specs with the given tags.
     * @param tags to add to the spec.
     * @returns A copy of the `Spec` object with the given tags.
     */
    withTags(tags: string[]): Spec;
    /**
     * Returns the specs with the given operation tags.
     * @param tags to add to the operations.
     * @returns A copy of the `Spec` object with the given operation tags.
     */
    withOperationTags(tags: string[]): Spec;
    /**
     * @returns A copy of the `Spec` object with the given headers removed.
     * @param headersToRemove
     */
    filterHeaders(headersToRemove: string[]): Spec;
    withOneOf: () => Spec;
    private buildOneOfRequest;
    private buildOneOfResponse;
    private buildOneOfSchema;
    private buildOneOfProperty;
    private buildOneOfList;
    private getComponentMappings;
    private buildParentChildrenMappings;
    private isDefinedInParent;
    private getDiscriminatorMappings;
    private getRefComponentName;
    private mapToLeaves;
    private filterHeaderValues;
    private isRef;
    private containsItems;
    private filterHeaderParameters;
    private filterHeaderComponents;
    private mapTags;
    private prependSlash;
    private extractPrefix;
    private includesIgnoreCase;
}
