const postgres = require('postgres');

// On connecte la fonction à Neon
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

exports.handler = async (event) => {
  const nomUtilisateur = event.queryStringParameters.nom;

  try {
    // 1. Si on a un nom, on l'insère
    if (nomUtilisateur) {
      await sql`INSERT INTO visiteurs (nom) VALUES (${nomUtilisateur})`;
    }

    // 2. On récupère la liste
    const visiteurs = await sql`SELECT nom FROM visiteurs ORDER BY created_at DESC`;

    return {
      statusCode: 200,
      body: JSON.stringify({ visiteurs: visiteurs }),
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
