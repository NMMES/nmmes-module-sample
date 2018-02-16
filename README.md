# NMMES-module-sample

A module for nmmes-backend that creates a sample video of the output.

### Dependencies

- [nmmes-backend](https://github.com/NMMES/nmmes-backend) - Required in order to run this module.

## Options

The `--length` option sets the duration of the sample created.

Type: Number<br>
Default: 30000

---

The `--seek` option defines the milliseconds/percent to start preview at. Middle will take a preview of the middle of the video.

Type: String<br>
Default: middle
Example: 50%
Example 200000

---

The `--seek` option defines the sample output file suffix.

Type: String<br>
Default: -sample
