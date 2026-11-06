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

/**
 * A no-op stand-in for `@faker-js/faker`, installed only under
 * `postman-collection` (see the `overrides` block in the root package.json).
 *
 * Why it exists: `postman-collection` is used by `openapi-to-postmanv2`,
 * which is the last release of its line — it pins `@faker-js/faker@5.5.3`
 * exactly and, at import time, reads the pre-v8 API off it (`faker.address.city`,
 * `faker.random.arrayElement`, …) to build the generators behind Postman's
 * `{{$randomCity}}`-style dynamic variables.
 *
 * `5.5.3` is affected by GHSA-qxc2-j82w-r537 (`<=10.4.0`), and versions that
 * patch it (>= 10.5.0) dropped those namespaces, so postman-collection cannot
 * load with modern @faker-js/faker directly. Since spec-transformer only transforms
 * OpenAPI specs to Postman collections and never evaluates dynamic variables,
 * this stub proxies all property accesses to safe no-op callables, avoiding
 * runtime crashes and resolving the vulnerability.
 */
const stub = new Proxy(function faker() {}, {
  get: () => stub,
  apply: () => undefined,
});

module.exports = stub;
