# NMMES-module-sample

A module for nmmes-backend that creates a sample video of the output.

### Dependencies

- [nmmes-backend](https://github.com/NMMES/nmmes-backend) - Required in order to run this module.

### Installation
```
npm install -S nmmes-module-sample
yarn add nmmes-module-sample
```

You may install nmmes-module-sample via npm or yarn.

### Usage

You will need to install the encoder module (`nmmes-module-encoder`) for this example.

```javascript
import {Video, Logger} from 'nmmes-backend';
import encoder from 'nmmes-module-encoder';
import sample from 'nmmes-module-sample';

let video = new Video({
    input: {
        path: '/home/user/videos/video.mp4'
    },
    output: {
        path: '/home/user/videos/encoded-video.mkv'
    },
    modules: [new encoder({
        defaults: {
            video: {
                'c:{POS}': 'libx265'
            }
        }
    }), new sample()]
});

video.on('stop', function(err) {
    if (err)
        return Logger.error('Error encoding video', err);

    Logger.log('Video encoding complete.');
});

video.start();
```

## Options

You may pass the sample class an optional options object.

```javascript
new sample({
    seek: 'middle',
    /*
    seek: 'middle'
    Sample that is taken directly from the middle of the video (videoDuration / 2 - (length / 2))
    
    seek: '20%'
    Sample starts 20% of the way through the video

    seek: 60000
    Sample starts exactly 60000 milliseconds (10 minutes) into the video
    */
    length: 30000, // The length of the encode in milliseconds
    format: 'matroska' // Output file format (see https://www.ffmpeg.org/general.html#File-Formats for supported formats)
});
```
