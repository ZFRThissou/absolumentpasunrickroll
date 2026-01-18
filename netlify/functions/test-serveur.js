const { createClient } = require('@supabase/supabase-js');

// On récupère les codes secrets qu'on a cachés dans Netlify
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event) => {
  const nomUtilisateur = event.queryStringParameters.nom || "Inconnu";

  // ACTION : On insère le nom dans la table "visiteurs"
  const { data, error } = await supabase
    .from('visiteurs')
    .insert([{ nom: nomUtilisateur }]);

  if (error) {
    return { statusCode: 500, body: JSON.stringify(error) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `C'est fait ! ${nomUtilisateur} est enregistré dans la base !` }),
  };
};
