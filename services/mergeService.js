const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const audioDirectory = path.join(__dirname, '..', 'public', 'generated-audios');
const mixedAudioDirectory = path.join(__dirname, '..', 'public', 'mixed-audio');

// Ensure the mixed audio directory exists
if (!fs.existsSync(mixedAudioDirectory)) {
    fs.mkdirSync(mixedAudioDirectory, { recursive: true });
}

// Function to merge audio files
function mergeAudios(filenames, outputName, callback) {
    const listFilePath = path.join(__dirname, '..', 'temp.txt');
    const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, filename)}'`).join('\n');

    fs.writeFile(listFilePath, filePaths, (err) => {
        if (err) {
            console.error('Error writing list file for merging:', err);
            return callback(err);
        }

        const outputPath = path.join(mixedAudioDirectory, outputName); // Save merged audio to mixed-audio folder
        exec(`ffmpeg -f concat -safe 0 -i "${listFilePath}" -c copy "${outputPath}"`, (error) => {
            // Attempt to delete the list file whether there's an error or not
            fs.unlink(listFilePath, (unlinkError) => {
                if (unlinkError) console.error('Error deleting list file:', unlinkError);
            });

            if (error) {
                console.error('Error merging audios:', error);
                return callback(error);
            }

            console.log(`Successfully merged audios into: ${outputPath}`);
            callback(null); // Success callback
        });
    });
}

// Function to mix generated audio with BGM
function mixAudios(audioFile, bgmFile, outputName, audioVolume, bgmVolume, callback) {
    const audioPath = path.join(audioDirectory, audioFile);
    const bgmPath = path.join(__dirname, '..', 'public', 'background-music', bgmFile);
    const outputPath = path.join(mixedAudioDirectory, outputName);

    // Convert volume from percentage (0-100) to a scale suitable for FFmpeg (0-1)
    const audioVolumeFilter = `volume=${(audioVolume / 100).toFixed(2)}`;
    const bgmVolumeFilter = `volume=${(bgmVolume / 100).toFixed(2)}`;

    console.log(`Mixing: ${audioPath} with ${bgmPath} to ${outputPath}`);

    exec(`ffmpeg -i "${audioPath}" -i "${bgmPath}" -filter_complex "[0:a]${audioVolumeFilter}[a];[1:a]${bgmVolumeFilter}[b];[a][b]amix=inputs=2:duration=first:dropout_transition=3" "${outputPath}"`, (error) => {
        if (error) {
            console.error('Error mixing audios:', error);
            return callback(error);
        }

        console.log(`Mixed audio saved to: ${outputPath}`);
        callback(null); // Success callback
    });
}

module.exports = {
    mergeAudios,
    mixAudios
};
