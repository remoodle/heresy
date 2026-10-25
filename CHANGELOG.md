# Changelog

## [2.0.1](https://github.com/remoodle/heresy/compare/remoodle-v2.0.0...remoodle-v2.0.1) (2026-10-25)


### Code Refactoring

* **telegram-bot:** own every user-facing text, including notifications ([#589](https://github.com/remoodle/heresy/issues/589)) ([3678f00](https://github.com/remoodle/heresy/commit/3678f00c9c50df544265943df67d89b448b44deb))

## [2.0.0](https://github.com/remoodle/heresy/compare/remoodle-v1.0.0...remoodle-v2.0.0) (2026-10-25)


### ⚠ BREAKING CHANGES

* the remoodle/remoodle image is replaced by remoodle/server (SERVICE_NAME api|worker, entry dist/bin.mjs) and remoodle/telegram-bot. Both need BOT_API_SECRET; the bot also needs API_URL and CALENDAR_URL.

### Code Refactoring

* **remoodle:** bind repositories to an injected connection behind one database object ([#586](https://github.com/remoodle/heresy/issues/586)) ([38ec268](https://github.com/remoodle/heresy/commit/38ec2681082badb423e6f20ae8e7d9c9fb86b12a))
* **remoodle:** fold shared/ into library/ and split schedule by concern ([#584](https://github.com/remoodle/heresy/issues/584)) ([b14dcf3](https://github.com/remoodle/heresy/commit/b14dcf32d54d9e77a28267be0205428ce5c87e8a))
* split remoodle into server, telegram-bot, and shared ([#587](https://github.com/remoodle/heresy/issues/587)) ([c3385b5](https://github.com/remoodle/heresy/commit/c3385b53845d838fd7817e670e2fbcafd0fbee02))
