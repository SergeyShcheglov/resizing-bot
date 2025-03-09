module.exports = (req, res) => {
    const body = req.body || {};
    console.log('Webhook request:', JSON.stringify(body));
    res.status(200).send('OK');
  };
