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

import Writer from './Writer';
import { Key, Value } from '../../model/Types';
import { stringify } from 'yaml';
import type { Scalar } from 'yaml';

/**
 * A writer implementation for writing the specs in YAML format.
 */
export class YamlWriter implements Writer {
  defaultStringType: Scalar.Type;

  constructor(props: { defaultStringType: Scalar.Type } = {
    defaultStringType: 'PLAIN'
  }) {
    this.defaultStringType = props.defaultStringType;
  }

  write(specs: Record<Key, Value>): string {
    return stringify(specs, {
      aliasDuplicateObjects: false,
      defaultStringType: this.defaultStringType,
      defaultKeyType: 'PLAIN'
    });
  }
}
