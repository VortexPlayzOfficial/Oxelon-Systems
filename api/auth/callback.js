const axios = require("axios");

module.exports = async (req, res) => {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({
                error: "Missing Discord OAuth code"
            });
        }

        const params = new URLSearchParams({
            client_id: process.env.ClientID,
            client_secret: process.env.ClientSecret,
            grant_type: "authorization_code",
            code: code.toString(),
            redirect_uri: "https://oxelon-website1.vercel.app/api/auth/callback"
        });

        const tokenResponse = await axios.post(
            "https://discord.com/api/v10/oauth2/token",
            params.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Discord login successful",
            token_type: tokenResponse.data.token_type
        });

    } catch (error) {
        console.error(
            "Discord OAuth error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            error: "Discord OAuth failed"
        });
    }
};
