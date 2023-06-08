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

import { filter, map } from '../../src/collection/Functions';

describe('test Functions', () => {
  describe('test map', () => {
    it('should map a record', () => {
      const record = {
        a: 'a',
        b: 'b',
        c: 'c'
      };
      const result = map(record, (k, v) => [k, v + v]);
      expect(result).toEqual({
        a: 'aa',
        b: 'bb',
        c: 'cc'
      });
    });

    it('should map an empty record', () => {
      const record = {};
      const result = map(record, (k, v) => [k, v + v]);
      expect(result).toEqual({});
    });
  });

  describe('test filter', () => {
    it('should filter a record', function() {
      const record = {
        a: 'a',
        b: 'b',
        c: 'c'
      };
      const result = filter(record, (k, v) => k === 'a' || v === 'c');
      expect(result).toEqual({
        a: 'a',
        c: 'c'
      });
    });

    it('should filter an empty record', () => {
      const record = {};
      const result = filter(record, (k, v) => k === 'a' || v === 'c');
      expect(result).toEqual({});
    });
  });
});
