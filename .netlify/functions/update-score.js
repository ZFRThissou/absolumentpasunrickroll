// update-score.js
const { Client } = require('pg');

const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Méthode non autorisée.' };
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } 
    });
    
    try {
        await client.connect();
        
        const { title, change, type } = JSON.parse(event.body); // 'type' (video, audio, image) sera ajouté

        if (!title || (change !== 1 && change !== -1) || !type) {
            return { statusCode: 400, body: 'Données manquantes ou invalides.' };
        }
        
        // 1. Mise à jour ou insertion :
        // Si le mème existe, on met à jour le score (sans descendre sous 0).
        // Sinon, on insère le mème avec un score de 1 (si c'est un ajout).
        const sql = `
            INSERT INTO memes (title, meme_type, score) 
            VALUES ($1, $2, $3)
            ON CONFLICT (title) 
            DO UPDATE SET score = GREATEST(memes.score + $4, 0)
            RETURNING score;
        `;
        
        // Si c'est un ajout (+1), la valeur initiale sera 1. Si c'est un retrait (-1), elle sera 0.
        const initialScore = (change === 1) ? 1 : 0; 

        const res = await client.query(sql, [title, type, initialScore, change]);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, new_score: res.rows[0].score })
        };

    } catch (error) {
        console.error("Erreur de base de données:", error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: "Échec de la mise à jour du score." })
        };
    } finally {
        await client.end();
    }
};

module.exports = { handler };
