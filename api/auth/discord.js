export default function handler(req, res) {
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!clientId) {
        return res.status(500).json({
            error: "DISCORD_CLIENT_ID is not configured"
        });
    }

    const redirectUri =
        "https://oxelon-website1.vercel.app/api/auth/callback";

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri: redirectUri,
        scope: "identify guilds"
    });

    const discordUrl =
        `https://discord.com/oauth2/authorize?${params.toString()}`;

    res.redirect(302, discordUrl);
}
