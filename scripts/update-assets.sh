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
git add CHANGELOG.md package.json dist

timestamp=$(date +"%Y%m%d%H%M%S")
branch_name="update-assets-$timestamp"

git checkout -b "$branch_name"
git commit -m "chore(release): update assets"
git push origin "$branch_name"
gh pr create --base main --head your-feature-branch --title "chore(release): update assets" --body "Updating Release Assets (CHANGELOG.md, package.json, dist)"
