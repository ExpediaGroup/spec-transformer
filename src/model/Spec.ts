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

import { Key, Ref, Value } from './Types';
import { HEADER, PARAMETERS, PROPERTIES, REQUEST_BODY, RESPONSES, TAGS } from '../Constants';
import { ServerObject, TagObject } from 'openapi3-ts';
import { filter, map } from '../collection/Functions';

/**
 * A representation of API Specifications.
 */
export default class Spec {
  private readonly specs: Record<Key, Value>;

  constructor(specs: Record<Key, Value>) {
    this.specs = specs;
  }

  /**
   * Returns the specs as a record.
   */
  records(): Record<Key, Value> {
    return this.specs;
  }

  withUpdatedEndpoints(prefix?: string): Spec {
    if (!this.specs.paths) return new Spec(this.specs);

    if (!prefix && this.specs.servers) {
      prefix = this.extractPrefix(this.specs.servers);
    }

    if (!prefix) return new Spec(this.specs);

    return new Spec({
      ...this.specs,
      paths: {
        ...map(this.specs.paths, (path, operations) => [`${this.prependSlash(prefix!)}${path}`, operations])
      }
    });
  }

  /**
   * Returns the specs with the given tags.
   * @param tags the tags to add to the spec.
   * @returns A copy of the `Spec` object with the given tags.
   */
  withTags(tags: string[]): Spec {
    return new Spec({
      ...this.specs,
      tags: this.mapTags(tags)
    });
  }

  /**
   * Returns the specs with the given operation tags.
   * @param tags the tags to add to the operations.
   * @returns A copy of the `Spec` object with the given operation tags.
   */
  withOperationTags(tags: string[]): Spec {
    if (!this.specs.paths) return new Spec(this.specs);

    return new Spec({
      ...this.specs,
      paths: {
        ...map(this.specs.paths, (path, operations) => [
          path,
          map(operations, (operation, operationFields) => [
            operation,
            map(operationFields, (operationField, operationFieldValue) => [
              operationField,
              operationField === TAGS ? tags : operationFieldValue
            ])
          ])
        ])
      }
    });
  }

  /**
   * Returns the specs with the given headers removed.
   * @param headersToRemove the headers to remove.
   * @returns A copy of the `Spec` object with the given headers removed.
   */
  filterHeaders(headersToRemove: string[]): Spec {
    if (!this.specs.paths) return new Spec(this.specs);

    return new Spec({
      ...this.specs,
      paths: {
        ...map(this.specs.paths, (path, operations) => [
          path,
          map(operations, (operation, operationFields) => [
            operation,
            map(operationFields, (operationField, operationFieldValue) => [
              operationField,
              operationField === PARAMETERS
                ? this.filterHeaderValues(operationFieldValue, headersToRemove)
                : operationFieldValue
            ])
          ])
        ])
      }
    });
  }

  withOneOf = (): Spec => {
    if (!this.specs.paths || !this.specs.components?.schemas) return this;

    const mappings = this.getComponentMappings();

    const setOperationFieldValue = (operationFields: Value, operationField: Key, operationFieldValue: Value) => {
      if (operationField === REQUEST_BODY) {
        return this.buildOneOfRequest(operationFields, operationFieldValue, mappings);
      }

      if (operationField === RESPONSES) {
        return this.buildOneOfResponse(operationFieldValue, mappings);
      }

      return operationFieldValue;
    };

    return new Spec({
      ...this.specs,
      paths: {
        ...map(this.specs.paths, (path, operations) => [
          path,
          map(operations, (operation, operationFields) => [
            operation,
            map(operationFields, (operationField, operationFieldValue) => {
              return [
                operationField,
                setOperationFieldValue(operationFields, operationField, operationFieldValue)
              ];
            })
          ])
        ])
      },
      components: {
        ...this.specs.components,
        schemas: {
          ...map(this.specs.components.schemas, (schema, schemaFields) => [
            schema,
            map(schemaFields, (schemaField, schemaFieldValue) => [
              schemaField,
              schemaField === PROPERTIES ? this.buildOneOfProperty(schemaFieldValue, mappings) : schemaFieldValue
            ])
          ])
        }
      }
    });
  };

  private buildOneOfRequest(operationFields: Value, operationFieldValue: Value, mappings: Record<Key, Value>): Record<Key, Value> {
    const isDirectRef = this.isRef(operationFieldValue);
    const schemaValue = isDirectRef ? operationFieldValue : operationFieldValue.content['application/json'].schema;

    let schema;
    if (this.isRef(schemaValue)) {
      schema = this.buildOneOfSchema(schemaValue, mappings)
    } else if (this.containsItems(schemaValue)) {
      schema = {
        ...schemaValue,
        items: this.buildOneOfSchema(schemaValue.items, mappings)
      }
    } else return operationFieldValue;

    return {
      ...operationFieldValue,
      content: {
        ...operationFieldValue.content,
        'application/json': {
          ...operationFields.requestBody.content['application/json'],
          schema: schema
        }
      }
    };
  }

  private buildOneOfResponse(operationFieldValue: Value, mappings: Record<Key, Value>): Record<Key, Value> {
    return map(operationFieldValue, (response, responseFields) => {
      const isDirectRef = this.isRef(responseFields);

      /* istanbul ignore next */
      if (!isDirectRef && (!responseFields?.content || !responseFields.content['application/json'])) return [response, responseFields];

      const schemaValue = isDirectRef ? responseFields : responseFields.content['application/json'].schema;

      let schema;
      if (this.isRef(schemaValue)) {
        schema = this.buildOneOfSchema(schemaValue, mappings)
      } else if (this.containsItems(schemaValue)) {
        schema = {
          ...schemaValue,
          items: this.buildOneOfSchema(schemaValue.items, mappings)
        }
      } else return [response, responseFields];

      return [response, {
        ...responseFields,
        content: {
          ...responseFields.content,
          'application/json': {
            ...responseFields.content['application/json'],
            schema: schema
          }
        }
      }];
    });
  }

