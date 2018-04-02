'use strict';

const nmmes = require('nmmes-backend');
const onDeath = require('death');
const Path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');

module.exports = class Sample extends nmmes.Module {
    constructor(args, logger) {
        super(require('./package.json'), logger);

        this.options = Object.assign(nmmes.Module.defaults(Sample), args);

        this.options.length = this.options.length / 1000; // Convert milliseconds to seconds
    }
    async executable(map) {
        let _self = this;
        let options = this.options;
        let video = this.video;

        this.removeDeathListener = onDeath(function(signal, err) {
            if (_self.encoder) {
                _self.logger.trace('Signal receieved:', signal, err);
                _self.encoder.kill(signal);
            }
        });
        if (options.screenshots) {
            this.logger.debug('Generating screenshots...');
            let encoder = this.encoder = ffmpeg(video.output.path);
            await (new Promise((resolve, reject) => {
                encoder
                    .on('filenames', function(filenames) {
                        _self.logger.trace("Generating screenshots:", filenames);
                    })
                    .on('error', function(error, stdout, stderr) {
                        _self.removeDeathListener();
                        reject(error);
                    })
                    .on('end', function(stdout, stderr) {
                        _self.removeDeathListener();
                        resolve();
                    })
                    .screenshots({
                        count: options.screenshots,
                        filename: `%b-%0i[%r].${options['screenshot-format']}`,
                        folder: Path.resolve(video.output.dir, 'screenshots')
                    });
            }));
        }

        if (options.video) {
            let encoder = this.encoder = ffmpeg(video.output.path).outputOptions('-c', 'copy').outputOptions('-map', '0');

            const seek = Sample.calculateSeek(options.seek, options.length, video),
                output = Sample.generateOutputPath(options.output, video.output.path, options.suffix);

            encoder.seekInput(Math.min(video.output.metadata.format.duration - seek, Math.max(0, seek)));

            encoder.duration(options.length);

            encoder.output(output);

            return new Promise(function(resolve, reject) {

                fs.ensureDir(Path.dirname(props.output), err => {
                    if (err)
                        return reject(err);

                    _self.encoder
                        .on('start', function(commandLine) {
                            _self.logger.trace('[FFMPEG] Query:', commandLine);
                        })
                        .on('error', function(error, stdout, stderr) {
                            _self.removeDeathListener();
                            reject(error);
                        })
                        .on('end', function(stdout, stderr) {
                            _self.removeDeathListener();
                            resolve();
                        }).run();
                });
            });
        }
        return {};
    };
    static options() {
        return {
            'length': {
                default: 30000,
                describe: 'Milliseconds to encode in preview mode. Max is half the length of input video.',
                type: 'number',
                group: 'General:'
            },
            'seek': {
                default: 'middle',
                describe: 'Milliseconds/percent to start preview at. Middle will take a preview of the middle of the video.',
                type: 'string',
                group: 'Advanced:'
            },
            'video': {
                default: true,
                describe: 'Create a sample of the finished encode.',
                type: 'boolean',
                group: 'General:'
            },
            'screenshots': {
                default: 0,
                describe: 'Create a number of screenshots of the finished encode. Set to 0 to disable.',
                type: 'number',
                group: 'General:'
            },
            'screenshot-format': {
                default: 'jpeg',
                describe: 'Image format of produced screenshots',
                type: 'string',
                choices: ['jpeg', 'png', 'bmp'],
                group: 'Advanced:'
            },
            'suffix': {
                default: '-sample',
                describe: 'Sample output file suffix.',
                type: 'string',
                group: 'Advanced:'
            },
        };
    }

    // TODO: Make these 2 functions non static
    static generateOutputPath(output, videoPath, suffix = "-sample") {
        let parsed = Path.parse(videoPath);
        if (!output) {
            output = Path.format({
                name: parsed.name + suffix,
                ext: parsed.ext,
                dir: parsed.dir
            });
        }

        // TODO: windows support (D:\ or C:\)
        if (!output.startsWith(Path.sep)) {
            output = Path.resolve(parsed.dir, output);
        }
        return output;
    }

    static calculateSeek(requested, length, video) {
        let duration = video.output.metadata.format.duration;
        if (isNaN(requested)) {
            if (requested.endsWith('%')) {
                return duration * parseInt(requested, 10) / 100;
            } else if (requested === 'middle') {
                return (duration / 2) - (length / 2);
            }
        } else {
            return parseInt(requested) / 1000;
        }
    }
}
