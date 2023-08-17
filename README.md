# Spec Transformer

The API Spec Transformer Library

## Installation

```bash
npm install @expediagroup/spec-transformer
```

## Usage

Pick one of the following ways to use the library:

### 1. Use spec-transformer as a library

Example:

```typescript
import { HeaderRemovalTransformer, TransformerChain, YamlReader, YamlWriter } from '@spec-transformer';

const openapispecs = '...'; // OpenAPI specs in JSON or YAML format

const transformers = new TransformerChain([
  new HeaderRemovalTransformer() // Add more transformers here
]);

const transformedSpecs = transformers.transform(openapispecs, YamlReader, YamlWriter);

console.log(transformedSpecs);
```

### 2. Use spec-transformer as a CLI

```bash
npx -p @expediagroup/spec-transformer cli --help  # Show help, and list all available commands.
```

Example:

```bash
npx -p @expediagroup/spec-transformer cli --input specs.yaml --output out.yaml --headers  # Read specs from specs.yaml, remove headers, and write to out.yaml
```

### 3. Build and run spec-transformer locally

```bash
npm run build
```

### Test

```bash
npm test
```

---

## Development Team

- [Mohammad Noor Abu Khleif](https://github.com/mohnoor94)
