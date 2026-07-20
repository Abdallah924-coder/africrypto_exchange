// Client HTTP interne vers signer-service — le backend ne détient JAMAIS de clé privée.
const SIGNER_URL = process.env.SIGNER_SERVICE_URL || 'http://127.0.0.1:4100';

async function callSigner(path, body) {
  const res = await fetch(`${SIGNER_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-secret': process.env.SIGNER_SHARED_SECRET
    },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur du service de signature');
  return data;
}

const signerClient = {
  derive: (index) => callSigner('/derive', { index }),
  sweep: (index, toAddress) => callSigner('/sweep', { index, toAddress }),
  withdraw: (toAddress, amount) => callSigner('/withdraw', { toAddress, amount })
};

module.exports = signerClient;