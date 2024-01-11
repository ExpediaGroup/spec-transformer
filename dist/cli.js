#!/usr/bin/env node
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const EndpointTransformer_1 = require("./src/transformer/EndpointTransformer");
const TransformerChain_1 = require("./src/facade/TransformerChain");
const TagsSettingTransformer_1 = require("./src/transformer/TagsSettingTransformer");
const OneOfSettingTransformer_1 = require("./src/transformer/OneOfSettingTransformer");
const PostmanTransformer_1 = require("./src/transformer/PostmanTransformer");
const HeaderRemovalTransformer_1 = require("./src/transformer/HeaderRemovalTransformer");
const YamlReader_1 = require("./src/io/reader/YamlReader");
const JsonReader_1 = require("./src/io/reader/JsonReader");
const JsonWriter_1 = require("./src/io/writer/JsonWriter");
const YamlWriter_1 = require("./src/io/writer/YamlWriter");
const commander_1 = require("commander");
const fs = __importStar(require("fs"));
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
function buildCommand() {
    const program = new commander_1.Command();
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
    constructor(command) {
        this.transformers = [];
        this.inputPath = null;
        this.reader = null;
        this.outputPath = null;
        this.writer = null;
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
            this.transformers.push(new TagsSettingTransformer_1.TagsSettingTransformer(tags));
        }
        if (headers) {
            const headersValue = typeof headers === 'string' ? headers.split(',') : HeaderRemovalTransformer_1.COMMON_UNWANTED_HEADERS;
            this.transformers.push(new HeaderRemovalTransformer_1.HeaderRemovalTransformer(headersValue));
        }
        if (oneOf) {
            this.transformers.push(new OneOfSettingTransformer_1.OneOfSettingTransformer());
        }
        if (postman) {
            this.transformers.push(new PostmanTransformer_1.PostmanTransformer());
        }
        if (endpoint) {
            const endpointValue = typeof endpoint === 'string' ? endpoint : undefined;
            this.transformers.push(new EndpointTransformer_1.EndpointTransformer(endpointValue));
        }
        if (input) {
            this.inputPath = input;
        }
        if (output) {
            this.outputPath = output;
        }
        this.reader = (inputFormat === null || inputFormat === void 0 ? void 0 : inputFormat.toLowerCase()) === 'json' ? new JsonReader_1.JsonReader() : new YamlReader_1.YamlReader();
        if (isTransformerUsed(command, optionNames.postman) && (outputFormat === null || outputFormat === void 0 ? void 0 : outputFormat.toLowerCase()) !== 'json') {
            console.warn(`>> ${appName}: Postman collection import is only supported from JSON files. Defaulting to JSON Writer`);
            this.writer = new JsonWriter_1.JsonWriter();
        }
        else {
            this.writer = (outputFormat === null || outputFormat === void 0 ? void 0 : outputFormat.toLowerCase()) === 'json' ? new JsonWriter_1.JsonWriter() : new YamlWriter_1.YamlWriter();
        }
    }
    execute() {
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
        if (isTransformerUsed(this.command, optionNames.postman) && !(this.writer instanceof JsonWriter_1.JsonWriter)) {
            console.warn(`>> ${appName}: Are you sure you want to write the Postman collection in YAML format? Postman collection import is only supported from JSON files.`);
        }
        if (isTransformerUsed(this.command, optionNames.endpoint) && typeof this.command.getOptionValue(optionNames.endpoint) !== 'string') {
            console.warn(`>> ${appName}: No product key is specified to '--${optionNames.endpoint}' transformer, defaulting to the pathname from the first server url!`);
        }
        const input = fs.readFileSync(this.inputPath, 'utf8');
        const transformerChain = new TransformerChain_1.TransformerChain(this.transformers);
        const output = transformerChain.transform(input, this.reader, this.writer);
        fs.writeFileSync(this.outputPath, output, { flag: 'w' });
        console.info(`>> ${appName}: Output file is available at: ${this.outputPath}`);
    }
}
function isTransformerUsed(command, transformerName) {
    return command.getOptionValue(transformerName) !== undefined;
}
function exitWithMessage(message, missingOption = null) {
    const messageWithOption = missingOption ? `${message}! You may want to specify the '--${missingOption}' option value.` : message;
    console.error(`>> ${appName}: ${messageWithOption}`);
    process.exit(1);
}
function runCLI() {
    console.log(`>> ${appName}`);
    new TransformerExecutor(buildCommand()).execute();
}
runCLI();
