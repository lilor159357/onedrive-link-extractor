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

    const regex = /https:\/\/app\.box\.com\/file\/(\d+)\?s=([\w]+)/;
    const match = boxLink.match(regex);

    if (!match) {
        return res.status(400).json({ error: "Invalid Box file URL format." });
    }

    const fileId = match[1];
    const sharedName = match[2];

    try {
        const downloadLink = `https://app.box.com/index.php?rm=box_download_shared_file&shared_name=${sharedName}&file_id=f_${fileId}`;
        res.json({ downloadLink });
    } catch (error) {
        console.error("Error processing Box link:", error);
        res.status(500).json({ error: "An error occurred while processing the Box link." });
    }
};
