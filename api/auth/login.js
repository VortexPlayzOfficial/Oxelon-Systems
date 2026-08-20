const crypto = require("crypto");

module.exports = async (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return res.status(500).json({
            error: "Discord OAuth environment variables are missing"
        });
    }

    const state = crypto.randomBytes(32).toString("hex");

    const isProduction =
        process.env.NODE_ENV === "production";

    const cookieParts = [
        `oauth_state=${state}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        "Max-Age=600"
    ];

    if (isProduction) {
        cookieParts.push("Secure");
    }

    res.setHeader(
        "Set-Cookie",
        cookieParts.join("; ")
    );

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "identify guilds",
        state
    });

    const discordUrl =
        `https://discord.com/oauth2/authorize?${params.toString()}`;

    return res.redirect(302, discordUrl);
};
