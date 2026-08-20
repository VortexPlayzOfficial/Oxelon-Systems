const crypto = require("crypto");

module.exports = (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = process.env.DISCORD_REDIRECT_URI;

    if (!clientId || !redirectUri) {
        return res.status(500).json({
            error: "Missing Discord OAuth environment variables"
        });
    }

    const state = crypto.randomBytes(32).toString("hex");

    res.setHeader(
        "Set-Cookie",
        `oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=600`
    );

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "identify guilds",
        state: state
    });

    const discordUrl =
        `https://discord.com/oauth2/authorize?${params.toString()}`;

    return res.redirect(302, discordUrl);
};
