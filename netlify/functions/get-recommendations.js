// get-recommendations.js
const { Client } = require('pg');

const handler = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const sql = `
            SELECT title, meme_type, score
            FROM memes
            ORDER BY score DESC;
        `;
        
        const res = await client.query(sql);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(res.rows) // Renvoie la liste triée
        };

    } catch (error) {
        console.error("Erreur de base de données:", error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Échec de la récupération des recommandations." })
        };
    } finally {
        await client.end();
    }
};

module.exports = { handler };
