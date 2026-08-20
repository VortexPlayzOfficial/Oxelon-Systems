export default function handler(req, res) {

    const cookies =
        req.headers.cookie || "";

    const match =
        cookies.match(
            /oxelon_session=([^;]+)/
        );

    if (!match) {
        return res.status(401).json({
            error: "Not authenticated"
        });
    }

    try {

        const session =
            JSON.parse(
                Buffer.from(
                    match[1],
                    "base64url"
                ).toString()
            );

        return res.status(200).json({
            user: session.user,
            guilds: session.guilds
        });

    } catch {

        return res.status(401).json({
            error: "Invalid session"
        });
    }
}
