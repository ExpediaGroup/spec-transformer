#!/bin/bash
# Copyright (C) 2023 Expedia, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

cp CHANGELOG.md ../CHANGELOG.md
cp package.json ../package.json
cd ..
rm -rf dist
git pull
git status
git add CHANGELOG.md package.json dist
git commit --amend --no-edit
git push
