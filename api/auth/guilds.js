const axios = require("axios");

function getSession(req) {
    const cookies =
        req.headers.cookie || "";

    const sessionCookie =
        cookies
            .split(";")
            .map(cookie => cookie.trim())
            .find(cookie =>
                cookie.startsWith("oauth_session=")
            );

    if (!sessionCookie) {
        return null;
    }

    try {
        const value =
            decodeURIComponent(
                sessionCookie.substring(
                    "oauth_session=".length
                )
            );

        return JSON.parse(
            Buffer
                .from(value, "base64url")
                .toString("utf8")
        );

    } catch {
        return null;
    }
}

module.exports = async (req, res) => {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const session =
        getSession(req);

    if (!session?.access_token) {
        return res.status(401).json({
            error: "Not authenticated"
        });
    }

    try {

        /*
         * Get the logged-in Discord user.
         */

        const userResponse =
            await axios.get(
                "https://discord.com/api/v10/users/@me",
                {
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                }
            );

        const user =
            userResponse.data;

        /*
         * Get every Discord server the
         * user belongs to.
         */

        const guildResponse =
            await axios.get(
                "https://discord.com/api/v10/users/@me/guilds",
                {
                    headers: {
                        Authorization:
                            `Bearer ${session.access_token}`
                    }
                }
            );

        const guilds =
            guildResponse.data || [];

        /*
         * Only show servers where the user
         * has administrator permission or
         * Manage Server permission.
         */

        const manageableGuilds =
            guilds
                .filter(guild => {

                    const permissions =
                        BigInt(
                            guild.permissions || "0"
                        );

                    const ADMINISTRATOR =
                        8n;

                    const MANAGE_GUILD =
                        32n;

                    return (
                        (permissions &
                            ADMINISTRATOR) !== 0n
                        ||
                        (permissions &
                            MANAGE_GUILD) !== 0n
                    );

                })
                .map(guild => {

                    let icon = null;

                    if (guild.icon) {
                        icon =
                            `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
                    }

                    return {
                        id: guild.id,
                        name: guild.name,
                        icon,
                        owner: guild.owner,
                        permissions:
                            guild.permissions
                    };

                });

        return res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                global_name:
                    user.global_name || user.username,
                avatar: user.avatar
                    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
                    : null
            },

            guilds: manageableGuilds
        });

    } catch (err) {

        console.error(
            "Guild request failed:",
            err.response?.data || err.message
        );

        if (
            err.response?.status === 401
        ) {
            return res.status(401).json({
                error:
                    "Discord authentication expired"
            });
        }

        return res.status(500).json({
            error: "Failed to load Discord servers"
        });
    }
};