  private buildOneOfSchema(schemaValue: Value, mappings: Record<Key, Value>): Record<Key, Value> {
    const name = this.getRefComponentName(schemaValue);
    const hasChildren = mappings.has(name);

    if (!hasChildren) return schemaValue;

    return {
      oneOf: this.buildOneOfList(mappings.get(name))
    }
  }

  private buildOneOfProperty(properties: Value, mappings: Record<Key, Value>): Record<Key, Value> {
    const updateProperty = (value: Value) => {
      if (!this.isRef(value)) return this.containsItems(value) ? this.buildOneOfProperty(value, mappings) : value;

      const name = this.getRefComponentName(value);
      const hasChildren = mappings.has(name);
      return hasChildren ? {
        oneOf: this.buildOneOfList(mappings.get(name))
      } : value;
    };

    return map(properties, (key: Key, value: Value) => [key, updateProperty(value)]);
  }


  private buildOneOfList = (children: string[]): Ref[] => {
    return children.map((child: string) => ({ $ref: '#/components/schemas/' + child }));
  };

  private getComponentMappings = (): Record<Key, Value> => {
    const children: Map<string, string[]> = new Map();
    const allOfComponents: Record<Key, Value> = filter(this.specs.components.schemas, (_, schemaFields) => schemaFields.allOf);

    this.buildParentChildrenMappings(allOfComponents, children);
    this.mapToLeaves(children);

    return children;
  };

  private buildParentChildrenMappings(allOfComponents: Record<Key, Value>, children: Map<string, string[]>) {
    for (const cmp in allOfComponents) {
      const refs = allOfComponents[cmp].allOf.filter((item: any) => item.$ref).map((item: any) => this.getRefComponentName(item));
      refs.forEach((ref: string) => {
        if (!this.isDefinedInParent(cmp, ref)) return;
        /* istanbul ignore next */
        children.has(ref) ? children.set(ref, [...(children.get(ref) || []), cmp]) : children.set(ref, [cmp]);
      });
    }
  }

  private isDefinedInParent = (child: string, parent: string): boolean => {
    const extractComponentName = (ref: string): string => ref.slice(ref.lastIndexOf('/') + 1)

    const discriminatorMappings: string[] = this.getDiscriminatorMappings(parent);
    return !!discriminatorMappings.map((item: string) => extractComponentName(item))
      .find((value: string): boolean => value === child);
  }

  private getDiscriminatorMappings = (componentName: string): string[] => {
    const schema = this.specs.components.schemas[componentName];
    let mappings: string[] = [];
    const discriminatorMapping = schema.discriminator?.mapping;
    if (discriminatorMapping) {
      mappings = mappings.concat(Object.values(discriminatorMapping));
    } else if (schema.allOf) {
      mappings = mappings.concat(
        schema.allOf.filter(
          (item: Value) => item.discriminator?.mapping
        ).map(
          (item: Value) => Object.values(item.discriminator.mapping)
        ).flat()
      );
    }
    return mappings;
  }

  private getRefComponentName = (item: any) => item.$ref.slice(item.$ref.lastIndexOf('/') + 1);

  private mapToLeaves = (children: Map<string, string[]>) => {
    let childReplaced = false;

    children.forEach((members, parent) => {
      /* istanbul ignore next */
      members.forEach(member => {
        if (!children.has(member) || (children.get(member) || [])?.length === 0) {
          return;
        }

        children.set(parent, children.get(parent)?.filter((item) => item !== member) || []);
        children.get(parent)?.push(...children.get(member) || []);
        childReplaced = true;
      });
    });

    if (childReplaced) this.mapToLeaves(children);
  };

  private filterHeaderValues = (value: Value, headersToRemove: string[]) => {
    return this.isRef(value)
      ? this.filterHeaderComponents(value, headersToRemove)
      : this.filterHeaderParameters(value, headersToRemove);
  };

  private isRef = (value: Value): boolean => value && value.hasOwnProperty('$ref');

  private containsItems = (value: Value): boolean => value && value.hasOwnProperty('items');

  private filterHeaderParameters = (parameters: Value, headersToRemove: string[]) => {
    return parameters.filter(
      (parameter: Record<Key, Value>) => parameter.in !== HEADER || !this.includesIgnoreCase(headersToRemove, parameter.name)
    );
  };

  /* istanbul ignore next */
  private filterHeaderComponents = (component: Value, headersToRemove: string[]) => {
    const parts = component['$ref'].match(/#\/components\/(.*)\/(.*)/);
    const parameter = this.specs.components[parts?.[1]][parts?.[2]] ?? {};
    return parameter?.in === HEADER && this.includesIgnoreCase(headersToRemove, parameter.name) ? {} : component;
  };

  private mapTags = (tags: string[]): TagObject[] => tags.map((tag) => ({ name: tag }));

  private prependSlash = (path: string): string => path.startsWith('/') ? path : '/' + path;

  private extractPrefix = (servers: ServerObject[]): string => {
    const server = servers[0];
    return new URL(server.url).pathname;
  };

  private includesIgnoreCase = (strings: string[], goal: string): boolean => {
    return strings.includes(goal.toLowerCase());
  };
}
