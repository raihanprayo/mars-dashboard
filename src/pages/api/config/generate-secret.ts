import { NextApiHandler } from 'next';
import crypto from 'crypto';

const GenerateSecretRoute: NextApiHandler = (req, res) => {
    const len = Math.floor(Math.random() * (32 - 16 + 1) + 16);
    res.send(crypto.randomBytes(len).toString('hex'));
};

export default GenerateSecretRoute;
