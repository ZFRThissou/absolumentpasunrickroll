const postgres = require('postgres');

// Connexion à Neon
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

exports.handler = async () => {
    try {
        // On récupère id_meme (le titre) et le nombre de likes
        const stats = await sql`SELECT id_meme, likes FROM stats_memes`;

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Permet d'éviter les soucis de droits
            },
            body: JSON.stringify(stats),
        };
    } catch (error) {
        console.error("Erreur get-stats:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};