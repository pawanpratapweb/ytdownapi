const express = require('express');
const ytdl = require('@distube/ytdl-core');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/video', async (req, res) => {
    const videoId = req.query.url;
    if (!videoId) {
        return res.status(400).send({ error: 'Video ID is required' });
    }

    try {
        const info = await ytdl.getInfo(videoId);
        const formats = info.formats
            .filter(format => {
                const mimeType = format.mimeType || '';
                const isVideo = mimeType.includes('video/');
                const isAudio = mimeType.includes('audio/');
                const isWebm = mimeType.includes('webm');
                const isM3u8 = format.url.endsWith('.m3u8');
                const isApplication = mimeType.startsWith('application/');

                return (isVideo && !isWebm && !isM3u8 && !isApplication) || isAudio;
            })
            .map(format => ({
                url: format.url,
                mimeType: format.mimeType,
                bitrate: format.bitrate,
                qualityLabel: format.qualityLabel || 'N/A', // Add qualityLabel
                width: format.width,
                height: format.height,
                hasVideo: format.hasVideo,
                hasAudio: format.hasAudio,
                contentLength: format.contentLength
            }));

        const videoMetadata = {
            title: info.videoDetails.title,
            description: info.videoDetails.description,
            thumbnailUrl: info.videoDetails.thumbnails[0]?.url,
            duration: info.videoDetails.lengthSeconds,
            views: info.videoDetails.viewCount,
            likes: info.videoDetails.likes,
            dislikes: info.videoDetails.dislikes
        };

        res.send({ formats, videoMetadata });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Failed to get video formats' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on  http://localhost:${port}`);
});
