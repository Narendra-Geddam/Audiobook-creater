const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const audioDirectory = path.join(__dirname, '..', 'public', 'generated-audios');

// Function to merge audio files
function mergeAudios(filenames, outputName, callback) {
    const listFilePath = path.join(__dirname, '..', 'temp.txt');
    const filePaths = filenames.map(filename => `file '${path.join(audioDirectory, filename)}'`).join('\n');

    fs.writeFile(listFilePath, filePaths, (err) => {
        if (err) {
            console.error('Error writing list file for merging:', err);
            return callback(err);
        }

        const outputPath = path.join(audioDirectory, outputName);
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
            callback(null);
        });
    });
}

function mixAudios(audioFile, bgmFile, outputName, callback) {
    const audioPath = path.join(audioDirectory, audioFile);
    const bgmPath = path.join(__dirname, '..', 'public', 'background-music', bgmFile);
    const outputPath = path.join(audioDirectory, outputName);

    console.log(`Mixing: ${audioPath} with ${bgmPath} to ${outputPath}`); // Log paths

    exec(`ffmpeg -i "${audioPath}" -i "${bgmPath}" -filter_complex "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=3" "${outputPath}"`, (error) => {
        if (error) {
            console.error('Error mixing audios:', error);
            return callback(error);
        }

        console.log(`Mixed audio saved to: ${outputPath}`); // Log the output path for debugging
        callback(null);
    });
}
module.exports = {
    mergeAudios,
    mixAudios
};
