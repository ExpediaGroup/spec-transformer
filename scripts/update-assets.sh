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

cp package.json ../package.json
cd ..
rm -rf dist

git config --global user.name "eg-oss-ci"
git config --global user.email "oss@expediagroup.com"
git config --global credential.helper "store --file=$HOME/.git-credentials"
echo "https://github.com:${GH_TOKEN}@github.com" > "$HOME/.git-credentials"

git pull
git add package.json dist
git commit --amend --no-edit
git push --force
