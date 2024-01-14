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

mv CHANGELOG.md ../CHANGELOG.md
mv package.json ../package.json
git add ../CHANGELOG.md ../package.json
git commit -m "chore(release): update assets [skip ci]"
git status
git push
