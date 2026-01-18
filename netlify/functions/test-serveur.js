const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
  const nomUtilisateur = event.queryStringParameters.nom;

  // 1. Si on a reçu un nom, on l'enregistre
  if (nomUtilisateur) {
    await supabase.from('visiteurs').insert([{ nom: nomUtilisateur }]);
  }

  // 2. On récupère TOUTE la liste des noms dans la table
  const { data: tousLesVisiteurs, error } = await supabase
    .from('visiteurs')
    .select('nom')
    .order('created_at', { ascending: false }); // Les plus récents en premier

  if (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }

  // 3. On renvoie la liste au site
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: "Liste mise à jour",
      visiteurs: tousLesVisiteurs 
    }),
  };
};
