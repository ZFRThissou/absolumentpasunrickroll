exports.handler = async (event, context) => {
  // On récupère le nom envoyé dans l'adresse (ex: ?nom=Julien)
  const nomUtilisateur = event.queryStringParameters.nom || "Inconnu";

  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: `Bravo ${nomUtilisateur} ! Le serveur a reçu ton nom.`,
      status: "Succès"
    }),
  };
};
