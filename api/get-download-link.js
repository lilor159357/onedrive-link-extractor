const { http, https } = require('follow-redirects');

module.exports = async (req, res) => {
    console.log("Received request:", req.method); // Log request method
    if (req.method !== 'POST') {
        console.log("Invalid method:", req.method);
        return res.status(405).json({ error: 'Only POST requests are allowed.' });
    }

    const { iframeCode } = req.body;
    console.log("iframeCode received:", iframeCode); // Log iframe code

    const urlMatch = iframeCode.match(/src="(https:\/\/1drv\.ms\/[^"]+)"/);
    if (!urlMatch || !urlMatch[1]) {
        console.log("No valid OneDrive URL found in iframe code.");
        return res.status(400).json({ error: "No valid 1drv.ms URL found in iframe code." });
    }

    const oneDriveShortUrl = urlMatch[1];
    console.log("Extracted OneDrive URL:", oneDriveShortUrl);

    try {
        const protocol = oneDriveShortUrl.startsWith('https') ? https : http;

        const finalUrl = await new Promise((resolve, reject) => {
            protocol.get(oneDriveShortUrl, (response) => {
                const redirectedUrl = response.responseUrl || response.headers.location;
                console.log("Redirected URL:", redirectedUrl); // Log redirected URL
                if (redirectedUrl) {
                    resolve(redirectedUrl);
                } else {
                    reject(new Error("No final URL found."));
                }
            }).on('error', (error) => {
                console.error("HTTP error:", error); // Log error in redirection
                reject(error);
            });
        });

        const finalUrlObj = new URL(finalUrl);
        const resid = finalUrlObj.searchParams.get("resid");
        const authkey = finalUrlObj.searchParams.get("authkey");
        console.log("Resid:", resid, "Authkey:", authkey); // Log resid and authkey

        if (!resid || !authkey) {
            return res.status(400).json({ error: "resid or authkey not found in final URL." });
        }

        const downloadLink = `https://onedrive.live.com/download?resid=${resid}&authkey=${authkey}`;
        console.log("Generated download link:", downloadLink); // Log final download link
        res.json({ downloadLink });

    } catch (error) {
        console.error("Error details:", error);
        res.status(500).json({ error: "An error occurred while following the redirect." });
    }
};
