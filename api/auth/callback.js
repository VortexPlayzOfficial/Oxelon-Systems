const axios = require("axios");

function getCookie(req, name) {
    const cookies = req.headers.cookie || "";

    const match = cookies
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith(`${name}=`));

    if (!match) {
        return null;
    }

    return decodeURIComponent(
        match.substring(name.length + 1)
    );
}

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const {
        code,
        state,
        error
    } = req.query;

    if (error) {
        return res.status(400).json({
            error: "Discord OAuth was cancelled",
            details: error
        });
    }

    if (!code) {
        return res.status(400).json({
            error: "Missing Discord OAuth code"
        });
    }

    const savedState =
        getCookie(req, "oauth_state");

    if (!state || !savedState || state !== savedState) {
        return res.status(400).json({
            error: "Invalid OAuth state"
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
            error: "Discord OAuth environment variables are missing"
        });
    }

    try {
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
         * Store the OAuth token in an HttpOnly cookie.
         *
         * The browser cannot read this cookie from
         * JavaScript, but your API routes can use it.
         */

        const session = Buffer
            .from(
                JSON.stringify({
                    access_token: accessToken,
                    user
                })
            )
            .toString("base64url");

        const isProduction =
            process.env.NODE_ENV === "production";

        const cookies = [
            `oauth_session=${session}`,
            "Path=/",
            "HttpOnly",
            "SameSite=Lax",
            "Max-Age=604800"
        ];

        if (isProduction) {
            cookies.push("Secure");
        }

        res.setHeader(
            "Set-Cookie",
            cookies.join("; ")
        );

        return res.redirect(
            302,
            "/dashboard.html"
        );

    } catch (err) {

        console.error(
            "Discord OAuth error:",
            err.response?.data || err.message
        );

        return res.status(500).json({
            error: "Discord OAuth failed",
            details:
                err.response?.data ||
                err.message
        });
    }
};
