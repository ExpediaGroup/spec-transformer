# Spec Transformer

[![npm version](https://img.shields.io/npm/v/@expediagroup/spec-transformer)](https://www.npmjs.com/package/@expediagroup/spec-transformer)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Build](https://img.shields.io/github/actions/workflow/status/ExpediaGroup/spec-transformer/release.yml?branch=main)](https://github.com/ExpediaGroup/spec-transformer/actions)

Maintained by [@mohnoor94](https://github.com/mohnoor94) | [Expedia Group](https://github.com/ExpediaGroup)

A composable, pluggable pipeline for transforming OpenAPI 3.0 specifications. Chain multiple transformers together to clean, reshape, and convert your API specs in a single pass - no manual editing required.

- **Clean up specs for publishing** - strip unwanted HTTP headers (`Authorization`, `Content-Type`, etc.) before exposing API docs externally
- **Route through API gateways** - prepend path prefixes to all endpoints automatically
- **Unify documentation portals** - consolidate or replace tags across operations
- **Fix polymorphic schemas** - auto-generate `oneOf` discriminator arrays so tools like Swagger UI render inheritance correctly
- **Export to Postman** - convert any OpenAPI spec into a ready-to-import Postman Collection v2.1, with folder-by-tag organization and example parameters

Available as a TypeScript library and a CLI. Zero config for common use cases - just pipe your spec through and go.

## Architecture

```mermaid
flowchart TB
    Input["fa:fa-file-code Input\n YAML / JSON"]:::io
    Reader["fa:fa-book-open Reader"]:::process
    Writer["fa:fa-pen-nib Writer"]:::process
    Output["fa:fa-file-export Output\n YAML / JSON"]:::io

    Input --> Reader

    subgraph chain [" TransformerChain "]
        direction TB
        H["fa:fa-filter HeaderRemoval"]:::transformer
        E["fa:fa-route Endpoint"]:::transformer
        T["fa:fa-tags Tags"]:::transformer
        OT["fa:fa-id-card OperationIdsToTags"]:::transformer
        O["fa:fa-sitemap OneOf"]:::transformer
        P["fa:fa-paper-plane Postman"]:::transformer
    end

    Reader --> chain --> Writer --> Output
    Output -.- Note["OpenAPI spec or\nPostman Collection"]:::note

    classDef io fill:#e8f4f8,stroke:#2196F3,stroke-width:2px,color:#1565C0
    classDef note fill:#fffde7,stroke:#FFC107,stroke-width:1.5px,color:#F57F17,font-style:italic
    classDef process fill:#fff3e0,stroke:#FF9800,stroke-width:2px,color:#E65100
    classDef transformer fill:#f3e5f5,stroke:#9C27B0,stroke-width:1.5px,color:#6A1B9A,stroke-dasharray: 4 2

    style chain fill:#fafafa,stroke:#9C27B0,stroke-width:2px,stroke-dasharray: 5 5,color:#6A1B9A
```

## Transformers

| Transformer | What it does |
| --- | --- |
| `HeaderRemovalTransformer` | Removes unwanted HTTP headers from operations and components. Resolves `$ref` references. Case-insensitive matching. |
| `EndpointTransformer` | Prepends a path prefix to all endpoints. Auto-extracts from the first server URL if omitted. |
| `TagsSettingTransformer` | Replaces all operation and top-level tags with a single target tag. |
| `OperationIdsToTagsTransformer` | Uses each operation's `operationId` as its tag. |
| `OneOfSettingTransformer` | Auto-generates `oneOf` arrays for polymorphic schema hierarchies using discriminator mappings. |
| `PostmanTransformer` | Converts an OpenAPI spec into a Postman Collection v2.1. |

## Installation

Requires Node.js >= 18.

```bash
npm install @expediagroup/spec-transformer
```

## Library Usage

### Single transformer

```typescript
import {
  COMMON_UNWANTED_HEADERS,
  HeaderRemovalTransformer,
  TransformerChain,
  YamlReader,
  YamlWriter,
} from '@expediagroup/spec-transformer';

const specs = '...'; // OpenAPI spec as a YAML string

const chain = new TransformerChain([
  new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS),
]);

const result = chain.transform(specs, new YamlReader(), new YamlWriter());
console.log(result);
```

`COMMON_UNWANTED_HEADERS` removes: `accept`, `accept-encoding`, `user-agent`, `authorization`, `content-type`.

### Chaining multiple transformers

```typescript
import {
  COMMON_UNWANTED_HEADERS,
  EndpointTransformer,
  HeaderRemovalTransformer,
  TagsSettingTransformer,
  TransformerChain,
  YamlReader,
  YamlWriter,
} from '@expediagroup/spec-transformer';

const chain = new TransformerChain([
  new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS),
  new TagsSettingTransformer('my-api'),
  new EndpointTransformer('/v2'),
]);

const result = chain.transform(specs, new YamlReader(), new YamlWriter());
```

> **JSON input/output:** Swap in `JsonReader` and `JsonWriter` for JSON specs - the API is identical.

### In-memory objects

Use `transformRecord()` when you already have a parsed spec object:

```typescript
import {
  COMMON_UNWANTED_HEADERS,
  HeaderRemovalTransformer,
  TransformerChain,
} from '@expediagroup/spec-transformer';

const spec = { openapi: '3.0.0', paths: { /* ... */ } };

const chain = new TransformerChain([
  new HeaderRemovalTransformer(COMMON_UNWANTED_HEADERS),
]);

const result = chain.transformRecord(spec);
```

## Before / After Examples

### Header Removal

Three header parameters go in - only the custom one survives:

**Before:**

```yaml
paths:
  /pets:
    get:
      parameters:
        - name: accept
          in: header
        - name: X-Request-ID
          in: header
        - name: content-type
          in: header
```

**After** (with `COMMON_UNWANTED_HEADERS`):

```yaml
paths:
  /pets:
    get:
      parameters:
        - name: X-Request-ID
          in: header
```

### Endpoint Prefixing

All paths are prepended with the given prefix:

**Before:**

```yaml
paths:
  /operation1:
    get:
      summary: Get operation1
  /operation2:
    post:
      summary: Post operation2
```

**After** (with `new EndpointTransformer('/v2')`):

```yaml
paths:
  /v2/operation1:
    get:
      summary: Get operation1
  /v2/operation2:
    post:
      summary: Post operation2
```

### OneOf Discriminator

A `$ref` pointing to a parent schema with a discriminator is replaced with a `oneOf` array of its leaf types:

**Before:**

```yaml
paths:
  /test:
    post:
      requestBody:
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PaymentMethod"
```

**After** (given `PaymentMethod -> CreditCard, PayPal` and `CreditCard -> Visa, Mastercard` hierarchies):

```yaml
paths:
  /test:
    post:
      requestBody:
        content:
          application/json:
            schema:
              oneOf:
                - $ref: "#/components/schemas/PayPal"
                - $ref: "#/components/schemas/Mastercard"
                - $ref: "#/components/schemas/Debit"
                - $ref: "#/components/schemas/Credit"
```

## CLI Usage

```bash
npx @expediagroup/spec-transformer --help
```

### Options

| Flag | Description |
| --- | --- |
| `--version` | Show version number |
| `--input [path]` | Input file path |
| `--inputFormat [value]` | Input format: `json` or `yaml` (default: `yaml`) |
| `--output [path]` | Output file path |
| `--outputFormat [value]` | Output format: `json` or `yaml` (default: `yaml`, or `json` when `--postman` is used) |
| `--headers [list]` | Remove specified headers (comma-separated), or common headers if no value given |
| `--tags [value]` | Replace all tags with the given tag |
| `--endpoint [prefix]` | Prepend a path prefix, or auto-extract from the first server URL |
| `--oneOf` | Generate `oneOf` arrays for polymorphic schemas |
| `--postman` | Convert to Postman Collection format |
| `--operationIdsToTags` | Use operation IDs as tags |
| `--defaultStringType [value]` | YAML string quoting style: `PLAIN` (default) or `QUOTE_SINGLE` |

### Examples

```bash
# Remove common headers
npx @expediagroup/spec-transformer --input api.yaml --output clean.yaml --headers

# Remove specific headers
npx @expediagroup/spec-transformer --input api.yaml --output clean.yaml --headers "authorization,x-api-key"

# Chain transformations
npx @expediagroup/spec-transformer --input api.yaml --output out.yaml --headers --tags my-api --endpoint /v2

# Convert to Postman Collection
npx @expediagroup/spec-transformer --input api.yaml --output collection.json --postman
```

## Supported Formats

| Format | Reader | Writer |
| --- | --- | --- |
| YAML | `YamlReader` | `YamlWriter` |
| JSON | `JsonReader` | `JsonWriter` |

## Development

```bash
npm install
npm run build
npm test
```

Tests enforce a 90% coverage threshold across statements, branches, functions, and lines.

## License

[Apache License, Version 2.0](LICENSE) - Copyright (c) Expedia Group

---

## Development Team
- [Mohammad Noor Abu Khleif](https://github.com/mohnoor94)
- [Osama Salman](https://github.com/osama-salman99)
