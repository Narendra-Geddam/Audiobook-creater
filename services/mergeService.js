const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const audioDirectory = path.join(__dirname, '..', 'public', 'generated-audios');
const mixedAudioDirectory = path.join(__dirname, '..', 'public', 'mixed-audio');

// Ensure the mixed audio directory exists
if (!fs.existsSync(mixedAudioDirectory)) {
    fs.mkdirSync(mixedAudioDirectory, { recursive: true });
}

// Function to merge audio files with a callback
function mergeAudios(filenames, outputName, callback = () => {}) {
    const listFilePath = path.join(__dirname, '..', 'temp.txt');
    const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, filename)}'`).join('\n');

    fs.writeFile(listFilePath, filePaths, (err) => {
        if (err) {
            console.error('Error writing list file for merging:', err);
            return callback(err);
        }

        const outputPath = path.join(audioDirectory, outputName);
        exec(`ffmpeg -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`, (error) => {
            fs.unlink(listFilePath, (unlinkError) => {
                if (unlinkError) console.error('Error deleting list file:', unlinkError);
            });

            if (error) {
                console.error('Error merging audios:', error);
                return callback(error);
            }

            console.log(`Successfully merged audios into: ${outputPath}`);
            callback(null, outputPath);
        });
    });
}

// Function to mix generated audio with BGM
function mixAudios(audioFile, bgmFile, outputName, audioVolume, bgmVolume, callback = () => {}) {
    const audioPath = path.join(audioDirectory, audioFile);
    const bgmPath = path.join(__dirname, '..', 'public', 'background-music', bgmFile);
    const outputPath = path.join(mixedAudioDirectory, outputName);

    const audioVolumeFilter = `volume=${(audioVolume / 100).toFixed(2)}`;
    const bgmVolumeFilter = `volume=${(bgmVolume / 100).toFixed(2)}`;

    console.log(`Mixing: ${audioPath} with ${bgmPath} to ${outputPath}`);

    exec(`ffmpeg -i "${audioPath}" -i "${bgmPath}" -filter_complex "[0:a]${audioVolumeFilter}[a];[1:a]${bgmVolumeFilter}[b];[a][b]amix=inputs=2:duration=first:dropout_transition=3" "${outputPath}"`, (error) => {
        if (error) {
            console.error('Error mixing audios:', error);
            return callback(error);
        }

        console.log(`Mixed audio saved to: ${outputPath}`);
        callback(null, outputPath);
    });
}

// Function to merge audio files with a custom name, returning a promise
function combineAudioFiles(filenames, customName) {
    return new Promise((resolve, reject) => {
        const listFilePath = path.join(__dirname, '..', 'temp.txt');
        const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, filename)}'`).join('\n');

        fs.writeFile(listFilePath, filePaths, (err) => {
            if (err) {
                console.error('Error writing list file for merging:', err);
                return reject(err);
            }

            const outputName = customName ? `${customName}_merged.mp3` : `merged_${Date.now()}.mp3`;
            const outputPath = path.join(audioDirectory, outputName);

            exec(`ffmpeg -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`, (error) => {
                fs.unlink(listFilePath, (unlinkError) => {
                    if (unlinkError) console.error('Error deleting list file:', unlinkError);
                });

                if (error) {
                    console.error('Error merging audios:', error);
                    return reject(error);
                }

                console.log(`Successfully merged audios into: ${outputPath}`);
                resolve(outputPath);
            });
        });
    });
}

module.exports = {
    mergeAudios,
    mixAudios,
    combineAudioFiles,
};
