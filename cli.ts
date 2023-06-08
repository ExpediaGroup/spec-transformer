#!/usr/bin/env node

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

import Transformer from './src/transformer/Transformer';
import { EndpointTransformer } from './src/transformer/EndpointTransformer';
import { TransformerChain } from './src/facade/TransformerChain';
import { TagsSettingTransformer } from './src/transformer/TagsSettingTransformer';
import { OneOfSettingTransformer } from './src/transformer/OneOfSettingTransformer';
import { PostmanTransformer } from './src/transformer/PostmanTransformer';
import { COMMON_UNWANTED_HEADERS, HeaderRemovalTransformer } from './src/transformer/HeaderRemovalTransformer';

import Reader from './src/io/reader/Reader';
import Writer from './src/io/writer/Writer';
import { YamlReader } from './src/io/reader/YamlReader';
import { JsonReader } from './src/io/reader/JsonReader';
import { JsonWriter } from './src/io/writer/JsonWriter';
import { YamlWriter } from './src/io/writer/YamlWriter';

import { Command } from 'commander';
import * as fs from 'fs';

const appName = 'Spec Transformer';
const optionNames = {
  input: 'input',
  inputFormat: 'inputFormat',
  output: 'output',
  outputFormat: 'outputFormat',
  tags: 'tags',
  headers: 'headers',
  oneOf: 'oneOf',
  postman: 'postman',
  endpoint: 'endpoint'
};

function buildCommand(): Command {
  const program = new Command();
  program.version('1.0.0')
    .description(`${appName} CLI`)
    .option(`-i, --${optionNames.input} [value]`, 'Input file path')
    .option(`-if, --${optionNames.inputFormat} [value]`, 'Input file format. Supported formats: json, yaml. Default: yaml')
    .option(`-o, --${optionNames.output} [value]`, 'Output file path')
    .option(`-of, --${optionNames.outputFormat} [value]`, 'Output file format. Supported formats: json, yaml. Default: yaml unless Postman transformation is applied, then json')
    .option(`-tt, --${optionNames.tags} [value]`, 'Update the specs tags')
    .option(`-th, --${optionNames.headers} [value]`, 'Remove the specified headers from the specs, or the common ones if none are specified')
    .option(`-to, --${optionNames.oneOf}`, 'Add the oneOf property to the specs where needed')
    .option(`-tp, --${optionNames.postman}`, 'Transform the specs to Postman collection format')
    .option(`-te, --${optionNames.endpoint} [value]`, 'Prepend endpoints with the specified product key, or the pathname from the first server url if none is specified.')
    .parse(process.argv);

  return program;
}

class TransformerExecutor {
  private command: Command;
  private transformers: Transformer[] = [];
  private readonly inputPath: string | null = null;
  private readonly reader: Reader | null = null;
  private readonly outputPath: string | null = null;
  private readonly writer: Writer | null = null;

  constructor(command: Command) {
    this.command = command;

    const tags = command.getOptionValue(optionNames.tags);
    const headers = command.getOptionValue(optionNames.headers);
    const oneOf = command.getOptionValue(optionNames.oneOf);
    const postman = command.getOptionValue(optionNames.postman);
    const input = command.getOptionValue(optionNames.input);
    const inputFormat = command.getOptionValue(optionNames.inputFormat);
    const output = command.getOptionValue(optionNames.output);
    const outputFormat = command.getOptionValue(optionNames.outputFormat);
    const endpoint = command.getOptionValue(optionNames.endpoint);

    if (tags) {
      this.transformers.push(new TagsSettingTransformer(tags));
    }

    if (headers) {
      const headersValue = typeof headers === 'string' ? headers.split(',') : COMMON_UNWANTED_HEADERS;
      this.transformers.push(new HeaderRemovalTransformer(headersValue));
    }

    if (oneOf) {
      this.transformers.push(new OneOfSettingTransformer());
    }

    if (postman) {
      this.transformers.push(new PostmanTransformer());
    }

    if (endpoint) {
      const endpointValue = typeof endpoint === 'string' ? endpoint : undefined;
      this.transformers.push(new EndpointTransformer(endpointValue));
    }

    if (input) {
      this.inputPath = input;
    }

    if (output) {
      this.outputPath = output;
    }

    this.reader = inputFormat?.toLowerCase() === 'json' ? new JsonReader() : new YamlReader();


    if (isTransformerUsed(command, optionNames.postman) && outputFormat?.toLowerCase() !== 'json') {
      console.warn(`>> ${appName}: Postman collection import is only supported from JSON files. Defaulting to JSON Writer`);
      this.writer = new JsonWriter();
    } else {
      this.writer = outputFormat?.toLowerCase() === 'json' ? new JsonWriter() : new YamlWriter();
    }
  }

  execute(): void {
    if (this.transformers.length === 0) {
      exitWithMessage(`No transformers specified! You need to add at least 1 transformer!`);
    }

    if (!this.inputPath) {
      exitWithMessage(`No input file specified`, optionNames.input);
    }

    if (!this.reader) {
      console.warn(`>> ${appName}: No input format specified, defaulting to a YAML Reader!`);
    }

    if (!this.outputPath) {
      exitWithMessage(`No output file specified`, optionNames.output);
    }

    if (!this.writer) {
      console.warn(`>> ${appName}: No output format specified, defaulting to a YAML Writer!`);
    }

    if (isTransformerUsed(this.command, optionNames.postman) && !(this.writer instanceof JsonWriter)) {
      console.warn(`>> ${appName}: Are you sure you want to write the Postman collection in YAML format? Postman collection import is only supported from JSON files.`);
    }

    if (isTransformerUsed(this.command, optionNames.endpoint) && typeof this.command.getOptionValue(optionNames.endpoint) !== 'string') {
      console.warn(`>> ${appName}: No product key is specified to '--${optionNames.endpoint}' transformer, defaulting to the pathname from the first server url!`);
    }

    const input = fs.readFileSync(this.inputPath!!, 'utf8');
    const transformerChain = new TransformerChain(this.transformers);
    const output = transformerChain.transform(input, this.reader!!, this.writer!!);
    fs.writeFileSync(this.outputPath!!, output, { flag: 'w' });

    console.info(`>> ${appName}: Output file is available at: ${this.outputPath}`);
  }
}

function isTransformerUsed(command: Command, transformerName: string): boolean {
  return command.getOptionValue(transformerName) !== undefined;
}

function exitWithMessage(message: string, missingOption: string | null = null): void {
  const messageWithOption = missingOption ? `${message}! You may want to specify the '--${missingOption}' option value.` : message;
  console.error(`>> ${appName}: ${messageWithOption}`);
  process.exit(1);
}

function runCLI() {
  console.log(`>> ${appName}`);

  new TransformerExecutor(buildCommand()).execute();
}

runCLI();
