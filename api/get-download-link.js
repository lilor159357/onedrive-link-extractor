const { http, https } = require('follow-redirects');

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests are allowed.' });
    }

    const { iframeCode } = req.body;
    const urlMatch = iframeCode.match(/src="(https:\/\/1drv\.ms\/[^"]+)"/);

    if (!urlMatch || !urlMatch[1]) {
        return res.status(400).json({ error: "No valid 1drv.ms URL found in iframe code." });
    }

    const oneDriveShortUrl = urlMatch[1];
    
    try {
        const protocol = oneDriveShortUrl.startsWith('https') ? https : http;

        const finalUrl = await new Promise((resolve, reject) => {
            protocol.get(oneDriveShortUrl, (response) => {
                const redirectedUrl = response.responseUrl || response.headers.location;
                if (redirectedUrl) {
                    resolve(redirectedUrl);
                } else {
                    reject(new Error("No final URL found."));
                }
            }).on('error', (error) => {
                reject(error);
            });
        });

        const finalUrlObj = new URL(finalUrl);
        const resid = finalUrlObj.searchParams.get("resid");
        const authkey = finalUrlObj.searchParams.get("authkey");

        if (!resid || !authkey) {
            return res.status(400).json({ error: "resid or authkey not found in final URL." });
        }

        const downloadLink = `https://onedrive.live.com/download?resid=${resid}&authkey=${authkey}`;
        res.json({ downloadLink });

    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ error: "An error occurred while following the redirect." });
    }
};
