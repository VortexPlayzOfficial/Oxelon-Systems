const axios = require("axios");

function getCookie(req, name) {
    const cookieHeader = req.headers.cookie || "";

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [key, ...value] = cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(value.join("="));
        }
    }

    return null;
}

module.exports = async (req, res) => {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const code = req.query.code;

    if (!code) {
        return res.status(400).json({
            error: "Missing Discord OAuth code"
        });
    }

    const clientId =
        process.env.DISCORD_CLIENT_ID;

    const clientSecret =
        process.env.DISCORD_CLIENT_SECRET;

    const redirectUri =
        process.env.DISCORD_REDIRECT_URI;

    if (
        !clientId ||
        !clientSecret ||
        !redirectUri
    ) {
        return res.status(500).json({
            error: "Missing Discord OAuth environment variables"
        });
    }

    try {

        /*
         * Exchange the Discord authorization code
         * for an access token.
         */

        const tokenResponse =
            await axios.post(
                "https://discord.com/api/v10/oauth2/token",

                new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    grant_type: "authorization_code",
                    code: String(code),
                    redirect_uri: redirectUri
                }).toString(),

                {
                    headers: {
                        "Content-Type":
                            "application/x-www-form-urlencoded"
                    }
                }
            );

        const accessToken =
            tokenResponse.data.access_token;

        if (!accessToken) {
            return res.status(400).json({
                error: "Discord did not return an access token"
            });
        }

        /*
         * Get Discord profile.
         */

        const userResponse =
            await axios.get(
                "https://discord.com/api/v10/users/@me",
                {
                    headers: {
                        Authorization:
                            `Bearer ${accessToken}`
                    }
                }
            );

        const user =
            userResponse.data;

        /*
         * Create the dashboard session.
         */

        const session = Buffer
            .from(
                JSON.stringify({
                    access_token: accessToken,
                    user: user
                })
            )
            .toString("base64url");

        res.setHeader(
            "Set-Cookie",
            `oauth_session=${session}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=604800`
        );

        /*
         * Send them to the dashboard.
         */

        return res.redirect(
            302,
            "/dashboard.html"
        );

    } catch (error) {

        console.error(
            "Discord OAuth failed:",
            error.response?.data ||
            error.message
        );

        return res.status(500).json({
            error: "Discord OAuth failed",
            details:
                error.response?.data ||
                error.message
        });
    }
};
