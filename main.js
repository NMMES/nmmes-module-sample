'use strict';

const nmmes = require('nmmes-backend');
const Logger = nmmes.Logger;
const chalk = require('chalk');
const onDeath = require('death');
const Path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const Promise = require('bluebird').config({
    cancellation: true
});

/*
 * Arguments
 * seek - (number | string) The position to start the sample at. Options include
 *  the number of milliseconds to seek to, a string percent (Ex. '50%') to seek to,
 *  or 'middle' to seek to 50% - (length / 2)
 * length - (number) The length of the output sample in milliseconds
 * output - (string)
 * suffix - (string)
 */

module.exports = class Sample extends nmmes.Module {
    constructor(args) {
        super(require('./package.json'));

        this.args = Object.assign({
            seek: 'middle',
            length: 30000,
            format: 'matroska'
        }, args);

        this.args.length = this.args.length / 1000; // Convert milliseconds to seconds
    }
    executable(video, map) {
        let _self = this;
        let args = this.args;

        this.removeDeathListener = onDeath(function(signal, err) {
            Logger.trace('Signal receieved:', signal, err);
            _self.encoder.kill(signal);
        });

        let encoder = this.encoder = ffmpeg(video.output.path).outputOptions('-c', 'copy').outputOptions('-map', '0');

        let seek = 0;
        if (typeof args.seek === 'string') {
            if (args.seek.endsWith('%')) {
                seek = video.output.metadata.format.duration * parseInt(args.seek, 10) / 100;
            } else {
                if (args.seek === 'middle') {
                    seek = (video.output.metadata.format.duration / 2) - (args.length / 2);
                }
            }
        } else if (typeof args.seek === 'number') {
            seek = args.seek / 1000;
        }

        encoder.seekInput(Math.min(video.output.metadata.format.duration - seek, Math.max(0, seek)));

        encoder.duration(args.length);

        encoder.format(args.format);

        let output = args.output;

        if (!output) {
            output = Path.format({
                name: video.output.name + '-sample',
                ext: video.output.ext,
                dir: video.output.dir
            });
        }

        if (!output.startsWith(Path.sep)) {
            output = Path.resolve(video.output.dir, output);
        }

        encoder.output(output);

        return new Promise(function(resolve, reject, onCancel) {

            fs.ensureDir(Path.dirname(output), err => {
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
    };
}
