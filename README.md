# NMMES-module-sample

A module for [nmmes-backend](https://github.com/NMMES/nmmes-backend) that creates a sample video of the output.

## Features
- Create sample of the output video.

## Installation

[![NPM](https://nodei.co/npm/nmmes-module-normalize.png?compact=true)](https://nodei.co/npm/nmmes-module-normalize/)

See https://github.com/NMMES/nmmes-cli/wiki/Modules for additional instructions.

## Options

The `--video` option create a sample of the finished encode.

Type: Boolean<br>
Default: true

---

The `--length` option sets the duration of the sample created.

Type: Number<br>
Default: 30000

---

The `--seek` option defines the milliseconds/percent to start preview at. Middle will take a preview of the middle of the video.

Type: String<br>
Default: middle
Example: 50%
Example: 200000

---

The `--suffix` option defines the sample output file suffix.

Type: String<br>
Default: -sample

---

The `--screenshots` option defines the number of screenshots of the finished encode. Set to 0 to disable.

Type: Number<br>
Default: 0

---

The `--screenshot-format` option sets the format of the output screenshots. Use `--help` to see possible formats.

Type: String<br>
Default: jpeg
