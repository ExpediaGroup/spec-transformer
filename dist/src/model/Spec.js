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
const Constants_1 = require("../Constants");
const Functions_1 = require("../collection/Functions");
/**
 * A representation of API Specifications.
 */
class Spec {
    constructor(specs) {
        this.withOneOf = () => {
            var _a;
            if (!this.specs.paths || !((_a = this.specs.components) === null || _a === void 0 ? void 0 : _a.schemas))
                return this;
            const mappings = this.getComponentMappings();
            const setOperationFieldValue = (operationFields, operationField, operationFieldValue) => {
                if (operationField === Constants_1.REQUEST_BODY) {
                    return this.buildOneOfRequest(operationFields, operationFieldValue, mappings);
                }
                if (operationField === Constants_1.RESPONSES) {
                    return this.buildOneOfResponse(operationFields, operationFieldValue, mappings);
                }
                return operationFieldValue;
            };
            return new Spec(Object.assign(Object.assign({}, this.specs), { paths: Object.assign({}, (0, Functions_1.map)(this.specs.paths, (path, operations) => [
                    path,
                    (0, Functions_1.map)(operations, (operation, operationFields) => [
                        operation,
                        (0, Functions_1.map)(operationFields, (operationField, operationFieldValue) => {
                            return [
                                operationField,
                                setOperationFieldValue(operationFields, operationField, operationFieldValue)
                            ];
                        })
                    ])
                ])), components: Object.assign(Object.assign({}, this.specs.components), { schemas: Object.assign({}, (0, Functions_1.map)(this.specs.components.schemas, (schema, schemaFields) => [
                        schema,
                        (0, Functions_1.map)(schemaFields, (schemaField, schemaFieldValue) => [
                            schemaField,
                            schemaField === Constants_1.PROPERTIES ? this.buildOneOfProperty(schemaFieldValue, mappings) : schemaFieldValue
                        ])
                    ])) }) }));
        };
        this.buildOneOfList = (children) => {
            return children.map((child) => ({ $ref: '#/components/schemas/' + child }));
        };
        this.getComponentMappings = () => {
            const children = new Map();
            const allOfComponents = (0, Functions_1.filter)(this.specs.components.schemas, (schema, schemaFields) => schemaFields.allOf);
            this.buildParentChildrenMappings(allOfComponents, children);
            this.mapToLeaves(children);
            return children;
        };
        this.isDefinedInParent = (child, parent) => {
            const extractComponentName = (ref) => ref.slice(ref.lastIndexOf('/') + 1);
            const discriminatorMappings = this.getDiscriminatorMappings(parent);
            return !!discriminatorMappings.map((item) => extractComponentName(item))
                .find((value) => value === child);
        };
        this.getDiscriminatorMappings = (componentName) => {
            var _a;
            const schema = this.specs.components.schemas[componentName];
            let mappings = [];
            const discriminatorMapping = (_a = schema.discriminator) === null || _a === void 0 ? void 0 : _a.mapping;
            if (discriminatorMapping) {
                mappings = mappings.concat(Object.values(discriminatorMapping));
            }
            else if (schema.allOf) {
                mappings = mappings.concat(schema.allOf.filter((item) => { var _a; return (_a = item.discriminator) === null || _a === void 0 ? void 0 : _a.mapping; }).map((item) => Object.values(item.discriminator.mapping)).flat());
            }
            return mappings;
        };
        this.getRefComponentName = (item) => item.$ref.slice(item.$ref.lastIndexOf('/') + 1);
        this.mapToLeaves = (children) => {
            let childReplaced = false;
            children.forEach((members, parent) => {
                /* istanbul ignore next */
                members.forEach(member => {
                    var _a, _b, _c;
                    if (!children.has(member) || ((_a = (children.get(member) || [])) === null || _a === void 0 ? void 0 : _a.length) === 0) {
                        return;
                    }
                    children.set(parent, ((_b = children.get(parent)) === null || _b === void 0 ? void 0 : _b.filter((item) => item !== member)) || []);
                    (_c = children.get(parent)) === null || _c === void 0 ? void 0 : _c.push(...children.get(member) || []);
                    childReplaced = true;
                });
            });
            if (childReplaced)
                this.mapToLeaves(children);
        };
        this.filterHeaderValues = (key, value, headersToRemove) => {
            return this.isRef(value)
                ? this.filterHeaderComponents(value, headersToRemove)
                : this.filterHeaderParameters(value, headersToRemove);
        };
        this.isRef = (value) => value && value.hasOwnProperty('$ref');
        this.containsItems = (value) => value && value.hasOwnProperty('items');
        this.filterHeaderParameters = (parameters, headersToRemove) => {
            return parameters.filter((parameter) => parameter.in !== Constants_1.HEADER || !this.includesIgnoreCase(headersToRemove, parameter.name));
        };
        /* istanbul ignore next */
        this.filterHeaderComponents = (component, headersToRemove) => {
            var _a;
            const parts = component['$ref'].match(/#\/components\/(.*)\/(.*)/);
            const parameter = (_a = this.specs.components[parts === null || parts === void 0 ? void 0 : parts[1]][parts === null || parts === void 0 ? void 0 : parts[2]]) !== null && _a !== void 0 ? _a : {};
            return (parameter === null || parameter === void 0 ? void 0 : parameter.in) === Constants_1.HEADER && this.includesIgnoreCase(headersToRemove, parameter.name) ? {} : component;
        };
        this.mapTags = (tags) => tags.map((tag) => ({ name: tag }));
        this.prependSlash = (path) => path.startsWith('/') ? path : '/' + path;
        this.extractPrefix = (servers) => {
            const server = servers[0];
            return new URL(server.url).pathname;
        };
        this.includesIgnoreCase = (strings, goal) => {
            return strings.includes(goal.toLowerCase());
        };
        this.specs = specs;
    }
    /**
     * Returns the specs as a record.
     */
    records() {
        return this.specs;
    }
    withUpdatedEndpoints(prefix) {
        if (!this.specs.paths)
            return new Spec(this.specs);
        if (!prefix && this.specs.servers) {
            prefix = this.extractPrefix(this.specs.servers);
        }
        if (!prefix)
            return new Spec(this.specs);
        return new Spec(Object.assign(Object.assign({}, this.specs), { paths: Object.assign({}, (0, Functions_1.map)(this.specs.paths, (path, operations) => [`${this.prependSlash(prefix)}${path}`, operations])) }));
    }
    /**
     * Returns the specs with the given tags.
     * @param tags to add to the spec.
     * @returns A copy of the `Spec` object with the given tags.
     */
    withTags(tags) {
        return new Spec(Object.assign(Object.assign({}, this.specs), { tags: this.mapTags(tags) }));
    }
    /**
     * Returns the specs with the given operation tags.
     * @param tags to add to the operations.
     * @returns A copy of the `Spec` object with the given operation tags.
     */
    withOperationTags(tags) {
        if (!this.specs.paths)
            return new Spec(this.specs);
        return new Spec(Object.assign(Object.assign({}, this.specs), { paths: Object.assign({}, (0, Functions_1.map)(this.specs.paths, (path, operations) => [
                path,
                (0, Functions_1.map)(operations, (operation, operationFields) => [
                    operation,
                    (0, Functions_1.map)(operationFields, (operationField, operationFieldValue) => [
                        operationField,
                        operationField === Constants_1.TAGS ? tags : operationFieldValue
                    ])
                ])
            ])) }));
    }
    /**
     * @returns A copy of the `Spec` object with the given headers removed.
     * @param headersToRemove
     */
    filterHeaders(headersToRemove) {
        if (!this.specs.paths)
            return new Spec(this.specs);
        return new Spec(Object.assign(Object.assign({}, this.specs), { paths: Object.assign({}, (0, Functions_1.map)(this.specs.paths, (path, operations) => [
                path,
                (0, Functions_1.map)(operations, (operation, operationFields) => [
                    operation,
                    (0, Functions_1.map)(operationFields, (operationField, operationFieldValue) => [
                        operationField,
                        operationField === Constants_1.PARAMETERS
                            ? this.filterHeaderValues(operationField, operationFieldValue, headersToRemove)
                            : operationFieldValue
                    ])
                ])
            ])) }));
    }
    buildOneOfRequest(operationFields, operationFieldValue, mappings) {
        const isDirectRef = this.isRef(operationFieldValue);
        const schemaValue = isDirectRef ? operationFieldValue : operationFieldValue.content['application/json'].schema;
        let schema;
        if (this.isRef(schemaValue)) {
            schema = this.buildOneOfSchema(schemaValue, mappings);
        }
        else if (this.containsItems(schemaValue)) {
            schema = Object.assign(Object.assign({}, schemaValue), { items: this.buildOneOfSchema(schemaValue.items, mappings) });
        }
        else
            return operationFieldValue;
        return Object.assign(Object.assign({}, operationFieldValue), { content: Object.assign(Object.assign({}, operationFieldValue.content), { 'application/json': Object.assign(Object.assign({}, operationFields.requestBody.content['application/json']), { schema: schema }) }) });
    }
    buildOneOfResponse(operationFields, operationFieldValue, mappings) {
        return (0, Functions_1.map)(operationFieldValue, (response, responseFields) => {
            const isDirectRef = this.isRef(responseFields);
            /* istanbul ignore next */
            if (!isDirectRef && (!(responseFields === null || responseFields === void 0 ? void 0 : responseFields.content) || !responseFields.content['application/json']))
                return [response, responseFields];
            const schemaValue = isDirectRef ? responseFields : responseFields.content['application/json'].schema;
            let schema;
            if (this.isRef(schemaValue)) {
                schema = this.buildOneOfSchema(schemaValue, mappings);
            }
            else if (this.containsItems(schemaValue)) {
                schema = Object.assign(Object.assign({}, schemaValue), { items: this.buildOneOfSchema(schemaValue.items, mappings) });
            }
            else
                return [response, responseFields];
            return [response, Object.assign(Object.assign({}, responseFields), { content: Object.assign(Object.assign({}, responseFields.content), { 'application/json': Object.assign(Object.assign({}, responseFields.content['application/json']), { schema: schema }) }) })];
        });
    }
    buildOneOfSchema(schemaValue, mappings) {
        const name = this.getRefComponentName(schemaValue);
        const hasChildren = mappings.has(name);
        if (!hasChildren)
            return schemaValue;
        return {
            oneOf: this.buildOneOfList(mappings.get(name))
        };
    }
    buildOneOfProperty(properties, mappings) {
        const updateProperty = (value) => {
            if (!this.isRef(value))
                return this.containsItems(value) ? this.buildOneOfProperty(value, mappings) : value;
            const name = this.getRefComponentName(value);
            const hasChildren = mappings.has(name);
            return hasChildren ? {
                oneOf: this.buildOneOfList(mappings.get(name))
            } : value;
        };
        return (0, Functions_1.map)(properties, (key, value) => [key, updateProperty(value)]);
    }
    buildParentChildrenMappings(allOfComponents, children) {
        for (const cmp in allOfComponents) {
            const refs = allOfComponents[cmp].allOf.filter((item) => item.$ref).map((item) => this.getRefComponentName(item));
            refs.forEach((ref) => {
                if (!this.isDefinedInParent(cmp, ref))
                    return;
                /* istanbul ignore next */
                children.has(ref) ? children.set(ref, [...(children.get(ref) || []), cmp]) : children.set(ref, [cmp]);
            });
        }
    }
}
exports.default = Spec;
