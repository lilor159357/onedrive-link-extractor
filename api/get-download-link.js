const { http, https } = require('follow-redirects');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests are allowed.' });
    }

    const { originalLink } = req.body;

    // Check if originalLink is undefined or empty
    if (!originalLink) {
        return res.status(400).json({ error: "originalLink is missing or undefined." });
    }

    try {
        const protocol = originalLink.startsWith('https') ? https : http;

        protocol.get(originalLink, (response) => {
            const redirectedUrl = response.responseUrl || response.headers.location;

            if (!redirectedUrl) {
                return res.status(400).json({ error: "Redirect failed. No redirected URL found." });
            }

            // Extract file ID and shared name from the redirected URL
            const regex = /https:\/\/app\.box\.com\/file\/(\d+)\?s=([\w]+)/;
            const match = redirectedUrl.match(regex);

            if (!match) {
                return res.status(400).json({ error: "Invalid redirected URL format." });
            }

            const fileId = match[1];
            const sharedName = match[2];

            // Construct the final download link
            const downloadLink = `https://app.box.com/index.php?rm=box_download_shared_file&shared_name=${sharedName}&file_id=f_${fileId}`;
            res.json({ downloadLink });
        }).on('error', (error) => {
            console.error("Redirect error:", error);
            res.status(500).json({ error: "An error occurred while following the redirect." });
        });
    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ error: "An error occurred while processing the request." });
    }
};
