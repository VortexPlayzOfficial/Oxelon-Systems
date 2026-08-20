export default async function handler(req, res) {
    const { code } = req.query;

    if (!code) {
        return res.status(400).json({
            error: "Missing Discord OAuth code"
        });
    }

    return res.status(200).json({
        success: true,
        message: "Discord OAuth callback reached",
        code_received: true
    });
}
