/*
 * Copyright 2017 The Kubernetes Authors
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
 * Test the version command
 *
 */
import { Common, CLI, ReplExpect } from '@kui-shell/test'

describe(`Version command ${process.env.MOCHA_RUN_TARGET || ''}`, function (this: Common.ISuite) {
  before(Common.before(this))
  after(Common.after(this))

  it('should report proper version', () =>
    CLI.command('version', this.app)
      .then(ReplExpect.okWithCustom({ expect: Common.expectedVersion }))
      .catch(Common.oops(this)))
})
