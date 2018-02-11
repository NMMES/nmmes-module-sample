'use strict';

const nmmes = require('nmmes-backend');
const Logger = nmmes.Logger;
const Video = nmmes.Video;
const chalk = require('chalk');
const onDeath = require('death');
const Path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const Promise = require('bluebird').config({
    cancellation: true
});

module.exports = class Sample extends nmmes.Module {
    constructor(args) {
        super(require('./package.json'));

        this.options = Object.assign(nmmes.Module.defaults(Sample), args);

        this.options.length = this.options.length / 1000; // Convert milliseconds to seconds
    }
    executable(map) {
        let _self = this;
        let options = this.options;
        let video = this.video;

        this.removeDeathListener = onDeath(function(signal, err) {
            Logger.trace('Signal receieved:', signal, err);
            _self.encoder.kill(signal);
        });

        let encoder = this.encoder = ffmpeg(video.output.path).outputOptions('-c', 'copy').outputOptions('-map', '0');
        return Promise.props({
            seek: Sample.calculateSeek(options.seek, options.length, video),
            output: Sample.generateOutputPath(options.output, video.output.path, options.suffix)
        }).then(props => {
            encoder.seekInput(Math.min(video.output.metadata.format.duration - props.seek, Math.max(0, props.seek)));

            encoder.duration(options.length);

            // TODO: Enable format option
            encoder.format('matroska');

            encoder.output(props.output);

            return new Promise(function(resolve, reject, onCancel) {

                fs.ensureDir(Path.dirname(props.output), err => {
                    if (err)
                        return reject(err);

                    _self.encoder
                        .on('start', function(commandLine) {
                            Logger.trace('[FFMPEG] Query:', commandLine);
                        })
                        .on('error', function(error, stdout, stderr) {
                            Logger.debug('[FFMPEG] STDOUT:\n', stdout, '[FFMPEG] STDERR:\n', stderr);
                            _self.removeDeathListener();
                            reject(error);
                        })
                        .on('end', function(stdout, stderr) {
                            _self.removeDeathListener();
                            resolve();
                        }).run();

                    onCancel(_self.encoder.kill.bind(_self.encoder));
                });
            });
        }).return({});
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
                describe: 'Milliseconds/precent to start preview at. Middle will take a preview of the middle of the video.',
                type: 'string',
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
        return new Promise(function(resolve, reject) {
            let duration = video.output.metadata.format.duration;
            if (isNaN(requested)) {
                if (requested.endsWith('%')) {
                    return resolve(duration * parseInt(requested, 10) / 100);
                } else if (requested === 'middle') {
                    return resolve((duration / 2) - (length / 2));
                }
            } else {
                return resolve(parseInt(requested) / 1000);
            }
        });
    }
}
