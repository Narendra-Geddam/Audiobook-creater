const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const audioDirectory = path.join(__dirname, '..', 'public', 'generated-audios');

function mergeAudios(filenames, outputName, callback) {
    const listFilePath = path.join(__dirname, '..', 'temp.txt');
    const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, filename)}'`).join('\n');

    fs.writeFile(listFilePath, filePaths, (err) => {
        if (err) return callback(err);

        const outputPath = path.join(audioDirectory, outputName);
        exec(`ffmpeg -f concat -safe 0 -i ${listFilePath} -c copy ${outputPath}`, (error) => {
            fs.unlink(listFilePath, () => {});
            if (error) return callback(error);
            callback(null);
        });
    });
}

module.exports = {
    mergeAudios,
};
