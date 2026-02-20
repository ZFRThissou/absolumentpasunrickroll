const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

exports.handler = async (event) => {
    const memeTitle = event.queryStringParameters.id;
    const action = event.queryStringParameters.action; // "add" ou "remove"

    if (!memeTitle) return { statusCode: 400, body: "Titre manquant" };

    try {
        let result;
        if (action === 'remove') {
            // On décrémente mais on ne descend pas en dessous de 0
            result = await sql`
                UPDATE stats_memes 
                SET likes = GREATEST(0, likes - 1) 
                WHERE id_meme = ${memeTitle}
                RETURNING likes
            `;
        } else {
            // On incrémente (ton code actuel)
            result = await sql`
                INSERT INTO stats_memes (id_meme, likes)
                VALUES (${memeTitle}, 1)
                ON CONFLICT (id_meme) 
                DO UPDATE SET likes = stats_memes.likes + 1
                RETURNING likes
            `;
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nouveauxLikes: result[0]?.likes || 0 }),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
