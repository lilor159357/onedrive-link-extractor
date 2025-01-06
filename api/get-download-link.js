const { http, https } = require('follow-redirects');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests are allowed.' });
    }

    const { boxLink } = req.body;

    // Check if boxLink is undefined or empty
    if (!boxLink) {
        return res.status(400).json({ error: "boxLink is missing or undefined." });
    }

    try {
        const protocol = boxLink.startsWith('https') ? https : http;

        // Follow redirects to get the final link
        protocol.get(boxLink, (response) => {
            const finalUrl = response.responseUrl || response.headers.location;

            if (!finalUrl) {
                return res.status(400).json({ error: "Failed to follow redirect. No final URL found." });
            }

            const regex = /https:\/\/app\.box\.com\/file\/(\d+)\?s=([\w-]+)/;
            const match = finalUrl.match(regex);

            if (!match) {
                return res.status(400).json({ error: "Invalid Box file URL format." });
            }

            const fileId = match[1];
            const sharedName = match[2];

            const downloadLink = `https://app.box.com/index.php?rm=box_download_shared_file&shared_name=${sharedName}&file_id=f_${fileId}`;
            res.json({ downloadLink });
        }).on('error', (error) => {
            console.error("Error following redirects:", error);
            res.status(500).json({ error: "An error occurred while following redirects." });
        });
    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: "An unexpected error occurred." });
    }
};
