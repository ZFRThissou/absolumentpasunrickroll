const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

exports.handler = async () => {
    try {
        const stats = await sql`SELECT id_meme, likes FROM stats_memes`;
        return {
            statusCode: 200,
            body: JSON.stringify(stats),
        };
    } catch (error) {
        return { statusCode: 500, body: error.message };
    }
};
