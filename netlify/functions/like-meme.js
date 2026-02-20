const postgres = require('postgres');

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

exports.handler = async (event) => {
    // On récupère le titre du mème passé dans l'URL (?id=titre)
    const memeTitle = event.queryStringParameters.id;

    if (!memeTitle) {
        return { statusCode: 400, body: "Titre du mème manquant" };
    }

    try {
        // ON CONFLICT permet de créer la ligne si le mème n'est pas encore dans la base
        const result = await sql`
            INSERT INTO stats_memes (id_meme, likes)
            VALUES (${memeTitle}, 1)
            ON CONFLICT (id_meme) 
            DO UPDATE SET likes = stats_memes.likes + 1
            RETURNING likes
        `;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nouveauxLikes: result[0].likes }),
        };
    } catch (error) {
        console.error("Erreur like-meme:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
