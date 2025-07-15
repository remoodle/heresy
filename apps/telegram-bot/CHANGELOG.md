# Changelog

## [2.1.6](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.1.5...remoodle/telegram-bot-v2.1.6) (2025-07-15)


### Bug Fixes

* **deps:** update all non-major dependencies ([#473](https://github.com/remoodle/remoodle/issues/473)) ([0218a77](https://github.com/remoodle/remoodle/commit/0218a779ea56dfdf77d28294fb5f8a0ee2b9d790))
* **deps:** update all non-major dependencies ([#479](https://github.com/remoodle/remoodle/issues/479)) ([ffe2528](https://github.com/remoodle/remoodle/commit/ffe25283a7bea467039219455baebaab9dd702d8))

## [2.1.5](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.1.4...remoodle/telegram-bot-v2.1.5) (2025-07-05)


### Bug Fixes

* **deps:** update all non-major dependencies ([#456](https://github.com/remoodle/remoodle/issues/456)) ([2fc14f2](https://github.com/remoodle/remoodle/commit/2fc14f2f025a54cec5f29a955f60ae71936c6526))

## [2.1.4](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.1.3...remoodle/telegram-bot-v2.1.4) (2025-07-05)


### Code Refactoring

* **tgbot:** simplify notification settings ([6180ebb](https://github.com/remoodle/remoodle/commit/6180ebb1899cf707e4ab91ef8e16dbc3b7233572))

## [2.1.3](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.1.2...remoodle/telegram-bot-v2.1.3) (2025-07-05)


### Bug Fixes

* **tgbot:** handle tgconnect properly ([29bc99c](https://github.com/remoodle/remoodle/commit/29bc99c9e8819fe4254c515051a6a169d1a67948))

## [2.1.2](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.1.1...remoodle/telegram-bot-v2.1.2) (2025-07-03)


### Bug Fixes

* **deps:** update dependency dotenv to v17 ([#451](https://github.com/remoodle/remoodle/issues/451)) ([cac62b8](https://github.com/remoodle/remoodle/commit/cac62b838a6ab60a9a44df92c911d50fb702e1f6))

## [2.1.1](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.1.0...remoodle/telegram-bot-v2.1.1) (2025-07-02)


### Code Refactoring

* **tgbot:** use actual callback-data bindings in keyboards ([75df6f1](https://github.com/remoodle/remoodle/commit/75df6f104e94bdc65b53c8c9b40cc4adb36b53fa))

## [2.1.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.11...remoodle/telegram-bot-v2.1.0) (2025-07-02)


### Features

* **tgbot:** introduce logging setup ([5a8dc7d](https://github.com/remoodle/remoodle/commit/5a8dc7d85e127d67dd5d7e3a1e4477f1fb6ec208))


### Bug Fixes

* support group and supergroup ([d858bee](https://github.com/remoodle/remoodle/commit/d858beed719dac8d56994e7e10000e52a0f3d239))


### Miscellaneous Chores

* cleanup ([4d34c2a](https://github.com/remoodle/remoodle/commit/4d34c2a7954a84f43a57a32cfd31547de023c118))


### Code Refactoring

* **about:** change message template ([0bbdedb](https://github.com/remoodle/remoodle/commit/0bbdedbaca4235b5d66ddb260166d018ef67a4ba))
* define context ([3b49744](https://github.com/remoodle/remoodle/commit/3b4974402b2315daf5f321f9b7a1f23dfbda85bf))
* overhaul tgbot architecture ([c94032b](https://github.com/remoodle/remoodle/commit/c94032b08b12c032fc0c6bd76bd4e77648a97ac1))
* **tgbot:** introduce callback-data ([cd6bc1f](https://github.com/remoodle/remoodle/commit/cd6bc1f22336b87b33387bb4891288ff8edc6b33))
* **tgbot:** split features and keyboards ([19bfd8a](https://github.com/remoodle/remoodle/commit/19bfd8afadeb9e7c4f208a334777b98c33e94e04))
* use type-safe callbacks everywhere ([1ded6d0](https://github.com/remoodle/remoodle/commit/1ded6d04a29d157c4369deb087d9e839b3adb39f))

## [2.0.11](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.10...remoodle/telegram-bot-v2.0.11) (2025-07-01)


### Miscellaneous Chores

* refactor adapters ([a539047](https://github.com/remoodle/remoodle/commit/a539047656f2786705458bb883b71595b7d3e38b))

## [2.0.10](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.9...remoodle/telegram-bot-v2.0.10) (2025-07-01)


### Bug Fixes

* unfuck total calculation (kinda) ([caad609](https://github.com/remoodle/remoodle/commit/caad609ccc33b163ee32de7fd710c7f23baa7002))

## [2.0.9](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.8...remoodle/telegram-bot-v2.0.9) (2025-07-01)


### Bug Fixes

* return og grades formatting ([018f3b2](https://github.com/remoodle/remoodle/commit/018f3b23c92df94d520c2eb989d894e57ce36746))


### Miscellaneous Chores

* remove unused import ([70927a6](https://github.com/remoodle/remoodle/commit/70927a64ac11fb192e213ed6da67428747474ede))


### Code Refactoring

* move things around message formatter ([918fe23](https://github.com/remoodle/remoodle/commit/918fe23acd21f891ddaf3bfcc11d53a2c6bd422d))
* **tgbot:** unify notification settings mgmt ([3533048](https://github.com/remoodle/remoodle/commit/353304898d83e60f0c31cf4abd22dd0846ac2c03))
* unify assignment message formatting logic ([c982d69](https://github.com/remoodle/remoodle/commit/c982d69b748a3486ff6564ccc93a1118d450a21c))

## [2.0.8](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.7...remoodle/telegram-bot-v2.0.8) (2025-06-24)


### Bug Fixes

* configure course name parser properly ([48a7dda](https://github.com/remoodle/remoodle/commit/48a7dda3a293b5d04f9e69aaf938b17df82b71b5))

## [2.0.7](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.6...remoodle/telegram-bot-v2.0.7) (2025-06-24)


### Bug Fixes

* proper teacher parsing ([4408684](https://github.com/remoodle/remoodle/commit/4408684c8c5c45c8808585023ffb416f7a9a7901))


### Code Refactoring

* create better uni formatter core ([#430](https://github.com/remoodle/remoodle/issues/430)) ([8f0a8f1](https://github.com/remoodle/remoodle/commit/8f0a8f1f9c46eac1e0fe66fb1a2c1e0c560159dd))
* unify course name formatting ([958e2a6](https://github.com/remoodle/remoodle/commit/958e2a6f32028beafc34ea0cd168ac948d0c0b29))
* unify formatting ([5c3de9f](https://github.com/remoodle/remoodle/commit/5c3de9f4636eab42a284346ed164f79c443c8302))

## [2.0.6](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.5...remoodle/telegram-bot-v2.0.6) (2025-06-07)


### Code Refactoring

* fix basic eslint warnings ([cc4dec0](https://github.com/remoodle/remoodle/commit/cc4dec0e72a53b535fba0e2b2c1caf8867161ab0))

## [2.0.5](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.4...remoodle/telegram-bot-v2.0.5) (2025-06-07)


### Build System

* update tooling ([5861885](https://github.com/remoodle/remoodle/commit/5861885a37b23eb40c67d0347981998d2321bd13))

## [2.0.4](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.3...remoodle/telegram-bot-v2.0.4) (2025-06-07)


### Miscellaneous Chores

* upgrade tooling & packages ([8f519e9](https://github.com/remoodle/remoodle/commit/8f519e9031e9b2b21eaeccce5d23d36fe9e10b29))

## [2.0.3](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.2...remoodle/telegram-bot-v2.0.3) (2025-06-05)


### Miscellaneous Chores

* open calendar for bot ([07ce97e](https://github.com/remoodle/remoodle/commit/07ce97eda77d742850fa05ceb453a7263061c117))
* use own nvmrc for each project ([f580070](https://github.com/remoodle/remoodle/commit/f580070692df720e16ce1c3029bf705c03c477f9))

## [2.0.2](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.1...remoodle/telegram-bot-v2.0.2) (2025-05-17)


### Bug Fixes

* add error logs ([41451ce](https://github.com/remoodle/remoodle/commit/41451cef9906cc9f91d75655dbeb56c3ecd98de6))

## [2.0.1](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v2.0.0...remoodle/telegram-bot-v2.0.1) (2025-05-14)


### Miscellaneous Chores

* bump node version ([7dc15c1](https://github.com/remoodle/remoodle/commit/7dc15c129027a7c76f96c7c003d77c27565c14ea))

## [2.0.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.10...remoodle/telegram-bot-v2.0.0) (2025-05-09)


### ⚠ BREAKING CHANGES

* add universities support ([#392](https://github.com/remoodle/remoodle/issues/392))

### Features

* add AITU feature flags ([3f5e6df](https://github.com/remoodle/remoodle/commit/3f5e6dfece06f74637135124ad8042457f44ab7e))
* add creators and about command ([5fe5115](https://github.com/remoodle/remoodle/commit/5fe511572c2d626f2d6863ab1ce425ddea5f1968))
* add universities support ([#392](https://github.com/remoodle/remoodle/issues/392)) ([526f802](https://github.com/remoodle/remoodle/commit/526f802dd7635c832e882096ba16e25cbeaba475))


### Reverts

* "feat: add AITU feature flags" ([aa7525b](https://github.com/remoodle/remoodle/commit/aa7525babf51342a196147c2b6df1e5bfc034c8e))

## [1.0.10](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.9...remoodle/telegram-bot-v1.0.10) (2025-03-20)


### Bug Fixes

* **bot:** change `reply` to `editMessageText` method ([932e0b1](https://github.com/remoodle/remoodle/commit/932e0b1de25e7b642fafd4df2cbbb179a4b08fb6))

## [1.0.9](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.8...remoodle/telegram-bot-v1.0.9) (2025-03-20)


### Bug Fixes

* **bot:** update about info ([0ddc1cc](https://github.com/remoodle/remoodle/commit/0ddc1cc2d6f5bc6246fb5b1950b2a5d876b95401))

## [1.0.8](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.7...remoodle/telegram-bot-v1.0.8) (2025-02-16)


### Reverts

* return rounding ([4caa81d](https://github.com/remoodle/remoodle/commit/4caa81dd5a610de7849fac3e9b0b080c11164e77))


### Tests

* trigger ci ([cbd010c](https://github.com/remoodle/remoodle/commit/cbd010cf74afc576140a93e7b90d84b96fa58989))
* trigger ci ([f0ba190](https://github.com/remoodle/remoodle/commit/f0ba190616657de08103aa936e7af9b22ea47657))
* trigger ci ([38352ab](https://github.com/remoodle/remoodle/commit/38352ab9260911b9c114df9baaca1765f7b9d7ef))
* trigger ci ([da2d4fa](https://github.com/remoodle/remoodle/commit/da2d4faa29f862613457ea8e1076d8c7c298346b))

## [1.0.7](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.6...remoodle/telegram-bot-v1.0.7) (2025-02-16)


### Bug Fixes

* clean up defaults ([1ea88cc](https://github.com/remoodle/remoodle/commit/1ea88cc7d02e2e88d83977de4b90e6b496af7e24))

## [1.0.6](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.5...remoodle/telegram-bot-v1.0.6) (2025-02-15)


### Bug Fixes

* **tgbot:** remove graderaw rounding ([e73e382](https://github.com/remoodle/remoodle/commit/e73e382506fc415b8903e1a70f96105ad6e3a325))

## [1.0.5](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.4...remoodle/telegram-bot-v1.0.5) (2025-02-12)


### Bug Fixes

* remove unused import ([9b1d132](https://github.com/remoodle/remoodle/commit/9b1d13216701399f4046a9cc5b8f8b3029886109))
* use new schema in telegram bot ([211f760](https://github.com/remoodle/remoodle/commit/211f760054de984dcf0214d98a65eb389157ec53))

## [1.0.4](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.3...remoodle/telegram-bot-v1.0.4) (2025-02-11)


### Code Refactoring

* remove kal features ([#354](https://github.com/remoodle/remoodle/issues/354)) ([3684d2f](https://github.com/remoodle/remoodle/commit/3684d2fd57802cbb8c740912da9f53096eb30fa2))

## [1.0.3](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.2...remoodle/telegram-bot-v1.0.3) (2025-02-11)


### Miscellaneous Chores

* **trunk:** release remoodle/telegram-bot 1.0.2 ([#350](https://github.com/remoodle/remoodle/issues/350)) [manual] ([160bb3f](https://github.com/remoodle/remoodle/commit/160bb3fbe6208a54df144dafb9551deb207bf1b6))

## [1.0.2](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.1...remoodle/telegram-bot-v1.0.2) (2025-02-10)


### Miscellaneous Chores

* **trunk:** release remoodle/telegram-bot 1.0.2 ([#348](https://github.com/remoodle/remoodle/issues/348)) [manual] ([7b3074e](https://github.com/remoodle/remoodle/commit/7b3074e901cd6bc342ed2fc996201e37e1ec36f5))


### Code Refactoring

* **api,cluster,front,tgbot:** update notificationSettings schema ([fa24ca8](https://github.com/remoodle/remoodle/commit/fa24ca896bc45e49ee6d81dd39b922b8e6bbbf25))

## [1.0.1](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v1.0.0...remoodle/telegram-bot-v1.0.1) (2025-02-04)


### Bug Fixes

* pin pnpm in corepack ([b21b9df](https://github.com/remoodle/remoodle/commit/b21b9df8e58a209ffc8439fe10d47a46944ec97b))
* **tgbor:** show problematic courses ([78d3f67](https://github.com/remoodle/remoodle/commit/78d3f67e8b14dda818618a7f466e7c2a5ca141d3))


### Code Refactoring

* **tgbot:** common sense ([b26766d](https://github.com/remoodle/remoodle/commit/b26766d41a168b0dd538889d18fa8c6f587e811b))

## [1.0.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.14.0...remoodle/telegram-bot-v1.0.0) (2025-01-28)


### ⚠ BREAKING CHANGES

* trigger bot release

### Features

* trigger bot release ([c8426fd](https://github.com/remoodle/remoodle/commit/c8426fdc11aa80318986a170a4a88dca9bd2519d))

## [0.14.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.13.0...remoodle/telegram-bot-v0.14.0) (2025-01-28)


### Features

* show token health in bot ([f6af555](https://github.com/remoodle/remoodle/commit/f6af55531a44d8e9268b931e88fce7e08c6622c1))


### Bug Fixes

* correct default ([f6689cd](https://github.com/remoodle/remoodle/commit/f6689cdc056ce1c26c2edba93efc937b5ece0f64))

## [0.13.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.12.0...remoodle/telegram-bot-v0.13.0) (2025-01-20)


### Features

* add website miniapp in bot ([2d7c48a](https://github.com/remoodle/remoodle/commit/2d7c48a7f8968c8b3cd9f4c99b271518aa913b0e))
* add website miniapp to settings ([47a96e6](https://github.com/remoodle/remoodle/commit/47a96e6a90bbb5e36471cc49888ecb88dabb7405))


### Bug Fixes

* course shortname -&gt; fullname in bot ([7c6ad35](https://github.com/remoodle/remoodle/commit/7c6ad354ee191c8fe38243a53f57bff659bcdfba))
* remove "is due to be graded" ([0adb9fd](https://github.com/remoodle/remoodle/commit/0adb9fdfe8958e322eead0a1be798ccdec6efd6f))
* unused import ([a3c542b](https://github.com/remoodle/remoodle/commit/a3c542b2c3375ea41311a8da243d2c41d7a525b8))


### Miscellaneous Chores

* remove useless tests ([91f5a48](https://github.com/remoodle/remoodle/commit/91f5a48194ac68c4fd251bf37b872e82d176e928))

## [0.12.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.11.0...remoodle/telegram-bot-v0.12.0) (2025-01-14)


### Features

* support health recovery ([da29a2e](https://github.com/remoodle/remoodle/commit/da29a2e5c72b0c5fbf4c8d1281c49616f11b8a85))


### Bug Fixes

* bump api version ([7c10e86](https://github.com/remoodle/remoodle/commit/7c10e865b48305eaa95999f9e3932c127852f5f9))
* supress error ([2368a98](https://github.com/remoodle/remoodle/commit/2368a982d75f42052d5cbdf55289ed55633b3a1d))


### Code Refactoring

* **tgbot:** adapt breaking changes ([eafb7cb](https://github.com/remoodle/remoodle/commit/eafb7cbf43f4de716a7716607cc2b938b0a1e26b))

## [0.11.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.10.3...remoodle/telegram-bot-v0.11.0) (2025-01-08)


### Features

* remove new year theme ([c366067](https://github.com/remoodle/remoodle/commit/c36606725e2a5757610bbebe8555b63b3bb643af))


### Bug Fixes

* kal moment with back ([5567284](https://github.com/remoodle/remoodle/commit/556728409fc202ee46c1b98ac5e4c7383d2abe28))

## [0.10.3](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.10.2...remoodle/telegram-bot-v0.10.3) (2025-01-01)


### Bug Fixes

* assignment dates ([a76d274](https://github.com/remoodle/remoodle/commit/a76d2742f6d586636ecc722a3991f86c1e1fbd81))

## [0.10.2](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.10.1...remoodle/telegram-bot-v0.10.2) (2024-12-30)


### Bug Fixes

* remove comment (trigger release) ([22ba49b](https://github.com/remoodle/remoodle/commit/22ba49b31831a70840508614ab1aa776092f5ced))

## [0.10.1](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.10.0...remoodle/telegram-bot-v0.10.1) (2024-12-30)


### Miscellaneous Chores

* remove deadlines feature (discard after fix) ([7966ae8](https://github.com/remoodle/remoodle/commit/7966ae8405a109f9955593d58bcedb87499e8a98))

## [0.10.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.9.1...remoodle/telegram-bot-v0.10.0) (2024-12-25)


### Features

* add bot version ([b8b0fb0](https://github.com/remoodle/remoodle/commit/b8b0fb0e0e08875817c06e6ffd31b5b5bb5107af))

## [0.9.1](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.9.0...remoodle/telegram-bot-v0.9.1) (2024-12-24)


### Bug Fixes

* settings button icon ([e5cae74](https://github.com/remoodle/remoodle/commit/e5cae74fca6624802eb37de876e56dd07ed92b77))

## [0.9.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.8.4...remoodle/telegram-bot-v0.9.0) (2024-12-15)


### Features

* add feedback to assignment grade ([#286](https://github.com/remoodle/remoodle/issues/286)) ([2217d6d](https://github.com/remoodle/remoodle/commit/2217d6de60c660b38c7e2aab471415b393fe97a8))
* new year theme for bot (remove after NY) ([#288](https://github.com/remoodle/remoodle/issues/288)) ([ace7e54](https://github.com/remoodle/remoodle/commit/ace7e5490c7d6931d0da040d9bba3f0efbafb199))

## [0.8.4](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.8.3...remoodle/telegram-bot-v0.8.4) (2024-11-18)


### Bug Fixes

* total calculation ([#272](https://github.com/remoodle/remoodle/issues/272)) ([bf3257a](https://github.com/remoodle/remoodle/commit/bf3257a737600675997ea7d01dccaf2c11701651))


### Miscellaneous Chores

* trigger actions ([d0e77c3](https://github.com/remoodle/remoodle/commit/d0e77c398ce031b41670112c7dc048ace9dff0f9))

## [0.8.3](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.8.2...remoodle/telegram-bot-v0.8.3) (2024-11-13)


### Bug Fixes

* deadlines date ([318c70f](https://github.com/remoodle/remoodle/commit/318c70f2fc26d928cb18523743113fe59fe41aa0))

## [0.8.2](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.8.1...remoodle/telegram-bot-v0.8.2) (2024-11-11)


### Bug Fixes

* gagr ([0dd21e2](https://github.com/remoodle/remoodle/commit/0dd21e2b2ee68cd7886bf68328d3b720ccbdc0fc))
* lint ([3c88fb7](https://github.com/remoodle/remoodle/commit/3c88fb7ae24f13678edd4ad7775065ec425904e7))

## [0.8.1](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.8.0...remoodle/telegram-bot-v0.8.1) (2024-11-10)


### Bug Fixes

* ds command in groups ([ff41aa7](https://github.com/remoodle/remoodle/commit/ff41aa7a9243a3bba1245a4c76f44b59cbc6e01c))
* lint ([4719ee5](https://github.com/remoodle/remoodle/commit/4719ee5e24cc3ce6ffebe313c43ca09d728d816a))

## [0.8.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.7.0...remoodle/telegram-bot-v0.8.0) (2024-11-10)


### Features

* clear button under notification ([#244](https://github.com/remoodle/remoodle/issues/244)) ([b0ea261](https://github.com/remoodle/remoodle/commit/b0ea2618b7bee3fd186050e074e2bffef66fcf83))


### Bug Fixes

* add error handler for webhook ([5456486](https://github.com/remoodle/remoodle/commit/5456486a0f62df6490b2a9a48fcb8356bfa5d909))
* bot crashing ([#241](https://github.com/remoodle/remoodle/issues/241)) ([e275258](https://github.com/remoodle/remoodle/commit/e275258ced24ef6cb304ea8d71096037c9260d62))
* bot umeraet ([c1ebfdc](https://github.com/remoodle/remoodle/commit/c1ebfdc8bba7254980b590bfd6afb2d70c52aa87))


### Miscellaneous Chores

* default deadlines 21 days ([c371e80](https://github.com/remoodle/remoodle/commit/c371e80634bdf37fbcc26cd87d1b1b1d53092da5))


### Code Refactoring

* bot try catch ([b580aa3](https://github.com/remoodle/remoodle/commit/b580aa3967bdcf2a4bbd04893ac0680c2eeda2f6))

## [0.7.0](https://github.com/remoodle/remoodle/compare/remoodle/telegram-bot-v0.6.2...remoodle/telegram-bot-v0.7.0) (2024-10-26)


### Features

* add days limit and filter by courseId for deadlines ([#223](https://github.com/remoodle/remoodle/issues/223)) ([9b7bf2e](https://github.com/remoodle/remoodle/commit/9b7bf2e9ad1462b5db4ebee75ad7f1fcc667d7a4))
* assignments page ([#222](https://github.com/remoodle/remoodle/issues/222)) ([37fc1ca](https://github.com/remoodle/remoodle/commit/37fc1ca0c9247f25fea86de5ae394ef7073382d9))


### Bug Fixes

* ds and assignments text ([b22378c](https://github.com/remoodle/remoodle/commit/b22378c8b0f5185022909ceefe1e8d713f0871f9))
* message not modified bug ([f39d784](https://github.com/remoodle/remoodle/commit/f39d7846617625b542c80d31d83b8e3981b62927))

## [0.6.2](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.6.1...remoodle/telegram-bot-v0.6.2) (2024-10-10)


### Bug Fixes

* return padding ([289f0ba](https://github.com/remoodle/heresy/commit/289f0badb251a4c5f00f95793c279d168e4d5afc))

## [0.6.1](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.6.0...remoodle/telegram-bot-v0.6.1) (2024-10-10)


### Bug Fixes

* change relative time shit ([7003062](https://github.com/remoodle/heresy/commit/7003062d303bc2c475c22f0779ba2a6f0fa402d0))

## [0.6.0](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.5.3...remoodle/telegram-bot-v0.6.0) (2024-10-03)


### Features

* token validation state ([#204](https://github.com/remoodle/heresy/issues/204)) ([f7eed9f](https://github.com/remoodle/heresy/commit/f7eed9f5b39949d1d2d2f335c973bbc9d8c01127))

## [0.5.3](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.5.2...remoodle/telegram-bot-v0.5.3) (2024-10-01)


### Bug Fixes

* do some shit ([cfe0e9f](https://github.com/remoodle/heresy/commit/cfe0e9fc14f28a5fe65b75f386f86360af6d7f4d))

## [0.5.2](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.5.1...remoodle/telegram-bot-v0.5.2) (2024-10-01)


### Bug Fixes

* some basic stuff ([2db3427](https://github.com/remoodle/heresy/commit/2db34273ab7a11c14ed2b7e2a3aec5caa4bfe3d4))

## [0.5.1](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.5.0...remoodle/telegram-bot-v0.5.1) (2024-09-24)


### Bug Fixes

* remove refresh for course grades ([78d29a9](https://github.com/remoodle/heresy/commit/78d29a96205279b20420c527e53d6e99992925bd))

## [0.5.0](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.7...remoodle/telegram-bot-v0.5.0) (2024-09-24)


### Features

* long polling =&gt; webhook ([#180](https://github.com/remoodle/heresy/issues/180)) ([8b91da1](https://github.com/remoodle/heresy/commit/8b91da177f7d1d7a320445bfe9cefe2661383ea3))


### Code Refactoring

* change webhook format ([66a0522](https://github.com/remoodle/heresy/commit/66a0522e30dec63d2e43a6e9dd3b6e18e479058d))

## [0.4.7](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.6...remoodle/telegram-bot-v0.4.7) (2024-09-24)


### Bug Fixes

* change route name ([88fdfa8](https://github.com/remoodle/heresy/commit/88fdfa85e9e061aba1b40b3c605d7cac5da72674))

## [0.4.6](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.5...remoodle/telegram-bot-v0.4.6) (2024-09-23)


### Miscellaneous Chores

* add account button ([a9e5b74](https://github.com/remoodle/heresy/commit/a9e5b74073e82d0dc4d05b6ce7ef6409ff7cc11a))
* remove emoji on delete profile ([8c9bdac](https://github.com/remoodle/heresy/commit/8c9bdac739c350ec35e9e2c7cbe1d7585fed00af))

## [0.4.5](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.4...remoodle/telegram-bot-v0.4.5) (2024-09-14)


### Bug Fixes

* trigger ci to check if its working ([1f686fd](https://github.com/remoodle/heresy/commit/1f686fd44b8a6fbfb543c1b74bbd43db31a87686))

## [0.4.4](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.3...remoodle/telegram-bot-v0.4.4) (2024-09-14)


### Bug Fixes

* correct past courses pagination ([185c5b6](https://github.com/remoodle/heresy/commit/185c5b609f8dd31836397ddb16dd122bf813c8f7))


### Code Refactoring

* simplify telegram bot architecture ([326526a](https://github.com/remoodle/heresy/commit/326526ae52534b7e6414916501bff9557f7ba08a))

## [0.4.3](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.2...remoodle/telegram-bot-v0.4.3) (2024-09-13)


### Bug Fixes

* pagination on past courses ([fe3c443](https://github.com/remoodle/heresy/commit/fe3c443ffdd643d1946758481d1a3189976084f0))
* specify timezone in deadline date ([d01b76c](https://github.com/remoodle/heresy/commit/d01b76c7350ffaccf587fdcab73218c665180dbf))


### Miscellaneous Chores

* add alert on schedule button ([b2c4959](https://github.com/remoodle/heresy/commit/b2c49590fc7f8614cf6d3baea1e9a19f1f725b7a))

## [0.4.2](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.1...remoodle/telegram-bot-v0.4.2) (2024-09-09)


### Bug Fixes

* wording ([bbd06f6](https://github.com/remoodle/heresy/commit/bbd06f632b1181b1d895243e5f213001e727f0aa))
* wording ([a0bea7a](https://github.com/remoodle/heresy/commit/a0bea7adfbe53c2d16b406204749043a74b553c4))


### Code Refactoring

* introduce bullmq ([8c501ec](https://github.com/remoodle/heresy/commit/8c501ec6781322c7f65e1220707a07e8e715401b))

## [0.4.1](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.4.0...remoodle/telegram-bot-v0.4.1) (2024-09-08)


### Bug Fixes

* change card number in donate button ([2fc465a](https://github.com/remoodle/heresy/commit/2fc465ad712ed00cbd27d976ff411dfa63c24a6a))

## [0.4.0](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.3.0...remoodle/telegram-bot-v0.4.0) (2024-09-08)


### Features

* add donation button ([270625a](https://github.com/remoodle/heresy/commit/270625a1e75c1460feb5eb52bcc35f1b0a995e96))


### Miscellaneous Chores

* remove webapps on docs and find token ([29c8843](https://github.com/remoodle/heresy/commit/29c88431960d976a280c421deb2b41ddb36d34b5))

## [0.3.0](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.2.1...remoodle/telegram-bot-v0.3.0) (2024-09-08)


### Features

* add notifications and past courses ([#129](https://github.com/remoodle/heresy/issues/129)) ([3365e29](https://github.com/remoodle/heresy/commit/3365e292552785735303f86235b854ef31d33ff5))

## [0.2.1](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.2.0...remoodle/telegram-bot-v0.2.1) (2024-09-07)


### Code Refactoring

* clean up some shit ([63bca8f](https://github.com/remoodle/heresy/commit/63bca8fe56f6f70f147e1caf779fe159fb62368b))

## [0.2.0](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.1.2...remoodle/telegram-bot-v0.2.0) (2024-09-07)


### Bug Fixes

* update callbacks ([e947231](https://github.com/remoodle/heresy/commit/e947231d0a5324e2e1d2985634792d90d91493e4))


### Miscellaneous Chores

* aaa ([5b6b276](https://github.com/remoodle/heresy/commit/5b6b27695c409b09ade9fbd29c8df57d0d36a65b))

## [0.1.2](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.1.1...remoodle/telegram-bot-v0.1.2) (2024-09-06)


### Bug Fixes

* add error handling ([64f8fd4](https://github.com/remoodle/heresy/commit/64f8fd42290137fc0dcacd218fd13e45ddc4a969))

## [0.1.1](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.1.0...remoodle/telegram-bot-v0.1.1) (2024-09-06)


### Miscellaneous Chores

* **docker:** set UTC+5 time ([c23420d](https://github.com/remoodle/heresy/commit/c23420d4fc73433902debcd51689600c894cb607))
* use VERSION_TAG in docker ([f2e81af](https://github.com/remoodle/heresy/commit/f2e81af6391433c42fb438f83c7969c3151efb29))


### Code Refactoring

* move some stuff to utils ([0a7d590](https://github.com/remoodle/heresy/commit/0a7d590bc5e24bc9a6136b76092fc0346ac68559))

## [0.1.0](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.0.3...remoodle/telegram-bot-v0.1.0) (2024-09-06)


### Features

* add new telegram bot ([#111](https://github.com/remoodle/heresy/issues/111)) ([fa6155c](https://github.com/remoodle/heresy/commit/fa6155c84ece2bc03c88709b8662e52130f48ebe))

## [0.0.3](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.0.2...remoodle/telegram-bot-v0.0.3) (2024-09-04)


### Code Refactoring

* get rid of total shit ([698932e](https://github.com/remoodle/heresy/commit/698932e3b182ce9894de22928f262b6535e9323d))

## [0.0.2](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.0.1...remoodle/telegram-bot-v0.0.2) (2024-09-03)


### Bug Fixes

* update scripts ([59b089c](https://github.com/remoodle/heresy/commit/59b089c33a4c7d1b30e4aed171018ae4bd5441df))

## [0.0.1](https://github.com/remoodle/heresy/compare/remoodle/telegram-bot-v0.0.1...remoodle/telegram-bot-v0.0.1) (2024-09-03)


### Features

* add auth check route ([6d689d8](https://github.com/remoodle/heresy/commit/6d689d8eab35586295f03d70362ef8af25c9309b))
* new db package new otp ([65c9a7b](https://github.com/remoodle/heresy/commit/65c9a7b8972e49683d3eb9b2a2a7f86d09ad2787))


### Bug Fixes

* trigger release ([6c82789](https://github.com/remoodle/heresy/commit/6c827898f0b9090aabd1540494e2b1b6703a5626))


### Miscellaneous Chores

* move .nvmrc to root ([53d28b7](https://github.com/remoodle/heresy/commit/53d28b7bd5e70bb9d67f08ef0a320aa766fda42a))
* **remoodle/backend:** bump backend version ([2f8ab4b](https://github.com/remoodle/heresy/commit/2f8ab4b894d6c9d118469dc0816a7d5dfc9c78dd))
* repo stuff ([c991bfb](https://github.com/remoodle/heresy/commit/c991bfbcd1145a5a8fb3ecfb3fbb10e8026e773a))
* **tgbot:** integrate deploy release pipeline ([1acdaf6](https://github.com/remoodle/heresy/commit/1acdaf6a10b022330c865ff1aa7f6ec3c91f000a))
* trigger release ([c9e6a31](https://github.com/remoodle/heresy/commit/c9e6a3118af88f532b2ca26d827e8316692cad71))
