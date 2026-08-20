import axios from "axios";

export default async function handler(req, res) {
    try {
        const { code } = req.query;

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
            "https://oxelon-website1.vercel.app/api/auth/callback";

        if (!clientId || !clientSecret) {
            return res.status(500).json({
                error: "Discord OAuth environment variables are missing"
            });
        }

        const tokenResponse = await axios.post(
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
            return res.status(500).json({
                error: "Discord did not return an access token"
            });
        }

        /*
         * Get the Discord user.
         */

        const userResponse = await axios.get(
            "https://discord.com/api/v10/users/@me",
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        /*
         * Get the user's Discord servers.
         */

        const guildResponse = await axios.get(
            "https://discord.com/api/v10/users/@me/guilds",
            {
                headers: {
                    Authorization:
                        `Bearer ${accessToken}`
                }
            }
        );

        /*
         * Store the OAuth information in a temporary
         * cookie so the dashboard can request it.
         */

        const session = Buffer.from(
            JSON.stringify({
                user: userResponse.data,
                guilds: guildResponse.data,
                accessToken
            })
        ).toString("base64url");

        res.setHeader(
            "Set-Cookie",
            `oxelon_session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
        );

        /*
         * Send the user back to the dashboard.
         */

        return res.redirect(
            302,
            "/dashboard.html"
        );

    } catch (error) {

        console.error(
            "Discord OAuth error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            error: "Discord OAuth failed",
            details:
                error.response?.data ||
                error.message
        });
    }
}
