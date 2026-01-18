exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ 
      message: "Salut ! La fonction Netlify marche super bien !",
      date: new Date().toLocaleDateString()
    }),
  };
};
