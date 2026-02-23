const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

exports.handler = async () => {
    try {
        // On récupère tout pour pouvoir trier côté client
        const stats = await sql`SELECT id_meme, likes, duree, date_ajout FROM stats_memes`;
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stats),
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
